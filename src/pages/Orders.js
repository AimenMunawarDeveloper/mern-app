import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import axios from "axios";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedItems, setReviewedItems] = useState(new Set());
  
  // Toast state
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  
  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({ show: false, orderId: null });

  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, show: false });
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/orders" } });
      return;
    }
    fetchOrders();
    fetchUserReviews();

    // Poll for order updates every 15 seconds
    const pollInterval = setInterval(() => {
      fetchOrders();
    }, 15000);

    return () => clearInterval(pollInterval);
  }, [isAuthenticated, navigate]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/order/list");
      if (response.data.success) {
        setOrders(response.data.orders);
      } else {
        setError("Failed to fetch orders");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReviews = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/review/user");
      if (response.data.success) {
        // Create a set of reviewed product IDs
        const reviewed = new Set(response.data.reviews.map((r) => r.productId));
        setReviewedItems(reviewed);
      }
    } catch (err) {
      console.error("Error fetching user reviews:", err);
    }
  };

  const handleReorder = async (orderId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/order/reorder/${orderId}`
      );
      if (response.data.success) {
        response.data.items.forEach((item) => {
          addToCart(item);
        });
        navigate("/cart");
      }
    } catch (err) {
      console.error("Reorder error:", err);
    }
  };

  const handleCancelOrder = (orderId) => {
    setConfirmModal({ show: true, orderId });
  };

  const confirmCancelOrder = async () => {
    const orderId = confirmModal.orderId;
    setConfirmModal({ show: false, orderId: null });

    try {
      const response = await axios.put(
        `http://localhost:5000/api/order/cancel/${orderId}`
      );
      if (response.data.success) {
        setOrders(
          orders.map((order) =>
            order._id === orderId
              ? { ...order, orderStatus: "cancelled" }
              : order
          )
        );
        showToast("Order cancelled successfully", "success");
      }
    } catch (err) {
      console.error("Cancel order error:", err);
      showToast("Failed to cancel order", "error");
    }
  };

  const openReviewModal = (order, item) => {
    setSelectedOrder(order);
    setSelectedItem(item);
    setReviewData({ rating: 5, comment: "" });
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedItem || !selectedOrder) return;

    setSubmittingReview(true);
    try {
      const response = await axios.post("http://localhost:5000/api/review/add", {
        productId: selectedItem.productId,
        rating: reviewData.rating,
        comment: reviewData.comment,
        orderId: selectedOrder._id,
      });

      if (response.data.success) {
        // Add to reviewed items set
        setReviewedItems((prev) => new Set([...prev, selectedItem.productId]));
        showToast("Review submitted successfully!", "success");
        setShowReviewModal(false);
        setSelectedOrder(null);
        setSelectedItem(null);
      } else {
        showToast(response.data.message || "Failed to submit review", "error");
      }
    } catch (err) {
      console.error("Review error:", err);
      showToast(err.response?.data?.message || "Failed to submit review", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Check if item has been reviewed
  const isItemReviewed = (productId) => {
    return reviewedItems.has(productId);
  };

  // Check if order has any review (once reviewed, hide the button)
  const isOrderReviewed = (order) => {
    return order.items.some((item) => reviewedItems.has(item.productId));
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      placed: "bg-info",
      confirmed: "bg-primary",
      preparing: "bg-warning",
      ready_for_pickup: "bg-warning",
      out_for_delivery: "bg-info",
      delivered: "bg-success",
      cancelled: "bg-danger",
    };
    return statusClasses[status] || "bg-secondary";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="container py-5 text-center flex-grow-1">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading orders...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Header />
      <div className="container py-4 flex-grow-1">
        <h2 className="mb-4">My Orders</h2>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-5">
            <h4>No orders yet</h4>
            <p className="text-muted">Start exploring our delicious restaurants!</p>
            <Link to="/" className="btn btn-success">
              Browse Restaurants
            </Link>
          </div>
        ) : (
          <div className="row">
            {orders.map((order) => (
              <div key={order._id} className="col-12 mb-4">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <div>
                      <span className="fw-bold">Order #{order._id.slice(-8)}</span>
                      {order.restaurantName && (
                        <span className="text-success ms-2">
                          from {order.restaurantName}
                        </span>
                      )}
                      <span className="text-muted ms-3">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <span
                      className={`badge ${getStatusBadgeClass(
                        order.orderStatus
                      )} text-capitalize`}
                    >
                      {order.orderStatus.replace("_", " ")}
                    </span>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-8">
                        {order.items.map((item, index) => (
                          <div
                            key={index}
                            className="d-flex align-items-center mb-2"
                          >
                            <img
                              src={item.img}
                              alt={item.name}
                              className="rounded me-3"
                              style={{
                                width: "50px",
                                height: "50px",
                                objectFit: "cover",
                              }}
                            />
                            <div className="flex-grow-1">
                              <span className="fw-bold">{item.name}</span>
                              <span className="text-muted ms-2">
                                ({item.size}) x{item.quantity}
                              </span>
                            </div>
                            <span>Rs. {item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <div className="col-md-4 text-md-end">
                        <p className="mb-1">
                          <strong>Total: Rs. {order.totalAmount}</strong>
                        </p>
                        <p className="text-muted small mb-2">
                          {order.deliveryAddress.street},{" "}
                          {order.deliveryAddress.city}
                        </p>

                        <div className="mt-3">
                          <button
                            className="btn btn-outline-success btn-sm me-2"
                            onClick={() => handleReorder(order._id)}
                          >
                            Reorder
                          </button>
                          {["placed", "confirmed"].includes(
                            order.orderStatus
                          ) && (
                            <button
                              className="btn btn-outline-danger btn-sm me-2"
                              onClick={() => handleCancelOrder(order._id)}
                            >
                              Cancel
                            </button>
                          )}
                          {["ready_for_pickup", "out_for_delivery"].includes(
                            order.orderStatus
                          ) && (
                            <Link
                              to={`/track/${order._id}`}
                              className="btn btn-primary btn-sm"
                            >
                              🗺️ Track Order
                            </Link>
                          )}
                          {order.orderStatus === "delivered" && !isOrderReviewed(order) && (
                            <button
                              className="btn btn-warning btn-sm ms-2"
                              onClick={() => {
                                // Open review modal with first item
                                if (order.items[0]) openReviewModal(order, order.items[0]);
                              }}
                            >
                              ⭐ Write Review
                            </button>
                          )}
                          {order.orderStatus === "delivered" && isOrderReviewed(order) && (
                            <span className="badge bg-success ms-2">✓ Reviewed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedOrder && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">⭐ Review Your Order</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowReviewModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmitReview}>
                <div className="modal-body">
                  <div className="alert alert-light mb-3">
                    <strong>{selectedOrder?.restaurantName}</strong>
                    <br />
                    <small className="text-muted">
                      Order #{selectedOrder?._id?.slice(-8)} • {selectedOrder?.items?.length} items
                    </small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">How was your order?</label>
                    <div className="d-flex gap-2 justify-content-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="btn btn-lg p-0 border-0"
                          onClick={() =>
                            setReviewData({ ...reviewData, rating: star })
                          }
                          style={{ fontSize: "2rem" }}
                        >
                          {star <= reviewData.rating ? "⭐" : "☆"}
                        </button>
                      ))}
                    </div>
                    <div className="text-center text-muted small mt-1">
                      {reviewData.rating === 5 && "Excellent!"}
                      {reviewData.rating === 4 && "Very Good"}
                      {reviewData.rating === 3 && "Good"}
                      {reviewData.rating === 2 && "Fair"}
                      {reviewData.rating === 1 && "Poor"}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Tell us about your experience</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      placeholder="How was the food quality, taste, packaging, and delivery?"
                      value={reviewData.comment}
                      onChange={(e) =>
                        setReviewData({ ...reviewData, comment: e.target.value })
                      }
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowReviewModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={submittingReview}
                  >
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />

      {/* Confirm Cancel Modal */}
      <ConfirmModal
        show={confirmModal.show}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        confirmText="Yes, Cancel Order"
        cancelText="No, Keep Order"
        confirmVariant="danger"
        onConfirm={confirmCancelOrder}
        onCancel={() => setConfirmModal({ show: false, orderId: null })}
      />

      <Footer />
    </div>
  );
}
