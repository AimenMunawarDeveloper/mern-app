import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

export default function Profile() {
  const { user, isAuthenticated, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });
  const [newAddress, setNewAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    isDefault: false,
  });
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/profile" } });
      return;
    }
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
      });
      setAddresses(user.addresses || []);
    }
  }, [isAuthenticated, user, navigate]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    const result = await updateProfile(formData);

    if (result.success) {
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } else {
      setMessage({ type: "danger", text: result.message });
    }
    setLoading(false);
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/address",
        newAddress
      );
      if (response.data.success) {
        setAddresses(response.data.addresses);
        setNewAddress({
          street: "",
          city: "",
          state: "",
          zipCode: "",
          isDefault: false,
        });
        setMessage({ type: "success", text: "Address added successfully!" });
      }
    } catch (err) {
      setMessage({
        type: "danger",
        text: err.response?.data?.message || "Failed to add address",
      });
    }
    setLoading(false);
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm("Are you sure you want to delete this address?"))
      return;

    try {
      const response = await axios.delete(
        `http://localhost:5000/api/auth/address/${addressId}`
      );
      if (response.data.success) {
        setAddresses(response.data.addresses);
        setMessage({ type: "success", text: "Address deleted successfully!" });
      }
    } catch (err) {
      setMessage({
        type: "danger",
        text: err.response?.data?.message || "Failed to delete address",
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="page-wrapper">
      <Header />
      <div className="container py-4 flex-grow-1">
        <h2 className="mb-4">My Profile</h2>

        {message.text && (
          <div className={`alert alert-${message.type}`} role="alert">
            {message.text}
          </div>
        )}

        <div className="row">
          <div className="col-md-3">
            <div className="list-group">
              <button
                className={`list-group-item list-group-item-action ${
                  activeTab === "profile" ? "active" : ""
                }`}
                onClick={() => setActiveTab("profile")}
              >
                Profile Info
              </button>
              <button
                className={`list-group-item list-group-item-action ${
                  activeTab === "addresses" ? "active" : ""
                }`}
                onClick={() => setActiveTab("addresses")}
              >
                Addresses
              </button>
              <button
                className="list-group-item list-group-item-action text-danger"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>

          <div className="col-md-9">
            {activeTab === "profile" && (
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Profile Information</h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleProfileUpdate}>
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">
                        Email
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        value={user?.email || ""}
                        disabled
                      />
                      <small className="text-muted">
                        Email cannot be changed
                      </small>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="name" className="form-label">
                        Full Name
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="phone" className="form-label">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="e.g., 03001234567"
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-success"
                      disabled={loading}
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === "addresses" && (
              <div>
                {/* Existing Addresses */}
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">Saved Addresses</h5>
                  </div>
                  <div className="card-body">
                    {addresses.length === 0 ? (
                      <p className="text-muted">No addresses saved yet.</p>
                    ) : (
                      addresses.map((addr) => (
                        <div
                          key={addr._id}
                          className="border rounded p-3 mb-2 d-flex justify-content-between align-items-start"
                        >
                          <div>
                            <p className="mb-1">
                              {addr.street}, {addr.city}
                            </p>
                            <p className="mb-0 text-muted">
                              {addr.state} - {addr.zipCode}
                            </p>
                            {addr.isDefault && (
                              <span className="badge bg-success mt-1">
                                Default
                              </span>
                            )}
                          </div>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDeleteAddress(addr._id)}
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Add New Address */}
                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">Add New Address</h5>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleAddAddress}>
                      <div className="mb-3">
                        <label htmlFor="street" className="form-label">
                          Street Address
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="street"
                          value={newAddress.street}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              street: e.target.value,
                            })
                          }
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
                            value={newAddress.city}
                            onChange={(e) =>
                              setNewAddress({
                                ...newAddress,
                                city: e.target.value,
                              })
                            }
                            required
                            placeholder="e.g., Karachi"
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
                            value={newAddress.state}
                            onChange={(e) =>
                              setNewAddress({
                                ...newAddress,
                                state: e.target.value,
                              })
                            }
                            required
                            placeholder="e.g., Sindh"
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
                            value={newAddress.zipCode}
                            onChange={(e) =>
                              setNewAddress({
                                ...newAddress,
                                zipCode: e.target.value,
                              })
                            }
                            required
                            placeholder="e.g., 75500"
                          />
                        </div>
                      </div>
                      <div className="mb-3 form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="isDefault"
                          checked={newAddress.isDefault}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              isDefault: e.target.checked,
                            })
                          }
                        />
                        <label
                          className="form-check-label"
                          htmlFor="isDefault"
                        >
                          Set as default address
                        </label>
                      </div>
                      <button
                        type="submit"
                        className="btn btn-success"
                        disabled={loading}
                      >
                        {loading ? "Adding..." : "Add Address"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
