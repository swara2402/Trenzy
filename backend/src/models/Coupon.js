import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    default: ""
  },
  discountType: {
    type: String,
    enum: ["percentage", "fixed", "freeShipping"],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minimumOrderValue: {
    type: Number,
    default: 0,
    min: 0
  },
  maximumDiscount: {
    type: Number,
    default: null
  },
  applicableCategories: [{
    type: String
  }],
  applicableProducts: [{
    type: String
  }],
  applicableSellers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Seller"
  }],
  usageLimit: {
    type: Number,
    default: null
  },
  usageCount: {
    type: Number,
    default: 0
  },
  userUsageLimit: {
    type: Number,
    default: 1
  },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFirstOrderOnly: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  // New customer acquisition
  newCustomerOnly: {
    type: Boolean,
    default: false
  },
  // BxGO (Buy X Get Y)
  buyQuantity: { type: Number, default: null },
  getQuantity: { type: Number, default: null },
  getProductId: { type: String, default: null },
}, {
  timestamps: true
});

// Check if coupon is valid
couponSchema.methods.isValid = function () {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.validFrom &&
    now <= this.validUntil &&
    (this.usageLimit === null || this.usageCount < this.usageLimit)
  );
};

// Calculate discount
couponSchema.methods.calculateDiscount = function (orderTotal, userOrderCount = 0) {
  if (!this.isValid()) {
    return { valid: false, message: "Coupon is not valid" };
  }

  // Check minimum order value
  if (orderTotal < this.minimumOrderValue) {
    return {
      valid: false,
      message: `Minimum order value of ₹${this.minimumOrderValue} required`
    };
  }

  // Check user usage limit
  if (userOrderCount >= this.userUsageLimit) {
    return { valid: false, message: "You have already used this coupon" };
  }

  // Check first order only
  if (this.isFirstOrderOnly && userOrderCount > 0) {
    return { valid: false, message: "This coupon is for first order only" };
  }

  let discount = 0;
  switch (this.discountType) {
    case "percentage":
      discount = (orderTotal * this.discountValue) / 100;
      if (this.maximumDiscount !== null) {
        discount = Math.min(discount, this.maximumDiscount);
      }
      break;
    case "fixed":
      discount = Math.min(this.discountValue, orderTotal);
      break;
    case "freeShipping":
      discount = 0; // Handle in shipping calculation
      break;
  }

  return {
    valid: true,
    discount: Math.round(discount * 100) / 100,
    discountType: this.discountType
  };
};

// Redundant index removed as code has unique: true in field definition
// couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ validFrom: 1, validUntil: 1 });
couponSchema.index({ isActive: 1 });

export const Coupon = mongoose.model("Coupon", couponSchema);

