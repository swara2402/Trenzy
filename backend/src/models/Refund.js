import mongoose from "mongoose";

const refundItemSchema = new mongoose.Schema({
  orderItemId: { type: String, required: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  productImage: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  subtotal: { type: Number, required: true },
}, { _id: false });

const refundSchema = new mongoose.Schema({
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
  items: { 
    type: [refundItemSchema], 
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: "At least one item is required for refund"
    }
  },
  reason: { 
    type: String, 
    required: true,
    enum: [
      "defective_product",
      "wrong_item",
      "not_as_described",
      "changed_mind",
      "better_price_found",
      "delivery_issues",
      "other"
    ]
  },
  description: { 
    type: String, 
    default: "",
    maxlength: 1000 
  },
  images: [{ type: String }], // Images uploaded by user showing the issue
  
  // Refund status
  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected", "processing", "completed", "cancelled"],
    default: "pending"
  },
  
  // Resolution
  refundAmount: { 
    type: Number, 
    required: true,
    min: 0 
  },
  refundMethod: { 
    type: String, 
    enum: ["original_payment", "store_credit", "bank_transfer"],
    default: "original_payment"
  },
  bankDetails: {
    accountNumber: { type: String },
    ifscCode: { type: String },
    accountHolderName: { type: String }
  },
  
  // Tracking
  approvedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  approvedAt: { type: Date },
  processedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  processedAt: { type: Date },
  
  // Admin notes
  adminNotes: { type: String, default: "" },
  rejectionReason: { type: String, default: "" },
  
  // Timeline
  statusHistory: [{
    status: { type: String },
    timestamp: { type: Date, default: Date.now },
    note: { type: String }
  }],
  
  // Resolution evidence
  returnTrackingNumber: { type: String },
  returnCourier: { type: String },
  refundTransactionId: { type: String },
  refundProcessedAt: { type: Date },
}, { 
  timestamps: true 
});

// Update status with history
refundSchema.methods.updateStatus = async function(newStatus, note = "", userId = null) {
  this.status = newStatus;
  this.statusHistory.push({ 
    status: newStatus, 
    timestamp: new Date(), 
    note 
  });
  
  if (newStatus === "approved") {
    this.approvedAt = new Date();
    if (userId) this.approvedBy = userId;
  } else if (newStatus === "processed" || newStatus === "completed") {
    this.processedAt = new Date();
    if (userId) this.processedBy = userId;
  } else if (newStatus === "rejected") {
    this.rejectionReason = note;
  }
  
  await this.save();
  return this;
};

// Calculate refund amount
refundSchema.statics.calculateRefundAmount = async function(orderId, items) {
  const Order = mongoose.model("Order");
  const order = await Order.findById(orderId);
  
  if (!order) {
    throw new Error("Order not found");
  }
  
  let refundAmount = 0;
  const refundItems = [];
  
  for (const item of items) {
    const orderItem = order.items.find(i => i.productId === item.productId);
    if (!orderItem) {
      continue;
    }
    
    const quantity = Math.min(item.quantity, orderItem.quantity);
    const subtotal = orderItem.productPrice * quantity;
    refundAmount += subtotal;
    
    refundItems.push({
      orderItemId: orderItem._id,
      productId: orderItem.productId,
      productName: orderItem.productName,
      productImage: orderItem.productImage,
      quantity,
      price: orderItem.productPrice,
      subtotal
    });
  }
  
  return { refundAmount, refundItems };
};

refundSchema.index({ orderId: 1 });
refundSchema.index({ userId: 1, createdAt: -1 });
refundSchema.index({ status: 1 });

export const Refund = mongoose.model("Refund", refundSchema);

