import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import { useFavorites } from "../context/FavoritesContext";

export default function Favorites() {
  const { favorites, removeFromFavorites } = useFavorites();
  const [toast, setToast] = React.useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const handleRemoveFavorite = (productId, productName) => {
    removeFromFavorites(productId);
    showToast(`${productName} removed from favorites`, "success");
  };

  // Group favorites by restaurant - filter out items without proper restaurant info
  const groupedFavorites = favorites.reduce((acc, product) => {
    // Only include items that have valid restaurant info
    if (!product.restaurant || !product.restaurant._id || !product.restaurant.restaurantName) {
      return acc;
    }
    
    const restaurantId = product.restaurant._id;
    if (!acc[restaurantId]) {
      acc[restaurantId] = {
        restaurant: product.restaurant,
        items: [],
      };
    }
    acc[restaurantId].items.push(product);
    return acc;
  }, {});

  // Get starting price from options
  const getStartingPrice = (options) => {
    if (!options || options.length === 0) return 0;
    const prices = [];
    options.forEach((opt) => {
      if (opt.half) prices.push(opt.half);
      if (opt.full) prices.push(opt.full);
      if (opt.regular) prices.push(opt.regular);
      if (opt.medium) prices.push(opt.medium);
      if (opt.large) prices.push(opt.large);
    });
    return prices.length > 0 ? Math.min(...prices) : 0;
  };

  // Check if there are any valid grouped favorites
  const hasValidFavorites = Object.keys(groupedFavorites).length > 0;

  return (
    <div className="page-wrapper">
      <Header />
      <div className="container py-4 flex-grow-1">
        <h2 className="mb-4">My Favorites</h2>

        {!hasValidFavorites ? (
          <div className="text-center py-5">
            <h4>No favorites yet</h4>
            <p className="text-muted">
              Start adding items to your favorites by clicking the heart icon on
              any dish!
            </p>
            <Link to="/" className="btn btn-success">
              Browse Restaurants
            </Link>
          </div>
        ) : (
          Object.entries(groupedFavorites).map(([restaurantId, group]) => (
            <div key={restaurantId} className="mb-5">
              {/* Restaurant Header */}
              <div className="card bg-light mb-3">
                <div className="card-body py-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      {group.restaurant.restaurantImage && (
                        <img
                          src={group.restaurant.restaurantImage}
                          alt={group.restaurant.restaurantName}
                          className="rounded me-3"
                          style={{ width: "50px", height: "50px", objectFit: "cover" }}
                        />
                      )}
                      <div>
                        <h5 className="mb-0 text-success">{group.restaurant.restaurantName}</h5>
                        {group.restaurant.cuisineType && (
                          <small className="text-muted">{group.restaurant.cuisineType}</small>
                        )}
                      </div>
                    </div>
                    <Link
                      to={`/restaurant/${group.restaurant._id}`}
                      className="btn btn-success btn-sm"
                    >
                      Order from Restaurant
                    </Link>
                  </div>
                </div>
              </div>

              {/* Favorite Items - Clickable Cards */}
              <div className="row">
                {group.items.map((product, index) => (
                  <div key={`${product._id}-${index}`} className="col-md-6 col-lg-4 mb-3">
                    <div className="card h-100 favorite-card">
                      <Link
                        to={`/restaurant/${group.restaurant._id}`}
                        className="text-decoration-none"
                      >
                        <img
                          src={product.img || "https://via.placeholder.com/300x180?text=Food"}
                          className="card-img-top"
                          alt={product.name}
                          style={{ height: "150px", objectFit: "cover" }}
                        />
                      </Link>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start">
                          <Link
                            to={`/restaurant/${group.restaurant._id}`}
                            className="text-decoration-none text-dark"
                          >
                            <h6 className="card-title mb-1">{product.name}</h6>
                          </Link>
                          <button
                            className="btn btn-link p-0 text-danger"
                            onClick={() => handleRemoveFavorite(product._id, product.name)}
                            title="Remove from favorites"
                            style={{ fontSize: "1.2rem" }}
                          >
                            ♥
                          </button>
                        </div>
                        <p className="text-muted small mb-2">
                          {product.CategoryName || product.categoryName}
                        </p>
                        <p
                          className="card-text small text-muted"
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {product.description || "Delicious dish from this restaurant"}
                        </p>
                        <div className="d-flex justify-content-between align-items-center mt-2">
                          <span className="text-success fw-bold">
                            From Rs. {getStartingPrice(product.options)}
                          </span>
                          <Link
                            to={`/restaurant/${group.restaurant._id}`}
                            className="btn btn-outline-success btn-sm"
                          >
                            View Menu
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Toast */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <Footer />

      <style>{`
        .favorite-card {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .favorite-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.1) !important;
        }
      `}</style>
    </div>
  );
}
