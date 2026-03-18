import mongoose from "mongoose";

const pageViewSchema = new mongoose.Schema({
  page: { type: String, required: true },
  referrer: { type: String, default: "" },
  sessionId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  timestamp: { type: Date, default: Date.now },
  deviceType: { type: String, default: "desktop" },
  browser: { type: String, default: "" },
}, { 
  _id: false 
});

const productViewSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  sessionId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  source: { type: String, enum: ["search", "category", "recommendation", "direct", "cart", "wishlist"], default: "direct" },
  timestamp: { type: Date, default: Date.now },
  duration: { type: Number, default: 0 }, // seconds spent on product page
}, { 
  _id: false 
});

const cartActionSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  sessionId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  action: { type: String, enum: ["add", "remove", "update"], required: true },
  quantity: { type: Number, default: 1 },
  timestamp: { type: Date, default: Date.now },
  source: { type: String, default: "" }, // where the action was performed
}, { 
  _id: false 
});

const searchQuerySchema = new mongoose.Schema({
  query: { type: String, required: true },
  sessionId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  resultsCount: { type: Number, default: 0 },
  clickedProductId: { type: String, default: null },
  timestamp: { type: Date, default: Date.now },
}, { 
  _id: false 
});

const cartAbandonmentSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  cartValue: { type: Number, default: 0 },
  itemCount: { type: Number, default: 0 },
  abandonedAt: { type: Date, default: Date.now },
  recoveryAttempted: { type: Boolean, default: false },
  recoveredAt: { type: Date, default: null },
}, { 
  _id: false 
});

const analyticsSchema = new mongoose.Schema({
  date: { 
    type: String, 
    required: true,
    index: true // Format: YYYY-MM-DD
  },
  pageViews: { type: Number, default: 0 },
  uniqueVisitors: { type: Number, default: 0 },
  productViews: { type: Number, default: 0 },
  cartAdditions: { type: Number, default: 0 },
  cartRemovals: { type: Number, default: 0 },
  searchesPerformed: { type: Number, default: 0 },
  successfulSearches: { type: Number, default: 0 },
  ordersPlaced: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  cartAbandonments: { type: Number, default: 0 },
  cartRecoveries: { type: Number, default: 0 },
  newUsers: { type: Number, default: 0 },
  returningUsers: { type: Number, default: 0 },
}, { 
  timestamps: true 
});

// Static method to get today's analytics or create new
analyticsSchema.statics.getToday = async function() {
  const today = new Date().toISOString().split("T")[0];
  let analytics = await this.findOne({ date: today });
  
  if (!analytics) {
    analytics = await this.create({ date: today });
  }
  
  return analytics;
};

// Static method to increment a counter
analyticsSchema.statics.increment = async function(field, amount = 1) {
  const today = new Date().toISOString().split("T")[0];
  return this.findOneAndUpdate(
    { date: today },
    { $inc: { [field]: amount } },
    { upsert: true, new: true }
  );
};

// Analytics model for daily aggregations
export const DailyAnalytics = mongoose.model("DailyAnalytics", analyticsSchema);

// Real-time tracking models (keep recent data for analysis)
export const PageView = mongoose.model("PageView", pageViewSchema);
export const ProductView = mongoose.model("ProductView", productViewSchema);
export const CartAction = mongoose.model("CartAction", cartActionSchema);
export const SearchQuery = mongoose.model("SearchQuery", searchQuerySchema);
export const CartAbandonment = mongoose.model("CartAbandonment", cartAbandonmentSchema);

