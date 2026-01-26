import React from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function OrderConfirmation() {
  const location = useLocation();
  const order = location.state?.order;

  if (!order) {
    return <Navigate to="/" replace />;
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      cash: "Cash on Delivery",
      jazzcash: "JazzCash",
      easypaisa: "Easypaisa",
      card: "Credit/Debit Card",
    };
    return labels[method] || method;
  };

  return (
    <div className="page-wrapper">
      <Header />
      <div className="container py-5 text-center flex-grow-1">
        <div className="mb-4">
          <div
            className="bg-success rounded-circle d-inline-flex align-items-center justify-content-center"
            style={{ width: "80px", height: "80px" }}
          >
            <span style={{ fontSize: "40px", color: "white" }}>&#10003;</span>
          </div>
        </div>

        <h2 className="mb-3">Order Placed Successfully!</h2>
        <p className="text-muted mb-4">
          Thank you for your order. Your food is being prepared.
        </p>

        <div className="card mx-auto" style={{ maxWidth: "500px" }}>
          <div className="card-body text-start">
            <h5 className="card-title">Order Details</h5>
            <hr />

            {order.restaurantName && (
              <div className="mb-2">
                <strong>Restaurant:</strong>{" "}
                <span className="text-success">{order.restaurantName}</span>
              </div>
            )}

            <div className="mb-2">
              <strong>Order ID:</strong>{" "}
              <span className="text-muted">{order._id}</span>
            </div>

            <div className="mb-2">
              <strong>Order Status:</strong>{" "}
              <span className="badge bg-success text-capitalize">
                {order.orderStatus}
              </span>
            </div>

            <div className="mb-2">
              <strong>Estimated Delivery:</strong>{" "}
              <span className="text-muted">
                {formatDate(order.estimatedDeliveryTime)}
              </span>
            </div>

            <div className="mb-2">
              <strong>Delivery Address:</strong>{" "}
              <span className="text-muted">
                {order.deliveryAddress.street}, {order.deliveryAddress.city},{" "}
                {order.deliveryAddress.state} - {order.deliveryAddress.zipCode}
              </span>
            </div>

            <div className="mb-2">
              <strong>Payment Method:</strong>{" "}
              <span className="text-muted">
                {getPaymentMethodLabel(order.paymentMethod)}
              </span>
            </div>

            <hr />

            <h6>Items:</h6>
            {order.items.map((item, index) => (
              <div
                key={index}
                className="d-flex justify-content-between mb-1"
              >
                <span>
                  {item.name} ({item.size}) x{item.quantity}
                </span>
                <span>Rs. {item.price * item.quantity}</span>
              </div>
            ))}

            <hr />

            <div className="d-flex justify-content-between">
              <strong>Total Amount:</strong>
              <strong>Rs. {order.totalAmount}</strong>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Link to="/orders" className="btn btn-success me-3">
            View My Orders
          </Link>
          <Link to="/" className="btn btn-outline-success">
            Continue Shopping
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
