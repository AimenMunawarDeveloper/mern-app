import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

export default function RiderDashboard() {
  const [stats, setStats] = useState(null);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [riderStatus, setRiderStatus] = useState("offline");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [filter, setFilter] = useState("active");
  const [lastUpdated, setLastUpdated] = useState(null);

  // Toast state
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState({ show: false, action: null, orderId: null });
  
  // Track previous available orders for notification
  const prevAvailableCount = useRef(0);

  const { isAuthenticated, isRider, user } = useAuth();
  const navigate = useNavigate();

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, statsRes, availableRes, myOrdersRes] = await Promise.all([
        axios.get("http://localhost:5000/api/rider/profile"),
        axios.get("http://localhost:5000/api/rider/stats"),
        axios.get("http://localhost:5000/api/rider/available-orders"),
        axios.get(`http://localhost:5000/api/rider/my-orders?status=${filter}`),
      ]);

      if (profileRes.data.success) {
        setRiderStatus(profileRes.data.rider.riderStatus || "offline");
      }
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
      if (availableRes.data.success) {
        const newAvailable = availableRes.data.orders;
        
        // Notify rider of new available orders
        if (prevAvailableCount.current > 0 && newAvailable.length > prevAvailableCount.current) {
          const diff = newAvailable.length - prevAvailableCount.current;
          showToast(`🔔 ${diff} new order${diff > 1 ? 's' : ''} available!`, "info");
          // Play notification sound
          try {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
            audio.volume = 0.5;
            audio.play().catch(() => {});
          } catch (e) {}
        }
        prevAvailableCount.current = newAvailable.length;
        
        setAvailableOrders(newAvailable);
      }
      if (myOrdersRes.data.success) {
        setMyOrders(myOrdersRes.data.orders);
        // Find active order
        const active = myOrdersRes.data.orders.find(
          (o) => o.orderStatus === "ready_for_pickup" || o.orderStatus === "out_for_delivery"
        );
        setActiveOrder(active || null);
      }
    } catch (err) {
      console.error("Fetch data error:", err);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  }, [filter]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/rider/dashboard" } });
      return;
    }
    if (!isRider) {
      navigate("/");
      return;
    }
    fetchData();

    // Poll for new orders and updates every 10 seconds
    const pollInterval = setInterval(() => {
      fetchData();
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [isAuthenticated, isRider, navigate, fetchData]);

  // Update location periodically when online
  useEffect(() => {
    if (riderStatus !== "offline" && navigator.geolocation) {
      const updateLocation = () => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              await axios.put("http://localhost:5000/api/rider/location", {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            } catch (err) {
              console.error("Location update failed:", err);
            }
          },
          (error) => {
            console.error("Geolocation error:", error);
          }
        );
      };

      // Update immediately and then every 30 seconds
      updateLocation();
      const interval = setInterval(updateLocation, 30000);
      return () => clearInterval(interval);
    }
  }, [riderStatus]);

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const response = await axios.put("http://localhost:5000/api/rider/status", {
        status: newStatus,
      });
      if (response.data.success) {
        setRiderStatus(newStatus);
        showToast(response.data.message, "success");
      } else {
        showToast(response.data.message, "error");
      }
    } catch (err) {
      showToast("Failed to update status", "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/rider/accept/${orderId}`);
      if (response.data.success) {
        showToast(response.data.message, "success");
        fetchData();
      } else {
        showToast(response.data.message, "error");
      }
    } catch (err) {
      showToast("Failed to accept order", "error");
    }
  };

  const handlePickupOrder = async (orderId) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/rider/pickup/${orderId}`);
      if (response.data.success) {
        showToast(response.data.message, "success");
        fetchData();
      } else {
        showToast(response.data.message, "error");
      }
    } catch (err) {
      showToast("Failed to pickup order", "error");
    }
  };

  const handleDeliverOrder = (orderId) => {
    setConfirmModal({
      show: true,
      action: "deliver",
      orderId,
    });
  };

  const confirmDelivery = async () => {
    const { orderId } = confirmModal;
    setConfirmModal({ show: false, action: null, orderId: null });

    try {
      const response = await axios.put(`http://localhost:5000/api/rider/deliver/${orderId}`);
      if (response.data.success) {
        showToast(response.data.message, "success");
        fetchData();
      } else {
        showToast(response.data.message, "error");
      }
    } catch (err) {
      showToast("Failed to complete delivery", "error");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "available": return "success";
      case "busy": return "warning";
      case "offline": return "secondary";
      default: return "secondary";
    }
  };

  const formatTime = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleTimeString("en-PK", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAddress = (address) => {
    if (!address) return "N/A";
    return `${address.street}, ${address.city}`;
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="container py-5 text-center flex-grow-1">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading dashboard...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Header />
      <div className="container-fluid py-4 flex-grow-1">
        {/* Header with Status */}
        <div className="row mb-4">
          <div className="col-md-6">
            <h2 className="mb-1">
              Rider Dashboard
              <span className={`badge bg-${getStatusColor(riderStatus)} ms-3`} style={{ fontSize: "0.7rem" }}>
                {riderStatus.charAt(0).toUpperCase() + riderStatus.slice(1)}
              </span>
            </h2>
            <p className="text-muted mb-0">Welcome, {user?.name}</p>
            <small className="text-muted">
              {user?.vehicleType?.toUpperCase()} • {user?.vehicleNumber}
            </small>
          </div>
          <div className="col-md-6 text-md-end">
            <div className="btn-group" role="group">
              <button
                className={`btn ${riderStatus === "offline" ? "btn-secondary" : "btn-outline-secondary"}`}
                onClick={() => handleStatusChange("offline")}
                disabled={updatingStatus || activeOrder}
              >
                Offline
              </button>
              <button
                className={`btn ${riderStatus === "available" ? "btn-success" : "btn-outline-success"}`}
                onClick={() => handleStatusChange("available")}
                disabled={updatingStatus}
              >
                Available
              </button>
              <button
                className={`btn ${riderStatus === "busy" ? "btn-warning" : "btn-outline-warning"}`}
                onClick={() => handleStatusChange("busy")}
                disabled={updatingStatus}
              >
                Busy
              </button>
            </div>
          </div>
        </div>

        {/* Auto-refresh indicator */}
        <div className="d-flex justify-content-end align-items-center mb-3">
          <small className="text-muted me-2">
            {lastUpdated && (
              <>Auto-refreshes every 10s • Last: {lastUpdated.toLocaleTimeString()}</>
            )}
          </small>
          <button 
            className="btn btn-sm btn-outline-secondary"
            onClick={fetchData}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm"></span>
            ) : (
              "↻ Refresh"
            )}
          </button>
        </div>

        {/* Active Order Alert */}
        {activeOrder && (
          <div className="alert alert-warning mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>🚚 Active Delivery:</strong> Order #{activeOrder._id.slice(-8)} - {activeOrder.restaurantName}
                <br />
                <small>
                  Status: {activeOrder.orderStatus === "ready_for_pickup" ? "Head to restaurant for pickup" : "Delivering to customer"}
                </small>
              </div>
              <div>
                {activeOrder.orderStatus === "ready_for_pickup" ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => handlePickupOrder(activeOrder._id)}
                  >
                    Mark Picked Up
                  </button>
                ) : (
                  <button
                    className="btn btn-success"
                    onClick={() => handleDeliverOrder(activeOrder._id)}
                  >
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="row mb-4">
            <div className="col-6 col-md-3 mb-3">
              <div className="card bg-primary text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">{stats.todayDeliveries || 0}</h3>
                  <small>Today's Deliveries</small>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3 mb-3">
              <div className="card bg-success text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">Rs. {stats.todayEarnings || 0}</h3>
                  <small>Today's Earnings</small>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3 mb-3">
              <div className="card bg-info text-white">
                <div className="card-body text-center">
                  <h3 className="mb-0">{stats.totalDeliveries || 0}</h3>
                  <small>Total Deliveries</small>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3 mb-3">
              <div className="card bg-warning text-dark">
                <div className="card-body text-center">
                  <h3 className="mb-0">⭐ {stats.rating?.toFixed(1) || "5.0"}</h3>
                  <small>Rating ({stats.totalRatings || 0} reviews)</small>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row">
          {/* Available Orders */}
          <div className="col-lg-6 mb-4">
            <div className="card">
              <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">📦 Available Orders</h5>
                <span className="badge bg-light text-dark">{availableOrders.length}</span>
              </div>
              <div className="card-body" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {riderStatus === "offline" ? (
                  <div className="text-center text-muted py-4">
                    <p>Go online to see available orders</p>
                  </div>
                ) : availableOrders.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    <p>No orders available right now</p>
                    <small>New orders will appear here</small>
                  </div>
                ) : (
                  availableOrders.map((order) => (
                    <div key={order._id} className="card mb-3">
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between mb-2">
                          <strong>{order.restaurantId?.restaurantName || order.restaurantName}</strong>
                          <span className="text-success">Rs. {order.totalAmount}</span>
                        </div>
                        <p className="mb-1 small text-muted">
                          <strong>Pickup:</strong> {order.restaurantId?.restaurantAddress || "N/A"}
                        </p>
                        <p className="mb-2 small text-muted">
                          <strong>Delivery:</strong> {formatAddress(order.deliveryAddress)}
                        </p>
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            {order.items?.length} items • {formatTime(order.createdAt)}
                          </small>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleAcceptOrder(order._id)}
                            disabled={activeOrder}
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* My Orders */}
          <div className="col-lg-6 mb-4">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">🛵 My Deliveries</h5>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: "auto" }}
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="delivered">Delivered</option>
                    <option value="all">All</option>
                  </select>
                </div>
              </div>
              <div className="card-body" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {myOrders.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    <p>No deliveries found</p>
                  </div>
                ) : (
                  myOrders.map((order) => (
                    <div key={order._id} className="card mb-3">
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between mb-2">
                          <strong>#{order._id.slice(-8)}</strong>
                          <span
                            className={`badge ${
                              order.orderStatus === "delivered"
                                ? "bg-success"
                                : order.orderStatus === "out_for_delivery"
                                ? "bg-warning text-dark"
                                : "bg-info"
                            }`}
                          >
                            {order.orderStatus.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="mb-1 small">
                          <strong>{order.restaurantName}</strong>
                        </p>
                        <p className="mb-1 small text-muted">
                          To: {formatAddress(order.deliveryAddress)}
                        </p>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-success">Rs. {order.totalAmount}</span>
                          <small className="text-muted">
                            {order.deliveredAt
                              ? `Delivered ${formatTime(order.deliveredAt)}`
                              : formatTime(order.createdAt)}
                          </small>
                        </div>
                        {order.orderStatus === "ready_for_pickup" && (
                          <button
                            className="btn btn-primary btn-sm w-100 mt-2"
                            onClick={() => handlePickupOrder(order._id)}
                          >
                            Mark Picked Up
                          </button>
                        )}
                        {order.orderStatus === "out_for_delivery" && (
                          <button
                            className="btn btn-success btn-sm w-100 mt-2"
                            onClick={() => handleDeliverOrder(order._id)}
                          >
                            Mark Delivered
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      {/* Confirm Delivery Modal */}
      <ConfirmModal
        show={confirmModal.show}
        title="Confirm Delivery"
        message="Have you handed over the order to the customer? This will mark the delivery as complete."
        confirmText="Yes, Delivered"
        cancelText="Cancel"
        confirmVariant="success"
        onConfirm={confirmDelivery}
        onCancel={() => setConfirmModal({ show: false, action: null, orderId: null })}
      />

      <Footer />
    </div>
  );
}
