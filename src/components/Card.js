import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";

export default function Card({
  productId,
  categoryName,
  name,
  img,
  options = [],
  description,
  restaurant = null, // Restaurant info { _id, restaurantName, deliveryFee, minimumOrder }
}) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedPrice, setSelectedPrice] = useState(0);

  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  // Get all available sizes and prices from options
  const getSizeOptions = () => {
    const sizes = [];
    options.forEach((option, idx) => {
      if (option?.half)
        sizes.push({ size: "half", price: option.half, key: `half-${idx}` });
      if (option?.full)
        sizes.push({ size: "full", price: option.full, key: `full-${idx}` });
      if (option?.regular)
        sizes.push({
          size: "regular",
          price: option.regular,
          key: `regular-${idx}`,
        });
      if (option?.medium)
        sizes.push({
          size: "medium",
          price: option.medium,
          key: `medium-${idx}`,
        });
      if (option?.large)
        sizes.push({ size: "large", price: option.large, key: `large-${idx}` });
    });
    return sizes;
  };

  const sizeOptions = getSizeOptions();

  useEffect(() => {
    // Set default size
    if (sizeOptions.length > 0 && !selectedSize) {
      setSelectedSize(sizeOptions[0].size);
      setSelectedPrice(sizeOptions[0].price);
    }
  }, [sizeOptions, selectedSize]);

  const handleSizeChange = (e) => {
    const size = e.target.value;
    setSelectedSize(size);
    const option = sizeOptions.find((opt) => opt.size === size);
    if (option) {
      setSelectedPrice(option.price);
    }
  };

  const handleAddToCart = () => {
    if (!selectedSize || !selectedPrice) return;
    if (!restaurant) {
      console.error("Restaurant info is required to add to cart");
      return;
    }

    addToCart(
      {
        id: productId,
        name,
        img,
        size: selectedSize,
        price: selectedPrice,
        quantity,
      },
      restaurant
    );
  };

  const handleToggleFavorite = () => {
    toggleFavorite(
      {
        _id: productId,
        CategoryName: categoryName,
        name,
        img,
        options,
        description,
      },
      restaurant
    );
  };

  const totalPrice = selectedPrice * quantity;

  return (
    <div>
      <div className="card mt-3" style={{ width: "18rem" }}>
        <div className="position-relative">
          <img
            src={img}
            className="card-img-top"
            alt="Dish"
            style={{ height: "18em", objectFit: "cover" }}
            data-testid="card-img"
          />
          <button
            className="btn position-absolute"
            style={{
              top: "10px",
              right: "10px",
              background: "rgba(255,255,255,0.8)",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              padding: "0",
            }}
            onClick={handleToggleFavorite}
            title={isFavorite(productId) ? "Remove from favorites" : "Add to favorites"}
          >
            <span
              style={{
                color: isFavorite(productId) ? "red" : "gray",
                fontSize: "20px",
              }}
            >
              {isFavorite(productId) ? "♥" : "♡"}
            </span>
          </button>
        </div>
        <div className="card-body">
          <h5 className="card-title" data-testid="card-title">
            {name}
          </h5>
          <p className="card-text text-muted small" data-testid="card-category">
            {categoryName}
          </p>
          <p
            className="card-text small"
            data-testid="card-description"
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {description}
          </p>
          <div className="d-flex align-items-center mb-2">
            <select
              className="form-select form-select-sm me-2"
              style={{ width: "70px" }}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              data-testid="card-quantity"
            >
              {Array.from(Array(6), (e, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
            <select
              className="form-select form-select-sm"
              value={selectedSize}
              onChange={handleSizeChange}
              data-testid="card-options"
            >
              {sizeOptions.map((option) => (
                <option key={option.key} value={option.size}>
                  {option.size} - Rs. {option.price}
                </option>
              ))}
            </select>
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <span className="fs-5 fw-bold" data-testid="total-price">
              Rs. {totalPrice}
            </span>
            <button
              className="btn btn-success btn-sm"
              onClick={handleAddToCart}
              disabled={!selectedSize}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
