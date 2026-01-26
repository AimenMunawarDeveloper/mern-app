import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "foodhub_secret_key_2024";

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
};

// Register new user
const register = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      phone,
      address, 
      role, 
      restaurantName, 
      restaurantAddress,
      // Rider fields
      vehicleType,
      vehicleNumber,
      licenseNumber,
    } = req.body;

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "Email already registered" });
    }

    // Create user with address if provided
    const userData = { name, email, password };
    
    if (phone) userData.phone = phone;
    
    // Set role (default to customer if not provided)
    userData.role = role || "customer";
    
    // Restaurant specific fields
    if (role === "restaurant") {
      if (!restaurantName) {
        return res.json({ success: false, message: "Restaurant name is required" });
      }
      userData.restaurantName = restaurantName;
      userData.restaurantAddress = restaurantAddress;
    }

    // Rider specific fields
    if (role === "rider") {
      if (!phone) {
        return res.json({ success: false, message: "Phone number is required for riders" });
      }
      if (!vehicleNumber) {
        return res.json({ success: false, message: "Vehicle number is required for riders" });
      }
      userData.vehicleType = vehicleType || "motorcycle";
      userData.vehicleNumber = vehicleNumber;
      userData.licenseNumber = licenseNumber;
      userData.riderStatus = "offline";
    }
    
    if (address) {
      userData.addresses = [{ ...address, isDefault: true }];
    }

    const user = await userModel.create(userData);

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        restaurantName: user.restaurantName,
        restaurantAddress: user.restaurantAddress,
        vehicleType: user.vehicleType,
        vehicleNumber: user.vehicleNumber,
        riderStatus: user.riderStatus,
        addresses: user.addresses,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        restaurantName: user.restaurantName,
        restaurantAddress: user.restaurantAddress,
        vehicleType: user.vehicleType,
        vehicleNumber: user.vehicleNumber,
        riderStatus: user.riderStatus,
        addresses: user.addresses,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId).select("-password");
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error("Get profile error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, addresses } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (addresses) updates.addresses = addresses;

    const user = await userModel
      .findByIdAndUpdate(req.userId, updates, { new: true })
      .select("-password");

    res.json({ success: true, user });
  } catch (error) {
    console.error("Update profile error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Add address
const addAddress = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const newAddress = req.body;

    // If this is the first address or marked as default, set others to non-default
    if (newAddress.isDefault || user.addresses.length === 0) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
      newAddress.isDefault = true;
    }

    user.addresses.push(newAddress);
    await user.save();

    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    console.error("Add address error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Delete address
const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await userModel.findById(req.userId);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    user.addresses = user.addresses.filter(
      (addr) => addr._id.toString() !== addressId
    );
    await user.save();

    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    console.error("Delete address error:", error);
    res.json({ success: false, message: error.message });
  }
};

export {
  register,
  login,
  getProfile,
  updateProfile,
  addAddress,
  deleteAddress,
};
