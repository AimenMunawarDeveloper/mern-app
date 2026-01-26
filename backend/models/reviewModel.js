import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "products",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: { type: String },
    images: [{ type: String }],
    isVerifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Ensure one review per user per product
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

const reviewModel = mongoose.model("reviews", reviewSchema);
export default reviewModel;
