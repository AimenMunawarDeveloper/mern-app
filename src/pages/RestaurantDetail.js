import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Card from "../components/Card";
import { useCart } from "../context/CartContext";
import axios from "axios";

export default function RestaurantDetail() {
  const { restaurantId } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { cart, restaurant: cartRestaurant } = useCart();

  useEffect(() => {
    fetchRestaurantData();
  }, [restaurantId]);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      const [restaurantRes, menuRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/restaurant/${restaurantId}`),
        axios.get(`http://localhost:5000/api/restaurant/${restaurantId}/menu`),
      ]);

      if (restaurantRes.data.success) {
        setRestaurant(restaurantRes.data.restaurant);
      } else {
        setError("Restaurant not found");
      }

      if (menuRes.data.success) {
        setProducts(menuRes.data.products);
        setCategories(["All", ...menuRes.data.categories]);
      }
    } catch (err) {
      console.error("Error fetching restaurant:", err);
      setError("Failed to load restaurant details");
    } finally {
      setLoading(false);
    }
  };

  // Filter products by category
  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((p) => p.categoryName === selectedCategory);

  // Check if cart has items from a different restaurant
  const hasDifferentRestaurantItems =
    cart.length > 0 && cartRestaurant && cartRestaurant._id !== restaurantId;

  if (loading) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="container py-5 text-center flex-grow-1">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading restaurant...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="container py-5 text-center flex-grow-1">
          <h3>{error || "Restaurant not found"}</h3>
          <Link to="/" className="btn btn-success mt-3">
            Browse Restaurants
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Header />

      {/* Restaurant Header */}
      <div
        className="position-relative"
        style={{
          height: "250px",
          background: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${
            restaurant.restaurantImage ||
            "https://via.placeholder.com/1200x400?text=Restaurant"
          }) center/cover`,
        }}
      >
        <div className="container h-100 d-flex align-items-end pb-4">
          <div className="text-white">
            <h1 className="fw-bold mb-2">{restaurant.restaurantName}</h1>
            <p className="mb-2">
              <span className="badge bg-success me-2">
                {restaurant.cuisineType || "Multi-cuisine"}
              </span>
              <span className="badge bg-warning text-dark me-2">
                ⭐ {restaurant.rating?.toFixed(1) || "New"} ({restaurant.totalRatings || 0} reviews)
              </span>
              {!restaurant.isOpen && (
                <span className="badge bg-danger">Closed</span>
              )}
            </p>
            <p className="mb-0 small">
              {restaurant.restaurantAddress || "Address not available"}
            </p>
          </div>
        </div>
      </div>

      {/* Restaurant Info Bar */}
      <div className="bg-light py-3 border-bottom">
        <div className="container">
          <div className="row text-center">
            <div className="col-md-4">
              <strong>Delivery Time</strong>
              <p className="mb-0 text-success">{restaurant.deliveryTime}</p>
            </div>
            <div className="col-md-4">
              <strong>Minimum Order</strong>
              <p className="mb-0 text-success">Rs. {restaurant.minimumOrder}</p>
            </div>
            <div className="col-md-4">
              <strong>Delivery Fee</strong>
              <p className="mb-0 text-success">Rs. {restaurant.deliveryFee}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Warning if cart has items from different restaurant */}
      {hasDifferentRestaurantItems && (
        <div className="container mt-3">
          <div className="alert alert-warning d-flex justify-content-between align-items-center">
            <span>
              You have items from <strong>{cartRestaurant.restaurantName}</strong> in your cart.
              Adding items from this restaurant will clear your current cart.
            </span>
            <Link to="/cart" className="btn btn-outline-warning btn-sm">
              View Cart
            </Link>
          </div>
        </div>
      )}

      <div className="container py-4" style={{ minHeight: "50vh" }}>
        {/* Category Filter */}
        <div className="mb-4">
          <h5 className="mb-3">Menu</h5>
          <div className="d-flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                className={`btn ${
                  selectedCategory === category
                    ? "btn-success"
                    : "btn-outline-success"
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Products Count */}
        <p className="text-muted">
          {filteredProducts.length} items
          {selectedCategory !== "All" && ` in ${selectedCategory}`}
        </p>

        {/* Products Grid */}
        {!restaurant.isOpen ? (
          <div className="text-center py-5">
            <h4 className="text-muted">Restaurant is currently closed</h4>
            <p>Please check back later</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-5">
            <h4 className="text-muted">No items available</h4>
            <p>This restaurant hasn't added any items yet</p>
          </div>
        ) : (
          <div className="d-flex flex-wrap justify-content-around gap-4">
            {filteredProducts.map((product) => (
              <Card
                key={product._id}
                productId={product._id}
                categoryName={product.categoryName}
                name={product.name}
                img={product.img}
                options={product.options || []}
                description={product.description}
                restaurant={{
                  _id: restaurant._id,
                  restaurantName: restaurant.restaurantName,
                  deliveryFee: restaurant.deliveryFee,
                  minimumOrder: restaurant.minimumOrder,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
