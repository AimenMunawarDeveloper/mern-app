import reviewModel from "../models/reviewModel.js";
import orderModel from "../models/orderModel.js";

// Add a review
const addReview = async (req, res) => {
  try {
    const { productId, rating, comment, images } = req.body;

    // Check if user has purchased this product
    const hasOrdered = await orderModel.findOne({
      userId: req.userId,
      "items.productId": productId,
      orderStatus: "delivered",
    });

    // Check if user already reviewed this product
    const existingReview = await reviewModel.findOne({
      userId: req.userId,
      productId,
    });

    if (existingReview) {
      return res.json({
        success: false,
        message: "You have already reviewed this order",
      });
    }

    const review = await reviewModel.create({
      userId: req.userId,
      productId,
      rating,
      comment,
      images: images || [],
      isVerifiedPurchase: !!hasOrdered,
    });

    const populatedReview = await reviewModel
      .findById(review._id)
      .populate("userId", "name");

    res.json({ success: true, review: populatedReview });
  } catch (error) {
    console.error("Add review error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get reviews for a product
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await reviewModel
      .find({ productId })
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    res.json({
      success: true,
      reviews,
      avgRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Update a review
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment, images } = req.body;

    const review = await reviewModel.findOne({
      _id: reviewId,
      userId: req.userId,
    });

    if (!review) {
      return res.json({
        success: false,
        message: "Review not found or unauthorized",
      });
    }

    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    if (images) review.images = images;

    await review.save();

    const populatedReview = await reviewModel
      .findById(review._id)
      .populate("userId", "name");

    res.json({ success: true, review: populatedReview });
  } catch (error) {
    console.error("Update review error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Delete a review
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await reviewModel.findOneAndDelete({
      _id: reviewId,
      userId: req.userId,
    });

    if (!review) {
      return res.json({
        success: false,
        message: "Review not found or unauthorized",
      });
    }

    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete review error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get user's reviews
const getUserReviews = async (req, res) => {
  try {
    const reviews = await reviewModel
      .find({ userId: req.userId })
      .populate("productId", "name img")
      .sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch (error) {
    console.error("Get user reviews error:", error);
    res.json({ success: false, message: error.message });
  }
};

export {
  addReview,
  getProductReviews,
  updateReview,
  deleteReview,
  getUserReviews,
};
