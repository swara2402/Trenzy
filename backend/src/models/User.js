import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  label: { type: String, default: "Home" },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String, default: "" },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, default: "USA" },
  isDefault: { type: Boolean, default: false },
});

const cartItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const browsingHistorySchema = new mongoose.Schema({
  productId: { type: String, required: true },
  viewedAt: { type: Date, default: Date.now },
});

const userPreferenceSchema = new mongoose.Schema({
  categories: { type: [String], default: [] },
  brands: { type: [String], default: [] },
  priceRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100000 },
  },
  tags: { type: [String], default: [] },
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true, minlength: 2, maxlength: 40 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["buyer", "vendor", "admin"], default: "buyer" },
    isAdmin: { type: Boolean, default: false }, // Keeping for backwards-compatibility temporary
    monthlyBudget: { type: Number, default: 0, min: 0 },
    currentMonthSpending: { type: Number, default: 0, min: 0 },
    cart: { type: [cartItemSchema], default: [] },
    wishlist: { type: [String], default: [] },
    addresses: { type: [addressSchema], default: [] },
    browsingHistory: { type: [browsingHistorySchema], default: [] },
    preferences: { type: userPreferenceSchema, default: () => ({}) },
    purchaseHistory: { type: [String], default: [] },
    groups: { type: [String], default: [] },
  },
  { timestamps: true }
);

// No explicit index needed as unique: true is set in the schema definition
// userSchema.index({ email: 1 }, { unique: true });

export const User = mongoose.model("User", userSchema);

