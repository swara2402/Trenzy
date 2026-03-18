import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  productImage: { type: String, required: true },
  productPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true, min: 0 },
}, { _id: false });

const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String, default: "" },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, default: "USA" },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: function (v) {
        return v && v.length > 0;
      },
      message: "Order must have at least one item"
    }
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  shippingAddress: {
    type: shippingAddressSchema,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ["card", "upi", "cod", "razorpay"],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending"
  },
  paymentId: {
    type: String,
    default: null
  },
  orderStatus: {
    type: String,
    enum: ["placed", "processing", "shipped", "delivered", "cancelled"],
    default: "placed"
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ["placed", "processing", "shipped", "delivered", "cancelled"]
    },
    timestamp: { type: Date, default: Date.now },
    note: { type: String, default: "" }
  }],
  shippedAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
  cancelledAt: { type: Date, default: null },
  cancellationReason: { type: String, default: "" },
  notes: { type: String, default: "" },
  trackingNumber: { type: String, default: "" },
  estimatedDelivery: { type: Date, default: null },
}, {
  timestamps: true
});

// Generate unique order number
orderSchema.statics.generateOrderNumber = function () {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// Update status with history
orderSchema.methods.updateStatus = async function (newStatus, note = "") {
  this.orderStatus = newStatus;
  this.statusHistory.push({ status: newStatus, timestamp: new Date(), note });

  if (newStatus === "shipped") {
    this.shippedAt = new Date();
  } else if (newStatus === "delivered") {
    this.deliveredAt = new Date();
  } else if (newStatus === "cancelled") {
    this.cancelledAt = new Date();
  }

  await this.save();
  return this;
};

// Index for efficient queries
orderSchema.index({ userId: 1, createdAt: -1 });
// Removed redundant index on orderNumber as it already has unique: true in schema
// orderSchema.index({ orderNumber: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });

export const Order = mongoose.model("Order", orderSchema);

