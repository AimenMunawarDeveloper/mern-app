import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom icons
const riderIcon = new L.DivIcon({
  className: "custom-icon",
  html: '<div style="font-size: 30px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">🛵</div>',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const restaurantIcon = new L.DivIcon({
  className: "custom-icon",
  html: '<div style="font-size: 30px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">🏪</div>',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const deliveryIcon = new L.DivIcon({
  className: "custom-icon",
  html: '<div style="font-size: 30px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">📍</div>',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// Component to recenter map when rider location changes
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function OrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default center (Karachi)
  const defaultCenter = [24.8607, 67.0011];

  const fetchTracking = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/rider/track/${orderId}`);
      if (response.data.success) {
        setTracking(response.data.tracking);
        setError(null);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tracking info");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/track/${orderId}` } });
      return;
    }
    fetchTracking();

    // Poll for updates every 5 seconds for active orders
    const interval = setInterval(() => {
      const activeStatuses = ["placed", "confirmed", "preparing", "ready_for_pickup", "out_for_delivery"];
      if (tracking && activeStatuses.includes(tracking.orderStatus)) {
        fetchTracking();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isAuthenticated, navigate, orderId, fetchTracking, tracking]);

  const getStatusStep = (status) => {
    const steps = {
      placed: 1,
      confirmed: 2,
      preparing: 3,
      ready_for_pickup: 4,
      out_for_delivery: 5,
      delivered: 6,
    };
    return steps[status] || 0;
  };

  const formatTime = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleTimeString("en-PK", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get map positions
  const getRiderPosition = () => {
    if (tracking?.rider?.currentLocation?.latitude) {
      return [
        tracking.rider.currentLocation.latitude,
        tracking.rider.currentLocation.longitude,
      ];
    }
    return null;
  };

  const getDeliveryPosition = () => {
    if (tracking?.deliveryAddress?.latitude) {
      return [
        tracking.deliveryAddress.latitude,
        tracking.deliveryAddress.longitude,
      ];
    }
    // Return default if no coordinates (simulate with slight offset)
    return [24.8607 + Math.random() * 0.01, 67.0011 + Math.random() * 0.01];
  };

  const getRestaurantPosition = () => {
    if (tracking?.restaurantLocation?.latitude) {
      return [
        tracking.restaurantLocation.latitude,
        tracking.restaurantLocation.longitude,
      ];
    }
    // Return default if no coordinates
    return [24.8607 - 0.005, 67.0011 - 0.005];
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="container py-5 text-center flex-grow-1">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading tracking info...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="container py-5 text-center flex-grow-1">
          <div className="alert alert-danger">{error}</div>
          <Link to="/orders" className="btn btn-success">
            Back to Orders
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const currentStep = getStatusStep(tracking?.orderStatus);
  const riderPosition = getRiderPosition();
  const deliveryPosition = getDeliveryPosition();
  const restaurantPosition = getRestaurantPosition();
  const mapCenter = riderPosition || restaurantPosition || defaultCenter;

  return (
    <div className="page-wrapper">
      <Header />
      <div className="container py-4 flex-grow-1">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="mb-1">Track Your Order</h3>
            <p className="text-muted mb-0">
              Order #{tracking?.orderId?.slice(-8)} • {tracking?.restaurantName}
            </p>
          </div>
          <Link to="/orders" className="btn btn-outline-success">
            ← Back to Orders
          </Link>
        </div>

        <div className="row">
          {/* Map */}
          <div className="col-lg-8 mb-4">
            <div className="card">
              <div className="card-body p-0">
                <MapContainer
                  center={mapCenter}
                  zoom={14}
                  style={{ height: "400px", width: "100%", borderRadius: "0.375rem" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />

                  {/* Restaurant Marker */}
                  <Marker position={restaurantPosition} icon={restaurantIcon}>
                    <Popup>
                      <strong>{tracking?.restaurantName}</strong>
                      <br />
                      Restaurant Location
                    </Popup>
                  </Marker>

                  {/* Delivery Location Marker */}
                  <Marker position={deliveryPosition} icon={deliveryIcon}>
                    <Popup>
                      <strong>Delivery Location</strong>
                      <br />
                      {tracking?.deliveryAddress?.street}, {tracking?.deliveryAddress?.city}
                    </Popup>
                  </Marker>

                  {/* Rider Marker (only when out for delivery) */}
                  {tracking?.orderStatus === "out_for_delivery" && riderPosition && (
                    <>
                      <Marker position={riderPosition} icon={riderIcon}>
                        <Popup>
                          <strong>{tracking?.rider?.name}</strong>
                          <br />
                          {tracking?.rider?.vehicleType?.toUpperCase()} • {tracking?.rider?.vehicleNumber}
                          <br />
                          📞 {tracking?.rider?.phone}
                        </Popup>
                      </Marker>
                      
                      {/* Route line from rider to delivery */}
                      <Polyline
                        positions={[riderPosition, deliveryPosition]}
                        color="#198754"
                        weight={3}
                        dashArray="10, 10"
                      />
                      
                      <MapUpdater center={riderPosition} />
                    </>
                  )}

                  {/* Route from restaurant to delivery when preparing */}
                  {["preparing", "ready_for_pickup"].includes(tracking?.orderStatus) && (
                    <Polyline
                      positions={[restaurantPosition, deliveryPosition]}
                      color="#6c757d"
                      weight={2}
                      dashArray="5, 10"
                    />
                  )}
                </MapContainer>
              </div>
            </div>

            {/* ETA Card */}
            {tracking?.orderStatus === "out_for_delivery" && tracking?.remainingMinutes !== null && (
              <div className="card mt-3 bg-success text-white">
                <div className="card-body text-center py-4">
                  <h1 className="display-4 mb-0">
                    {tracking.remainingMinutes > 0 ? tracking.remainingMinutes : "<1"} min
                  </h1>
                  <p className="mb-0">Estimated time of arrival</p>
                </div>
              </div>
            )}
          </div>

          {/* Status & Rider Info */}
          <div className="col-lg-4">
            {/* Order Status Progress */}
            <div className="card mb-3">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">Order Status</h5>
              </div>
              <div className="card-body">
                <div className="tracking-progress">
                  {[
                    { step: 1, label: "Order Placed", icon: "📝" },
                    { step: 2, label: "Confirmed", icon: "✓" },
                    { step: 3, label: "Preparing", icon: "👨‍🍳" },
                    { step: 4, label: "Ready for Pickup", icon: "📦" },
                    { step: 5, label: "Out for Delivery", icon: "🛵" },
                    { step: 6, label: "Delivered", icon: "✅" },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className={`d-flex align-items-center mb-3 ${
                        currentStep >= item.step ? "text-success" : "text-muted"
                      }`}
                    >
                      <div
                        className={`rounded-circle d-flex align-items-center justify-content-center me-3`}
                        style={{
                          width: "40px",
                          height: "40px",
                          backgroundColor: currentStep >= item.step ? "#198754" : "#e9ecef",
                          color: currentStep >= item.step ? "white" : "#6c757d",
                          fontSize: "1.2rem",
                        }}
                      >
                        {item.icon}
                      </div>
                      <div>
                        <strong>{item.label}</strong>
                        {currentStep === item.step && (
                          <span className="badge bg-warning text-dark ms-2">Current</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rider Info */}
            {tracking?.rider && (
              <div className="card mb-3">
                <div className="card-header bg-warning text-dark">
                  <h5 className="mb-0">🛵 Your Rider</h5>
                </div>
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <div
                      className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3"
                      style={{ width: "60px", height: "60px", fontSize: "2rem" }}
                    >
                      🧑
                    </div>
                    <div>
                      <h5 className="mb-1">{tracking.rider.name}</h5>
                      <span className="badge bg-warning text-dark">
                        ⭐ {tracking.rider.rating?.toFixed(1) || "5.0"}
                      </span>
                    </div>
                  </div>
                  <p className="mb-2">
                    <strong>Vehicle:</strong> {tracking.rider.vehicleType?.toUpperCase()} •{" "}
                    {tracking.rider.vehicleNumber}
                  </p>
                  <a
                    href={`tel:${tracking.rider.phone}`}
                    className="btn btn-success w-100"
                  >
                    📞 Call Rider ({tracking.rider.phone})
                  </a>
                </div>
              </div>
            )}

            {/* Delivery Address */}
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">📍 Delivery Address</h6>
              </div>
              <div className="card-body">
                <p className="mb-0">
                  {tracking?.deliveryAddress?.street}
                  <br />
                  {tracking?.deliveryAddress?.city}, {tracking?.deliveryAddress?.state}
                  <br />
                  {tracking?.deliveryAddress?.zipCode}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
