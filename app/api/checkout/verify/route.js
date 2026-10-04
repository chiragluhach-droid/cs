import { NextResponse, after } from "next/server";
import { requireUser, bad } from "@/lib/auth";
import { fulfill, queueFirstPlan, verifyRazorpaySignature, razorpayEnabled, paymentsEnabled } from "@/lib/billing";
import Payment from "@/models/Payment";

export async function POST(req) {
  const [user, err] = await requireUser();
  if (err) return err;
  const b = await req.json().catch(() => ({}));
  const payment = await Payment.findOne({ _id: b.paymentId, user: user._id });
  if (!payment) return bad("Payment not found", 404);

  if (payment.provider === "free") {
    if (paymentsEnabled()) return bad("Free access has ended. Please choose a paid plan.");
    payment.paymentId = "free_" + Date.now();
  } else if (payment.provider === "razorpay") {
    if (!verifyRazorpaySignature(payment.orderId, b.razorpay_payment_id, b.razorpay_signature)) {
      payment.status = "failed";
      await payment.save();
      return bad("Payment could not be verified");
    }
    payment.paymentId = b.razorpay_payment_id;
  } else if (razorpayEnabled() || (process.env.NODE_ENV === "production" && process.env.ALLOW_TEST_PAYMENTS !== "true")) {
    return bad("Test payments are disabled");
  } else {
    payment.paymentId = "test_" + Date.now();
  }

  const newUser = await fulfill(payment);
  if (newUser) after(() => queueFirstPlan(newUser));
  return NextResponse.json({ ok: true });
}
