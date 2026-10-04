import crypto from "crypto";
import User from "@/models/User";
import Coupon from "@/models/Coupon";
import Plan from "@/models/Plan";
import Notification from "@/models/Notification";
import { PLANS, applyCoupon, couponValid } from "./pricing";
import { generatePlan, coachName } from "./plans";

export const razorpayEnabled = () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
// Payments are off unless PAYMENTS_ENABLED=true. While off, checkout gives free early access (no charge).
export const paymentsEnabled = () => process.env.PAYMENTS_ENABLED === "true";

export async function quote(planId, currency, code) {
  const plan = PLANS[planId];
  if (!plan) throw new Error("Unknown plan");
  const cur = currency === "USD" ? "USD" : "INR";
  let coupon = null;
  if (code) {
    coupon = await Coupon.findOne({ code: String(code).toUpperCase().trim() });
    if (!couponValid(coupon)) coupon = null;
  }
  const { final, discount } = applyCoupon(plan[cur], coupon, cur);
  return { plan, currency: cur, listPrice: plan[cur], discount, amount: final, coupon };
}

export async function createRazorpayOrder(amount, currency, receipt) {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const r = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "content-type": "application/json" },
    body: JSON.stringify({ amount: Math.round(amount * 100), currency, receipt }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.description || "Could not start payment");
  return j;
}

export function verifyRazorpaySignature(orderId, paymentId, signature) {
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
  return signature && expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// Marks the payment paid, starts/extends the subscription, queues the first plan.
// Returns the user so the caller can kick off plan generation after responding.
export async function fulfill(payment) {
  if (payment.status === "paid") return null;
  payment.status = "paid";
  payment.paidAt = new Date();
  await payment.save();
  if (payment.coupon) await Coupon.updateOne({ code: payment.coupon }, { $inc: { uses: 1 } });

  const user = await User.findById(payment.user);
  const days = PLANS[payment.plan].days;
  const now = new Date();
  const from = user.subscription?.status === "active" && user.subscription.endsAt > now ? user.subscription.endsAt : now;
  user.subscription = { plan: payment.plan, status: "active", startsAt: user.subscription?.status === "active" ? user.subscription.startsAt : now, endsAt: new Date(from.getTime() + days * 86400000) };
  await user.save();

  const hasPlan = await Plan.exists({ user: user._id });
  await Notification.create({
    user: user._id,
    kind: "coach",
    title: hasPlan ? "Renewed, let's keep going 💪" : `Welcome in, ${user.name.split(" ")[0]}! 👋`,
    body: hasPlan
      ? "Thanks for sticking with it. Your plan continues as normal."
      : `I've got everything you shared and I'm building your plan now. You'll get it within 24 hours, usually much sooner. — ${coachName()}`,
  });
  return hasPlan ? null : user;
}

export async function queueFirstPlan(user) {
  try {
    await generatePlan(user, { reason: "initial" });
  } catch (e) {
    console.error("[billing] plan generation failed", e);
  }
}
