import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
  },
  { timestamps: true }
);

reviewSchema.index({ productId: 1 });
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const Review = mongoose.model("Review", reviewSchema);
