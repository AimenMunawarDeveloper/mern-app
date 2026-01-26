import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const ReviewForm = ({ productId, onReviewAdded }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { isAuthenticated } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/review/add",
        {
          productId,
          rating,
          comment,
        }
      );

      if (response.data.success) {
        setRating(0);
        setComment("");
        if (onReviewAdded) {
          onReviewAdded(response.data.review);
        }
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add review");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <p className="text-muted">
        Please <a href="/login">login</a> to write a review.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <h6>Write a Review</h6>

      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      {/* Star Rating Input */}
      <div className="mb-3">
        <label className="form-label">Your Rating</label>
        <div>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              style={{
                cursor: "pointer",
                fontSize: "24px",
                color:
                  star <= (hoverRating || rating) ? "#ffc107" : "#ddd",
              }}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
            >
              ★
            </span>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label htmlFor="comment" className="form-label">
          Your Review (Optional)
        </label>
        <textarea
          className="form-control"
          id="comment"
          rows="3"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this dish..."
        ></textarea>
      </div>

      <button type="submit" className="btn btn-success" disabled={loading}>
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
};

export default ReviewForm;
