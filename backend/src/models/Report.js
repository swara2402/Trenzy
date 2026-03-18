import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  reporterId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  reportType: { 
    type: String, 
    enum: ["product", "seller", "review", "order", "user"],
    required: true 
  },
  reportedItemId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  reportedItemType: { 
    type: String, 
    required: true 
  }, // Name of the model (Product, Seller, etc.)
  reason: { 
    type: String, 
    required: true,
    enum: [
      "fake_product",
      "prohibited_item",
      "intellectual_property",
      "inappropriate_content",
      "fraudulent_seller",
      "scam",
      "fake_reviews",
      "price_gouging",
      "shipping_issues",
      "not_as_described",
      "harassment",
      "spam",
      "other"
    ]
  },
  description: { 
    type: String, 
    required: true,
    maxlength: 2000 
  },
  evidence: [{ 
    type: String 
  }], // URLs or file paths
  status: { 
    type: String, 
    enum: ["pending", "under_review", "resolved", "dismissed", "action_taken"],
    default: "pending" 
  },
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }, // Admin handling the case
  resolution: { 
    type: String, 
    enum: ["warning_issued", "content_removed", "account_suspended", "account_banned", "no_action", "false_report"],
    default: null 
  },
  resolutionNotes: { 
    type: String, 
    default: "" 
  },
  resolvedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  resolvedAt: { type: Date },
  adminNotes: { type: String, default: "" },
}, { 
  timestamps: true 
});

// Prevent duplicate reports
reportSchema.index({ reporterId: 1, reportedItemId: 1 }, { unique: true });
reportSchema.index({ reportType: 1, status: 1 });
reportSchema.index({ createdAt: -1 });

export const Report = mongoose.model("Report", reportSchema);

