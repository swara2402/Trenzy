import mongoose from "mongoose";

const priceHistoryEntrySchema = new mongoose.Schema(
  {
    price: { type: Number, required: true, min: 0 },
    recordedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    category: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
    image: { type: String, required: true },
    images: { type: [String], default: [] },
    description: { type: String, default: "" },
    features: { type: [String], default: [] },
    inStock: { type: Boolean, default: true },
    stock: { type: Number, default: 100, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    popularity: { type: Number, default: 0, min: 0 },
    priceHistory: { type: [priceHistoryEntrySchema], default: [] },
  },
  { timestamps: true }
);

// No explicit index needed as unique: true is set in the schema definition
// productSchema.index({ id: 1 }, { unique: true });

export const Product = mongoose.model("Product", productSchema);
