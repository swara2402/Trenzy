import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
  friendId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vote: { type: String, enum: ['like', 'dislike'], required: true },
  comment: { type: String, maxlength: 500 },
  votedAt: { type: Date, default: Date.now }
}, { _id: false });

const suggestionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  productId: { type: String, required: true },
  askerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  votes: [voteSchema],
  status: { type: String, enum: ['pending', 'active', 'closed'], default: 'pending' },
  summary: { 
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 }
  }
}, { timestamps: true });

export const Suggestion = mongoose.model("Suggestion", suggestionSchema);
