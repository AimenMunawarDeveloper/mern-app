import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function Cart() {
  const { cart, restaurant, removeFromCart, updateQuantity, getCartTotal, clearCart, getDeliveryFee } =
    useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const deliveryFee = getDeliveryFee();
  const subtotal = getCartTotal();
  const tax = Math.round(subtotal * 0.16);
  const total = subtotal + deliveryFee + tax;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/checkout" } });
    } else {
      navigate("/checkout");
    }
  };

  if (cart.length === 0) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="container text-center py-5 flex-grow-1">
          <h2 className="mb-4">Your Cart is Empty</h2>
          <p className="text-muted mb-4">
            Looks like you haven't added anything to your cart yet.
          </p>
          <Link to="/" className="btn btn-success btn-lg">
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
      <div className="container py-4 flex-grow-1">
        <h2 className="mb-4">Shopping Cart</h2>

        {/* Restaurant Info */}
        {restaurant && (
          <div className="alert alert-light border mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Ordering from:</strong>{" "}
                <Link to={`/restaurant/${restaurant._id}`} className="text-success">
                  {restaurant.restaurantName}
                </Link>
              </div>
              <small className="text-muted">
                Min. Order: Rs. {restaurant.minimumOrder || 200}
              </small>
            </div>
          </div>
        )}

        <div className="row">
          <div className="col-lg-8">
            {cart.map((item, index) => (
              <div key={`${item.id}-${item.size}`} className="card mb-3">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-md-2">
                      <img
                        src={item.img}
                        alt={item.name}
                        className="img-fluid rounded"
                        style={{
                          width: "80px",
                          height: "80px",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                    <div className="col-md-4">
                      <h5 className="mb-1">{item.name}</h5>
                      <p className="text-muted mb-0">Size: {item.size}</p>
                    </div>
                    <div className="col-md-2">
                      <span className="fw-bold">Rs. {item.price}</span>
                    </div>
                    <div className="col-md-2">
                      <div className="d-flex align-items-center">
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() =>
                            updateQuantity(item.id, item.size, item.quantity - 1)
                          }
                        >
                          -
                        </button>
                        <span className="mx-2">{item.quantity}</span>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() =>
                            updateQuantity(item.id, item.size, item.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="col-md-2 text-end">
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => removeFromCart(item.id, item.size)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              className="btn btn-outline-danger mt-2"
              onClick={clearCart}
            >
              Clear Cart
            </button>
          </div>

          <div className="col-lg-4">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Order Summary</h5>
                {restaurant && (
                  <p className="text-muted small mb-2">{restaurant.restaurantName}</p>
                )}
                <hr />
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal</span>
                  <span>Rs. {subtotal}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Delivery Fee</span>
                  <span>Rs. {deliveryFee}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>GST (16%)</span>
                  <span>Rs. {tax}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-3">
                  <strong>Total</strong>
                  <strong>Rs. {total}</strong>
                </div>
                {restaurant?.minimumOrder && subtotal < restaurant.minimumOrder && (
                  <div className="alert alert-warning py-2 small mb-3">
                    Minimum order is Rs. {restaurant.minimumOrder}. Add Rs.{" "}
                    {restaurant.minimumOrder - subtotal} more.
                  </div>
                )}
                <button
                  className="btn btn-success w-100"
                  onClick={handleCheckout}
                  disabled={restaurant?.minimumOrder && subtotal < restaurant.minimumOrder}
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
