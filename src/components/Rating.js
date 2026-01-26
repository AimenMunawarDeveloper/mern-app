import React from "react";

const Rating = ({ rating, totalReviews, size = "small" }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  const starSize = size === "small" ? "14px" : "20px";

  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars.push(
        <span key={i} style={{ color: "#ffc107", fontSize: starSize }}>
          ★
        </span>
      );
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars.push(
        <span key={i} style={{ color: "#ffc107", fontSize: starSize }}>
          ★
        </span>
      );
    } else {
      stars.push(
        <span key={i} style={{ color: "#ddd", fontSize: starSize }}>
          ★
        </span>
      );
    }
  }

  return (
    <div className="d-flex align-items-center">
      <span>{stars}</span>
      {rating > 0 && (
        <span className="ms-1 text-muted" style={{ fontSize: starSize }}>
          {rating.toFixed(1)}
        </span>
      )}
      {totalReviews !== undefined && (
        <span className="ms-1 text-muted" style={{ fontSize: starSize }}>
          ({totalReviews})
        </span>
      )}
    </div>
  );
};

export default Rating;
