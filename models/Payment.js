import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    plan: { type: String, enum: ["30", "90"], required: true },
    currency: { type: String, default: "INR" },
    amount: Number, // final, in major units
    listPrice: Number,
    discount: { type: Number, default: 0 },
    coupon: String,
    provider: { type: String, default: "free" }, // "free" while there are no real payments
    orderId: String,
    paymentId: String,
    status: { type: String, enum: ["created", "paid", "failed"], default: "created", index: true },
    paidAt: Date,
  },
  { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
