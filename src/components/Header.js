import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { getCartCount } = useCart();
  const { user, isAuthenticated, isRestaurant, isRider, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Check if current path matches
  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  // Determine if user is customer (not restaurant or rider)
  const isCustomer = isAuthenticated && !isRestaurant && !isRider;

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-success">
        <div className="container-fluid">
          <Link className="navbar-brand fs-2" to={isRider ? "/rider/dashboard" : "/"}>
            FoodHub
            {isRider && <small className="ms-2 fs-6 opacity-75">Rider</small>}
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              {!isRider && (
                <li className="nav-item">
                  <Link
                    className={`nav-link ${isActive("/") && !isActive("/restaurant") && !isActive("/rider") ? "active-page fw-bold" : ""}`}
                    to="/"
                  >
                    Home
                  </Link>
                </li>
              )}
              {isCustomer && (
                <>
                  <li className="nav-item">
                    <Link
                      className={`nav-link ${isActive("/orders") ? "active-page fw-bold" : ""}`}
                      to="/orders"
                    >
                      My Orders
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className={`nav-link ${isActive("/favorites") ? "active-page fw-bold" : ""}`}
                      to="/favorites"
                    >
                      Favorites
                    </Link>
                  </li>
                </>
              )}
              {isRestaurant && (
                <>
                  <li className="nav-item">
                    <Link
                      className={`nav-link ${isActive("/restaurant/dashboard") ? "active-page fw-bold" : ""}`}
                      to="/restaurant/dashboard"
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className={`nav-link ${isActive("/restaurant/menu") ? "active-page fw-bold" : ""}`}
                      to="/restaurant/menu"
                    >
                      Menu
                    </Link>
                  </li>
                </>
              )}
              {isRider && (
                <li className="nav-item">
                  <Link
                    className={`nav-link ${isActive("/rider/dashboard") ? "active-page fw-bold" : ""}`}
                    to="/rider/dashboard"
                  >
                    Dashboard
                  </Link>
                </li>
              )}
            </ul>

            <ul className="navbar-nav align-items-center">
              {/* Cart Icon - only show for customers */}
              {isCustomer && (
                <li className="nav-item me-3">
                  <Link
                    className={`nav-link position-relative ${isActive("/cart") ? "active-page" : ""}`}
                    to="/cart"
                    style={{ fontSize: "1.2rem" }}
                  >
                    🛒
                    {getCartCount() > 0 && (
                      <span
                        className="position-absolute translate-middle badge rounded-pill bg-danger"
                        style={{ top: "5px", right: "-10px", fontSize: "0.7rem" }}
                      >
                        {getCartCount()}
                      </span>
                    )}
                  </Link>
                </li>
              )}

              {isAuthenticated ? (
                <>
                  <li className="nav-item dropdown me-2">
                    <button
                      className="nav-link dropdown-toggle btn btn-link text-white"
                      id="userDropdown"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      style={{ textDecoration: "none" }}
                    >
                      {isRider && "🛵 "}
                      {user?.name?.split(" ")[0] || "Account"}
                    </button>
                    <ul
                      className="dropdown-menu dropdown-menu-end"
                      aria-labelledby="userDropdown"
                    >
                      {isRestaurant && (
                        <>
                          <li>
                            <span className="dropdown-item text-success fw-bold">
                              {user?.restaurantName}
                            </span>
                          </li>
                          <li>
                            <hr className="dropdown-divider" />
                          </li>
                          <li>
                            <Link className="dropdown-item" to="/restaurant/dashboard">
                              Dashboard
                            </Link>
                          </li>
                          <li>
                            <Link className="dropdown-item" to="/restaurant/menu">
                              Manage Menu
                            </Link>
                          </li>
                          <li>
                            <hr className="dropdown-divider" />
                          </li>
                        </>
                      )}
                      {isRider && (
                        <>
                          <li>
                            <span className="dropdown-item text-warning fw-bold">
                              🛵 {user?.vehicleType?.toUpperCase()} • {user?.vehicleNumber}
                            </span>
                          </li>
                          <li>
                            <hr className="dropdown-divider" />
                          </li>
                          <li>
                            <Link className="dropdown-item" to="/rider/dashboard">
                              Dashboard
                            </Link>
                          </li>
                          <li>
                            <hr className="dropdown-divider" />
                          </li>
                        </>
                      )}
                      <li>
                        <Link className="dropdown-item" to="/profile">
                          My Profile
                        </Link>
                      </li>
                      {isCustomer && (
                        <>
                          <li>
                            <Link className="dropdown-item" to="/orders">
                              My Orders
                            </Link>
                          </li>
                          <li>
                            <Link className="dropdown-item" to="/favorites">
                              Favorites
                            </Link>
                          </li>
                        </>
                      )}
                    </ul>
                  </li>
                  {/* Visible Logout Button */}
                  <li className="nav-item">
                    <button
                      className="btn btn-outline-light btn-sm"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/login">
                      Login
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="btn btn-light btn-sm ms-2" to="/signup">
                      Sign Up
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}
