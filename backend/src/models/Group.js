import mongoose from "mongoose";

const groupPreferenceSchema = new mongoose.Schema({
  categories: { type: [String], default: [] },
  brands: { type: [String], default: [] },
  priceRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100000 },
  },
  tags: { type: [String], default: [] },
}, { _id: false });

const groupSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, maxlength: 500 },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now }
  }],
  preferences: { type: groupPreferenceSchema, default: {} },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const Group = mongoose.model("Group", groupSchema);

