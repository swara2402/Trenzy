import mongoose from "mongoose";

const sellerVerificationSchema = new mongoose.Schema({
  verified: { type: Boolean, default: false },
  verifiedAt: { type: Date, default: null },
  verificationDocuments: [{ type: String }],
  businessLicense: { type: String },
  taxId: { type: String },
});

const sellerStatsSchema = new mongoose.Schema({
  totalSales: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  totalProducts: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  returnRate: { type: Number, default: 0 },
}, { _id: false });

const sellerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  shopName: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  shopSlug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    default: "",
    maxlength: 1000
  },
  logo: { type: String, default: "" },
  banner: { type: String, default: "" },
  contactEmail: { type: String },
  contactPhone: { type: String },
  returnPolicy: {
    type: String,
    default: "We offer 30-day returns for most products."
  },
  shippingPolicy: {
    type: String,
    default: "Standard shipping takes 3-7 business days."
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedAt: { type: Date, default: null },
  verificationDocuments: [{ type: String }],
  businessLicense: { type: String },
  taxId: { type: String },
  commissionRate: {
    type: Number,
    default: 10, // 10% platform commission
    min: 0,
    max: 100
  },
  stats: {
    type: sellerStatsSchema,
    default: () => ({})
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedAt: { type: Date, default: null },
  blockReason: { type: String, default: "" },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String, default: "India" },
  },
  bankDetails: {
    accountName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    bankName: { type: String },
  },
  payoutSettings: {
    payoutFrequency: { type: String, enum: ["daily", "weekly", "monthly"], default: "weekly" },
    minimumPayout: { type: Number, default: 500 },
  },
}, {
  timestamps: true
});

// Generate shop slug from shop name
sellerSchema.statics.generateSlug = function (shopName) {
  return shopName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    + "-" + Date.now().toString(36);
};

// Indexes
// Redundant index removed as shopSlug has unique: true in field definition
// sellerSchema.index({ shopSlug: 1 }, { unique: true });
sellerSchema.index({ verified: 1 });
sellerSchema.index({ isActive: 1 });
sellerSchema.index({ "stats.totalRevenue": -1 });

export const Seller = mongoose.model("Seller", sellerSchema);

