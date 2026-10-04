import { NextResponse } from "next/server";
import { requireUser, bad } from "@/lib/auth";
import { quote, razorpayEnabled, paymentsEnabled, createRazorpayOrder } from "@/lib/billing";
import Payment from "@/models/Payment";

export async function POST(req) {
  const [user, err] = await requireUser();
  if (err) return err;
  if (!user.onboarded) return bad("Finish your profile first");
  const { plan, currency, coupon } = await req.json().catch(() => ({}));
  let q;
  try { q = await quote(plan, currency, coupon); } catch (e) { return bad(e.message); }

  // Free early access: record a ₹0 "payment" so the subscription flow stays the same
  if (!paymentsEnabled()) {
    const payment = await Payment.create({
      user: user._id, plan: q.plan.id, currency: q.currency, amount: 0, listPrice: q.listPrice, discount: q.listPrice, provider: "free",
    });
    return NextResponse.json({ mode: "free", paymentId: payment._id, amount: 0, currency: q.currency });
  }

  const payment = await Payment.create({
    user: user._id, plan: q.plan.id, currency: q.currency, amount: q.amount, listPrice: q.listPrice,
    discount: q.discount, coupon: q.coupon?.code, provider: razorpayEnabled() ? "razorpay" : "test",
  });

  if (!razorpayEnabled()) return NextResponse.json({ mode: "test", paymentId: payment._id, amount: q.amount, currency: q.currency });

  try {
    const order = await createRazorpayOrder(q.amount, q.currency, String(payment._id));
    payment.orderId = order.id;
    await payment.save();
    return NextResponse.json({
      mode: "razorpay", paymentId: payment._id, orderId: order.id, keyId: process.env.RAZORPAY_KEY_ID,
      amount: order.amount, currency: q.currency, name: user.name, email: user.email, contact: user.profile?.phone,
    });
  } catch (e) {
    payment.status = "failed";
    await payment.save();
    return bad(e.message, 502);
  }
}
