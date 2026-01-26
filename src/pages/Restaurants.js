import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import axios from "axios";

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("All");

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/restaurant/list"
      );
      if (response.data.success) {
        setRestaurants(response.data.restaurants);
      } else {
        setError("Failed to fetch restaurants");
      }
    } catch (err) {
      console.error("Error fetching restaurants:", err);
      setError("An error occurred while fetching restaurants.");
    } finally {
      setLoading(false);
    }
  };

  // Get unique cuisine types
  const cuisines = [
    "All",
    ...new Set(restaurants.map((r) => r.cuisineType).filter(Boolean)),
  ];

  // Filter restaurants
  const filteredRestaurants = restaurants.filter((restaurant) => {
    const matchesSearch =
      restaurant.restaurantName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      restaurant.cuisineType
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      restaurant.description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesCuisine =
      selectedCuisine === "All" || restaurant.cuisineType === selectedCuisine;

    return matchesSearch && matchesCuisine;
  });

  return (
    <div className="page-wrapper">
      <Header />

      {/* Hero Section */}
      <div
        className="bg-success text-white py-5"
        style={{
          background: "linear-gradient(135deg, #198754 0%, #0d6efd 100%)",
        }}
      >
        <div className="container text-center">
          <h1 className="display-4 fw-bold mb-3">Hungry? We've got you covered!</h1>
          <p className="lead mb-4">
            Order from the best restaurants in your city
          </p>

          {/* Search Bar */}
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="input-group input-group-lg">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search restaurants or cuisines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="btn btn-light" type="button">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4" style={{ minHeight: "60vh" }}>
        {/* Cuisine Filter */}
        <div className="mb-4">
          <div className="d-flex flex-wrap justify-content-center gap-2">
            {cuisines.map((cuisine) => (
              <button
                key={cuisine}
                className={`btn ${
                  selectedCuisine === cuisine
                    ? "btn-success"
                    : "btn-outline-success"
                }`}
                onClick={() => setSelectedCuisine(cuisine)}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Finding restaurants near you...</p>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <p className="text-center text-muted mb-4">
              {filteredRestaurants.length} restaurants found
            </p>

            {filteredRestaurants.length === 0 ? (
              <div className="text-center py-5">
                <h4>No restaurants found</h4>
                <p className="text-muted">
                  Try a different search or cuisine filter
                </p>
              </div>
            ) : (
              <div className="row">
                {filteredRestaurants.map((restaurant) => (
                  <div key={restaurant._id} className="col-md-6 col-lg-4 mb-4">
                    <Link
                      to={`/restaurant/${restaurant._id}`}
                      className="text-decoration-none"
                    >
                      <div
                        className={`card h-100 shadow-sm restaurant-card ${
                          !restaurant.isOpen ? "restaurant-closed" : ""
                        }`}
                      >
                        <div className="position-relative">
                          <img
                            src={
                              restaurant.restaurantImage ||
                              "https://via.placeholder.com/400x200?text=Restaurant"
                            }
                            className="card-img-top"
                            alt={restaurant.restaurantName}
                            style={{
                              height: "180px",
                              objectFit: "cover",
                              filter: !restaurant.isOpen ? "grayscale(100%)" : "none",
                            }}
                          />
                          {!restaurant.isOpen && (
                            <div
                              className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                              style={{ background: "rgba(100,100,100,0.7)" }}
                            >
                              <span className="badge bg-secondary fs-5">
                                Currently Closed
                              </span>
                            </div>
                          )}
                          {restaurant.isOpen && (
                            <span
                              className="position-absolute top-0 end-0 m-2 badge bg-success"
                              style={{ fontSize: "0.9rem" }}
                            >
                              {restaurant.deliveryTime}
                            </span>
                          )}
                        </div>
                        <div className={`card-body ${!restaurant.isOpen ? "bg-light" : ""}`}>
                          <div className="d-flex justify-content-between align-items-start">
                            <h5 className={`card-title mb-1 ${!restaurant.isOpen ? "text-secondary" : "text-dark"}`}>
                              {restaurant.restaurantName}
                            </h5>
                            <span className={`badge ${restaurant.totalRatings > 0 ? "bg-warning text-dark" : "bg-secondary"}`}>
                              ⭐ {restaurant.rating?.toFixed(1) || "0.0"} ({restaurant.totalRatings || 0})
                            </span>
                          </div>
                          <p className="text-muted small mb-2">
                            {restaurant.cuisineType || "Multi-cuisine"}
                          </p>
                          <p
                            className="card-text text-muted small"
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {restaurant.description ||
                              "Delicious food delivered to your doorstep"}
                          </p>
                          <hr />
                          <div className="d-flex justify-content-between align-items-center small">
                            <span className="text-muted">
                              Min. Order: Rs. {restaurant.minimumOrder || 200}
                            </span>
                            <span className="text-success">
                              Delivery: Rs. {restaurant.deliveryFee || 150}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <Footer />

      <style>{`
        .restaurant-card {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .restaurant-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
        }
        .restaurant-closed {
          opacity: 0.8;
          border-color: #dee2e6 !important;
        }
        .restaurant-closed:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.1) !important;
        }
        .restaurant-closed .card-body {
          background-color: #f8f9fa;
        }
      `}</style>
    </div>
  );
}
