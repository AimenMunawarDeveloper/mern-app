import React, { useState, useEffect } from "react";
import axios from "axios";
import Rating from "./Rating";
import ReviewForm from "./ReviewForm";

const ReviewList = ({ productId, productName }) => {
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/review/product/${productId}`
      );
      if (response.data.success) {
        setReviews(response.data.reviews);
        setAvgRating(response.data.avgRating);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAdded = (newReview) => {
    setReviews([newReview, ...reviews]);
    // Recalculate average
    const newTotal = reviews.reduce((sum, r) => sum + r.rating, 0) + newReview.rating;
    setAvgRating(Math.round((newTotal / (reviews.length + 1)) * 10) / 10);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      dateStyle: "medium",
    });
  };

  if (loading) {
    return <p>Loading reviews...</p>;
  }

  return (
    <div className="reviews-section">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Reviews for {productName}</h5>
        <Rating rating={avgRating} totalReviews={reviews.length} size="large" />
      </div>

      <ReviewForm productId={productId} onReviewAdded={handleReviewAdded} />

      <hr />

      {reviews.length === 0 ? (
        <p className="text-muted">No reviews yet. Be the first to review!</p>
      ) : (
        reviews.map((review) => (
          <div key={review._id} className="border-bottom pb-3 mb-3">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <strong>{review.userId?.name || "Anonymous"}</strong>
                {review.isVerifiedPurchase && (
                  <span className="badge bg-success ms-2">
                    Verified Purchase
                  </span>
                )}
              </div>
              <small className="text-muted">
                {formatDate(review.createdAt)}
              </small>
            </div>
            <Rating rating={review.rating} />
            {review.comment && <p className="mt-2 mb-0">{review.comment}</p>}
          </div>
        ))
      )}
    </div>
  );
};

export default ReviewList;
