import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "customer",
    restaurantName: "",
    restaurantAddress: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    // Rider fields
    vehicleType: "motorcycle",
    vehicleNumber: "",
    licenseNumber: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (formData.role === "restaurant" && !formData.restaurantName) {
      setError("Restaurant name is required");
      return;
    }

    if (formData.role === "rider") {
      if (!formData.phone) {
        setError("Phone number is required for riders");
        return;
      }
      if (!formData.vehicleNumber) {
        setError("Vehicle number is required for riders");
        return;
      }
    }

    setLoading(true);

    const address =
      formData.street && formData.city && formData.state && formData.zipCode
        ? {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
          }
        : null;

    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      role: formData.role,
      address,
    };

    // Add restaurant fields if role is restaurant
    if (formData.role === "restaurant") {
      userData.restaurantName = formData.restaurantName;
      userData.restaurantAddress = formData.restaurantAddress;
    }

    // Add rider fields if role is rider
    if (formData.role === "rider") {
      userData.vehicleType = formData.vehicleType;
      userData.vehicleNumber = formData.vehicleNumber;
      userData.licenseNumber = formData.licenseNumber;
    }

    const result = await register(userData);

    if (result.success) {
      // Redirect based on role
      if (formData.role === "restaurant") {
        navigate("/restaurant/dashboard");
      } else if (formData.role === "rider") {
        navigate("/rider/dashboard");
      } else {
        navigate("/");
      }
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="page-wrapper">
      <Header />
      <div className="container py-5 d-flex justify-content-center flex-grow-1">
        <div className="card shadow" style={{ maxWidth: "550px", width: "100%" }}>
          <div className="card-body p-4">
            <h2 className="card-title text-center mb-4">Create Account</h2>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Role Selection */}
              <div className="mb-3">
                <label className="form-label">Register as</label>
                <div className="d-flex flex-wrap gap-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="role"
                      id="roleCustomer"
                      value="customer"
                      checked={formData.role === "customer"}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="roleCustomer">
                      🍽️ Customer
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="role"
                      id="roleRestaurant"
                      value="restaurant"
                      checked={formData.role === "restaurant"}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="roleRestaurant">
                      🏪 Restaurant Owner
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="role"
                      id="roleRider"
                      value="rider"
                      checked={formData.role === "rider"}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="roleRider">
                      🏍️ Delivery Rider
                    </label>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="name" className="form-label">
                  Full Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your name"
                />
              </div>

              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  Email address
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                />
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Min 6 characters"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Confirm password"
                  />
                </div>
              </div>

              {/* Restaurant Fields */}
              {formData.role === "restaurant" && (
                <>
                  <h6 className="mt-3 mb-3 text-success">Restaurant Details</h6>
                  <div className="mb-3">
                    <label htmlFor="restaurantName" className="form-label">
                      Restaurant Name *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="restaurantName"
                      name="restaurantName"
                      value={formData.restaurantName}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Karachi Biryani House"
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="restaurantAddress" className="form-label">
                      Restaurant Address
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="restaurantAddress"
                      name="restaurantAddress"
                      value={formData.restaurantAddress}
                      onChange={handleChange}
                      placeholder="Full restaurant address"
                    />
                  </div>
                </>
              )}

              {/* Rider Fields */}
              {formData.role === "rider" && (
                <>
                  <h6 className="mt-3 mb-3 text-warning">Rider Details</h6>
                  <div className="mb-3">
                    <label htmlFor="phone" className="form-label">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="e.g., 0300-1234567"
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="vehicleType" className="form-label">
                        Vehicle Type *
                      </label>
                      <select
                        className="form-select"
                        id="vehicleType"
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={handleChange}
                        required
                      >
                        <option value="bicycle">🚲 Bicycle</option>
                        <option value="bike">🛵 Bike/Scooter</option>
                        <option value="motorcycle">🏍️ Motorcycle</option>
                        <option value="car">🚗 Car</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="vehicleNumber" className="form-label">
                        Vehicle Number *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="vehicleNumber"
                        name="vehicleNumber"
                        value={formData.vehicleNumber}
                        onChange={handleChange}
                        required
                        placeholder="e.g., ABC-1234"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="licenseNumber" className="form-label">
                      License Number (Optional)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="licenseNumber"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      placeholder="Driving license number"
                    />
                  </div>
                </>
              )}

              {/* Address Section for Customers */}
              {formData.role === "customer" && (
                <>
                  <h6 className="mt-3 mb-3">Delivery Address (Optional)</h6>

                  <div className="mb-3">
                    <label htmlFor="street" className="form-label">
                      Street Address
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="street"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      placeholder="123 Main St"
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
                        value={formData.city}
                        onChange={handleChange}
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
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
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
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        placeholder="e.g., 54000"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="btn btn-success w-100 mb-3"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Sign Up"}
              </button>
            </form>

            <p className="text-center mb-0">
              Already have an account?{" "}
              <Link to="/login" className="text-success">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
