import mongoose from "mongoose";

const variationOptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: String, required: true },
  priceModifier: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  sku: { type: String },
  image: { type: String },
  isActive: { type: Boolean, default: true }
}, { _id: true });

const variationSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Size", "Color", "Storage"
  options: [variationOptionSchema]
}, { _id: true });

const productVariationSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true
  },
  variations: [variationSchema],
  // Combination pricing (for complex variations)
  combinations: [{
    sku: { type: String, required: true },
    options: {
      type: Map,
      of: String
    }, // { "Color": "Red", "Size": "M" }
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    stock: { type: Number, default: 0 },
    image: { type: String },
    barcode: { type: String },
    weight: { type: Number }, // in grams
    isActive: { type: Boolean, default: true }
  }],
  // Common fields
  basePrice: { type: Number },
  totalStock: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 5 }
}, {
  timestamps: true
});

// Calculate total stock from all combinations
productVariationSchema.methods.calculateTotalStock = function () {
  if (this.combinations && this.combinations.length > 0) {
    this.totalStock = this.combinations.reduce((sum, combo) => sum + (combo.stock || 0), 0);
  } else if (this.variations && this.variations.length > 0) {
    this.totalStock = this.variations.reduce((total, variation) => {
      return total + variation.options.reduce((sum, opt) => sum + (opt.stock || 0), 0);
    }, 0);
  }
  return this.totalStock;
};

// Find combination by options
productVariationSchema.methods.findCombination = function (options) {
  if (!this.combinations || this.combinations.length === 0) return null;

  return this.combinations.find(combo => {
    const comboOptions = combo.options;
    if (!comboOptions) return false;

    for (const [key, value] of Object.entries(options)) {
      if (comboOptions.get(key) !== value) return false;
    }
    return true;
  });
};

productVariationSchema.index({ productId: 1 }, { unique: true });

export const ProductVariation = mongoose.model("ProductVariation", productVariationSchema);

