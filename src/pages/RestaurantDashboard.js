import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

export default function RestaurantDashboard() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Rider assignment
  const [availableRiders, setAvailableRiders] = useState([]);
  const [assigningRider, setAssigningRider] = useState(null); // orderId being assigned
  const [showRiderModal, setShowRiderModal] = useState(false);
  const [selectedOrderForRider, setSelectedOrderForRider] = useState(null);
  
  // Toast state
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  
  // Confirm modal for closing restaurant
  const [confirmClose, setConfirmClose] = useState(false);
  
  // Track previous pending orders for new order notification
  const prevPendingCount = useRef(0);

  const { isAuthenticated, isRestaurant, user } = useAuth();
  const navigate = useNavigate();

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/restaurant/dashboard" } });
      return;
    }
    if (!isRestaurant) {
      navigate("/");
      return;
    }
    fetchData();

    // Poll for new orders every 10 seconds
    const pollInterval = setInterval(() => {
      fetchData();
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [isAuthenticated, isRestaurant, navigate, filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, statsRes, infoRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/order/restaurant/all?status=${filter}`),
        axios.get("http://localhost:5000/api/order/restaurant/stats"),
        axios.get("http://localhost:5000/api/restaurant/my/info"),
      ]);

      if (ordersRes.data.success) {
        const newOrders = ordersRes.data.orders;
        
        // Check for new pending orders (notify restaurant)
        const newPendingCount = newOrders.filter(o => o.orderStatus === "placed").length;
        if (prevPendingCount.current > 0 && newPendingCount > prevPendingCount.current) {
          const diff = newPendingCount - prevPendingCount.current;
          showToast(`🔔 ${diff} new order${diff > 1 ? 's' : ''} received!`, "info");
          // Play notification sound (optional)
          try {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
            audio.volume = 0.5;
            audio.play().catch(() => {});
          } catch (e) {}
        }
        prevPendingCount.current = newPendingCount;
        
        setOrders(newOrders);
      }
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
      if (infoRes.data.success) {
        setRestaurantInfo(infoRes.data.restaurant);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  const handleToggleStatus = () => {
    if (restaurantInfo?.isOpen) {
      // Confirm before closing
      setConfirmClose(true);
    } else {
      // Open directly
      toggleRestaurantStatus();
    }
  };

  const toggleRestaurantStatus = async () => {
    setConfirmClose(false);
    setTogglingStatus(true);
    try {
      const response = await axios.put(
        "http://localhost:5000/api/restaurant/my/toggle-status"
      );
      if (response.data.success) {
        setRestaurantInfo((prev) => ({ ...prev, isOpen: response.data.isOpen }));
        showToast(response.data.message, "success");
      }
    } catch (err) {
      console.error("Toggle status error:", err);
      showToast("Failed to update restaurant status", "error");
    } finally {
      setTogglingStatus(false);
    }
  };

  // Fetch available riders
  const fetchAvailableRiders = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/rider/available");
      if (response.data.success) {
        setAvailableRiders(response.data.riders);
      }
    } catch (err) {
      console.error("Fetch riders error:", err);
    }
  };

  // Open rider assignment modal
  const openAssignRiderModal = async (order) => {
    setSelectedOrderForRider(order);
    await fetchAvailableRiders();
    setShowRiderModal(true);
  };

  // Assign rider to order
  const handleAssignRider = async (riderId) => {
    if (!selectedOrderForRider) return;
    
    setAssigningRider(riderId);
    try {
      const response = await axios.put(
        `http://localhost:5000/api/rider/assign/${selectedOrderForRider._id}`,
        { riderId }
      );
      if (response.data.success) {
        showToast(response.data.message, "success");
        setShowRiderModal(false);
        setSelectedOrderForRider(null);
        fetchData();
      } else {
        showToast(response.data.message, "error");
      }
    } catch (err) {
      showToast("Failed to assign rider", "error");
    } finally {
      setAssigningRider(null);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/order/restaurant/accept/${orderId}`
      );
      if (response.data.success) {
        fetchData();
      }
    } catch (err) {
      console.error("Accept order error:", err);
    }
  };

  const handleRejectOrder = async (orderId) => {
    const reason = window.prompt("Enter rejection reason (optional):");
    try {
      const response = await axios.put(
        `http://localhost:5000/api/order/restaurant/reject/${orderId}`,
        { reason }
      );
      if (response.data.success) {
        fetchData();
      }
    } catch (err) {
      console.error("Reject order error:", err);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/order/restaurant/status/${orderId}`,
        { status: newStatus }
      );
      if (response.data.success) {
        fetchData();
      }
    } catch (err) {
      console.error("Update status error:", err);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      placed: "bg-warning text-dark",
      confirmed: "bg-info",
      preparing: "bg-primary",
      ready_for_pickup: "bg-warning text-dark",
      out_for_delivery: "bg-info",
      delivered: "bg-success",
      cancelled: "bg-danger",
    };
    return statusClasses[status] || "bg-secondary";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-PK", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const getNextStatus = (currentStatus) => {
    const flow = {
      placed: "confirmed",
      confirmed: "preparing",
      preparing: "ready_for_pickup",
      ready_for_pickup: "out_for_delivery",
      out_for_delivery: "delivered",
    };
    return flow[currentStatus];
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
        {/* Restaurant Info Header */}
        <div className="row mb-4">
          <div className="col">
            <div className="d-flex align-items-center">
              <h2 className="mb-0">Restaurant Dashboard</h2>
              {restaurantInfo && (
                <span
                  className={`badge ms-3 ${
                    restaurantInfo.isOpen ? "bg-success" : "bg-secondary"
                  }`}
                  style={{ fontSize: "0.9rem" }}
                >
                  {restaurantInfo.isOpen ? "Open" : "Closed"}
                </span>
              )}
            </div>
            <p className="text-muted mb-0">
              Welcome, {user?.restaurantName || user?.name}
            </p>
            {restaurantInfo && (
              <div className="d-flex align-items-center mt-2">
                <span className="text-warning me-2">
                  ⭐ {restaurantInfo.rating?.toFixed(1) || "0.0"}
                </span>
                <span className="text-muted small">
                  ({restaurantInfo.totalRatings || 0} reviews)
                </span>
              </div>
            )}
          </div>
          <div className="col-auto d-flex align-items-start gap-2">
            {/* Open/Close Toggle Button */}
            <button
              className={`btn ${
                restaurantInfo?.isOpen ? "btn-outline-danger" : "btn-success"
              }`}
              onClick={handleToggleStatus}
              disabled={togglingStatus}
            >
              {togglingStatus ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1"></span>
                  Updating...
                </>
              ) : restaurantInfo?.isOpen ? (
                "Close Restaurant"
              ) : (
                "Open Restaurant"
              )}
            </button>
            <Link to="/restaurant/menu" className="btn btn-outline-success">
              Manage Menu
            </Link>
          </div>
        </div>

        {/* Auto-refresh indicator */}
        <div className="d-flex justify-content-end align-items-center mb-3">
          <small className="text-muted me-2">
            {lastUpdated && (
              <>Auto-refreshes every 10s • Last updated: {lastUpdated.toLocaleTimeString()}</>
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

        {/* Show closed notice */}
        {restaurantInfo && !restaurantInfo.isOpen && (
          <div className="alert alert-warning d-flex align-items-center mb-4">
            <span className="me-2">⚠️</span>
            <span>
              Your restaurant is currently <strong>closed</strong>. Customers cannot place new orders.
            </span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <div className="card bg-primary text-white">
                <div className="card-body">
                  <h6 className="card-title">Today's Orders</h6>
                  <h2 className="mb-0">{stats.todayOrders}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-success text-white">
                <div className="card-body">
                  <h6 className="card-title">Today's Revenue</h6>
                  <h2 className="mb-0">Rs. {stats.todayRevenue}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-warning text-dark">
                <div className="card-body">
                  <h6 className="card-title">Pending Orders</h6>
                  <h2 className="mb-0">{stats.pendingOrders}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-info text-white">
                <div className="card-body">
                  <h6 className="card-title">Total Revenue</h6>
                  <h2 className="mb-0">Rs. {stats.totalRevenue}</h2>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-4">
          <ul className="nav nav-tabs">
            {["all", "placed", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"].map(
              (status) => (
                <li className="nav-item" key={status}>
                  <button
                    className={`nav-link ${filter === status ? "active" : ""}`}
                    onClick={() => setFilter(status)}
                  >
                    {status === "all" ? "All Orders" : status.replace("_", " ").toUpperCase()}
                    {stats?.statusCounts?.[status] !== undefined && (
                      <span className="badge bg-secondary ms-1">
                        {stats.statusCounts[status]}
                      </span>
                    )}
                  </button>
                </li>
              )
            )}
          </ul>
        </div>

        {/* Orders Table */}
        {orders.length === 0 ? (
          <div className="text-center py-5">
            <h4>No orders found</h4>
            <p className="text-muted">
              {filter === "all"
                ? "No orders have been placed yet."
                : `No orders with status "${filter}".`}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <small className="text-muted">#{order._id.slice(-8)}</small>
                    </td>
                    <td>
                      <strong>{order.userId?.name || "Unknown"}</strong>
                      <br />
                      <small className="text-muted">{order.userId?.phone || order.userId?.email}</small>
                    </td>
                    <td>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="small">
                          {item.name} ({item.size}) x{item.quantity}
                        </div>
                      ))}
                    </td>
                    <td>
                      <strong>Rs. {order.totalAmount}</strong>
                    </td>
                    <td>
                      <span className="text-capitalize">{order.paymentMethod}</span>
                      <br />
                      <small
                        className={
                          order.paymentStatus === "completed"
                            ? "text-success"
                            : "text-warning"
                        }
                      >
                        {order.paymentStatus}
                      </small>
                    </td>
                    <td>
                      <span
                        className={`badge ${getStatusBadgeClass(order.orderStatus)}`}
                      >
                        {order.orderStatus.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <small>{formatDate(order.createdAt)}</small>
                    </td>
                    <td>
                      {order.orderStatus === "placed" && (
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-success"
                            onClick={() => handleAcceptOrder(order._id)}
                            title="Accept Order"
                          >
                            Accept
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleRejectOrder(order._id)}
                            title="Reject Order"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {["confirmed", "preparing"].includes(order.orderStatus) && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() =>
                            handleUpdateStatus(order._id, getNextStatus(order.orderStatus))
                          }
                        >
                          Mark {getNextStatus(order.orderStatus)?.replace(/_/g, " ")}
                        </button>
                      )}
                      {order.orderStatus === "ready_for_pickup" && !order.riderId && (
                        <button
                          className="btn btn-warning btn-sm"
                          onClick={() => openAssignRiderModal(order)}
                        >
                          🛵 Assign Rider
                        </button>
                      )}
                      {order.orderStatus === "ready_for_pickup" && order.riderId && (
                        <div className="text-center">
                          <small className="text-success d-block">
                            🛵 {order.riderName}
                          </small>
                          <small className="text-muted">{order.riderPhone}</small>
                        </div>
                      )}
                      {order.orderStatus === "out_for_delivery" && (
                        <div className="text-center">
                          <small className="text-primary d-block">
                            🚚 On the way
                          </small>
                          {order.riderName && (
                            <small className="text-muted">by {order.riderName}</small>
                          )}
                        </div>
                      )}
                      {order.orderStatus === "delivered" && (
                        <span className="text-success">✓ Completed</span>
                      )}
                      {order.orderStatus === "cancelled" && (
                        <span className="text-danger">✗ Cancelled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Delivery Address Modal/Details */}
        <div className="mt-4">
          <h5>Recent Order Details</h5>
          <div className="row">
            {orders.slice(0, 3).map((order) => (
              <div key={order._id} className="col-md-4 mb-3">
                <div className="card">
                  <div className="card-header d-flex justify-content-between">
                    <span>#{order._id.slice(-8)}</span>
                    <span className={`badge ${getStatusBadgeClass(order.orderStatus)}`}>
                      {order.orderStatus.replace("_", " ")}
                    </span>
                  </div>
                  <div className="card-body">
                    <p className="mb-1">
                      <strong>Customer:</strong> {order.userId?.name}
                    </p>
                    <p className="mb-1">
                      <strong>Phone:</strong> {order.userId?.phone || "N/A"}
                    </p>
                    <p className="mb-1">
                      <strong>Address:</strong>
                      <br />
                      {order.deliveryAddress.street}, {order.deliveryAddress.city}
                      <br />
                      {order.deliveryAddress.state} - {order.deliveryAddress.zipCode}
                    </p>
                    {order.specialInstructions && (
                      <p className="mb-0 text-muted small">
                        <strong>Note:</strong> {order.specialInstructions}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
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

      {/* Confirm Close Modal */}
      <ConfirmModal
        show={confirmClose}
        title="Close Restaurant"
        message="Are you sure you want to close your restaurant? Customers will not be able to place new orders until you reopen."
        confirmText="Yes, Close Restaurant"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={toggleRestaurantStatus}
        onCancel={() => setConfirmClose(false)}
      />

      {/* Rider Assignment Modal */}
      {showRiderModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">🛵 Assign Rider</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowRiderModal(false);
                    setSelectedOrderForRider(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                {selectedOrderForRider && (
                  <div className="alert alert-info mb-3">
                    <strong>Order #{selectedOrderForRider._id.slice(-8)}</strong>
                    <br />
                    <small>
                      {selectedOrderForRider.deliveryAddress?.street},{" "}
                      {selectedOrderForRider.deliveryAddress?.city}
                    </small>
                  </div>
                )}
                
                {availableRiders.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted mb-0">No riders available right now</p>
                    <small className="text-muted">
                      Riders will appear here when they go online
                    </small>
                  </div>
                ) : (
                  <div className="list-group">
                    {availableRiders.map((rider) => (
                      <button
                        key={rider._id}
                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                        onClick={() => handleAssignRider(rider._id)}
                        disabled={assigningRider === rider._id}
                      >
                        <div>
                          <strong>{rider.name}</strong>
                          <br />
                          <small className="text-muted">
                            {rider.vehicleType?.toUpperCase()} • {rider.vehicleNumber}
                          </small>
                          <br />
                          <small className="text-muted">📞 {rider.phone}</small>
                        </div>
                        <div className="text-end">
                          <span className="badge bg-warning text-dark mb-1">
                            ⭐ {rider.riderRating?.toFixed(1) || "5.0"}
                          </span>
                          <br />
                          <small className="text-muted">
                            {rider.totalDeliveries || 0} deliveries
                          </small>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowRiderModal(false);
                    setSelectedOrderForRider(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
