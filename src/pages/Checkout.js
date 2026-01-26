import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

export default function Checkout() {
  const { cart, restaurant, getCartTotal, clearCart, getDeliveryFee } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const defaultAddress = user?.addresses?.find((addr) => addr.isDefault) ||
    user?.addresses?.[0] || {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    };

  const [address, setAddress] = useState(defaultAddress);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subtotal = getCartTotal();
  const deliveryFee = getDeliveryFee();
  const tax = Math.round(subtotal * 0.16); // Pakistan GST 16%
  const total = subtotal + deliveryFee + tax;

  const handleAddressChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!address.street || !address.city || !address.state || !address.zipCode) {
      setError("Please fill in all address fields");
      return;
    }

    if (cart.length === 0) {
      setError("Your cart is empty");
      return;
    }

    if (!restaurant) {
      setError("Restaurant information is missing");
      return;
    }

    setLoading(true);

    try {
      const orderItems = cart.map((item) => ({
        productId: item.id,
        name: item.name,
        img: item.img,
        size: item.size,
        quantity: item.quantity,
        price: item.price,
      }));

      const response = await axios.post(
        "http://localhost:5000/api/order/create",
        {
          items: orderItems,
          totalAmount: total,
          deliveryAddress: address,
          paymentMethod,
          specialInstructions,
          restaurantId: restaurant._id,
          restaurantName: restaurant.restaurantName,
        }
      );

      if (response.data.success) {
        clearCart();
        navigate("/order-confirmation", {
          state: { order: response.data.order },
        });
      } else {
        setError(response.data.message || "Failed to place order");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="page-wrapper">
      <Header />
      <div className="container py-4 flex-grow-1">
        <h2 className="mb-4">Checkout</h2>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="row">
          <div className="col-lg-8">
            <form onSubmit={handleSubmit}>
              {/* Delivery Address */}
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Delivery Address</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label htmlFor="street" className="form-label">
                      Street Address
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="street"
                      name="street"
                      value={address.street}
                      onChange={handleAddressChange}
                      required
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label htmlFor="city" className="form-label">
                        City
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="city"
                        name="city"
                        value={address.city}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label htmlFor="state" className="form-label">
                        Province
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="state"
                        name="state"
                        value={address.state}
                        onChange={handleAddressChange}
                        required
                        placeholder="e.g., Punjab, Sindh"
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label htmlFor="zipCode" className="form-label">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="zipCode"
                        name="zipCode"
                        value={address.zipCode}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Payment Method</h5>
                </div>
                <div className="card-body">
                  <div className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="paymentMethod"
                      id="cash"
                      value="cash"
                      checked={paymentMethod === "cash"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <label className="form-check-label" htmlFor="cash">
                      Cash on Delivery (COD)
                    </label>
                  </div>
                  <div className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="paymentMethod"
                      id="jazzcash"
                      value="jazzcash"
                      checked={paymentMethod === "jazzcash"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <label className="form-check-label" htmlFor="jazzcash">
                      JazzCash
                    </label>
                  </div>
                  <div className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="paymentMethod"
                      id="easypaisa"
                      value="easypaisa"
                      checked={paymentMethod === "easypaisa"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <label className="form-check-label" htmlFor="easypaisa">
                      Easypaisa
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="paymentMethod"
                      id="card"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <label className="form-check-label" htmlFor="card">
                      Credit/Debit Card
                    </label>
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Special Instructions</h5>
                </div>
                <div className="card-body">
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Any special instructions for your order? (e.g., less spicy, no onions)"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                  ></textarea>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-success btn-lg w-100"
                disabled={loading}
              >
                {loading ? "Placing Order..." : `Place Order - Rs. ${total}`}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="col-lg-4">
            <div className="card sticky-top" style={{ top: "20px" }}>
              <div className="card-header">
                <h5 className="mb-0">Order Summary</h5>
              </div>
              <div className="card-body">
                {restaurant && (
                  <div className="mb-3 pb-2 border-bottom">
                    <strong className="text-success">{restaurant.restaurantName}</strong>
                  </div>
                )}
                {cart.map((item) => (
                  <div
                    key={`${item.id}-${item.size}`}
                    className="d-flex justify-content-between mb-2"
                  >
                    <span>
                      {item.name} ({item.size}) x{item.quantity}
                    </span>
                    <span>Rs. {item.price * item.quantity}</span>
                  </div>
                ))}
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
                <div className="d-flex justify-content-between">
                  <strong>Total</strong>
                  <strong>Rs. {total}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
