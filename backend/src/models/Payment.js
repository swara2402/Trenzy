import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Order", 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  razorpayPaymentId: { type: String, default: null },
  razorpayOrderId: { type: String, default: null },
  razorpaySignature: { type: String, default: null },
  amount: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  currency: { 
    type: String, 
    default: "INR" 
  },
  status: { 
    type: String, 
    enum: ["pending", "completed", "failed", "refunded", "captured"],
    default: "pending"
  },
  method: { 
    type: String, 
    enum: ["card", "upi", "netbanking", "wallet", "cod"],
    default: "card"
  },
  cardLast4: { type: String, default: null },
  cardBrand: { type: String, default: null },
  bank: { type: String, default: null },
  wallet: { type: String, default: null },
  vpa: { type: String, default: null }, // UPI address
  transactionFee: { type: Number, default: 0 },
  gatewayResponse: { type: mongoose.Schema.Types.Mixed, default: {} },
  errorCode: { type: String, default: null },
  errorDescription: { type: String, default: null },
  refundedAmount: { type: Number, default: 0 },
  refundedAt: { type: Date, default: null },
  processedAt: { type: Date, default: null },
}, { 
  timestamps: true 
});

// Index for efficient queries
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ razorpayPaymentId: 1 });
paymentSchema.index({ status: 1 });

export const Payment = mongoose.model("Payment", paymentSchema);

