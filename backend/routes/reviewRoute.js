import express from "express";
import {
  addReview,
  getProductReviews,
  updateReview,
  deleteReview,
  getUserReviews,
} from "../controllers/reviewController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const reviewRouter = express.Router();

// Public route - get product reviews
reviewRouter.get("/product/:productId", getProductReviews);

// Protected routes
reviewRouter.post("/add", authMiddleware, addReview);
reviewRouter.put("/:reviewId", authMiddleware, updateReview);
reviewRouter.delete("/:reviewId", authMiddleware, deleteReview);
reviewRouter.get("/user", authMiddleware, getUserReviews);

export default reviewRouter;
