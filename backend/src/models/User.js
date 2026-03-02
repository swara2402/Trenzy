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

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true, minlength: 2, maxlength: 40 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    cart: { type: [cartItemSchema], default: [] },
    wishlist: { type: [String], default: [] },
    addresses: { type: [addressSchema], default: [] },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });

export const User = mongoose.model("User", userSchema);

