import userModel from "../models/userModel.js";

// Middleware to check if user has required role
const requireRole = (...roles) => {
  return async (req, res, next) => {
    try {
      const user = await userModel.findById(req.userId);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Insufficient permissions.",
        });
      }

      req.userRole = user.role;
      next();
    } catch (error) {
      console.error("Role middleware error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };
};

// Check if restaurant
const isRestaurant = requireRole("restaurant", "admin");

// Check if admin
const isAdmin = requireRole("admin");

// Check if customer
const isCustomer = requireRole("customer");

// Check if rider
const isRider = requireRole("rider", "admin");

export { requireRole, isRestaurant, isAdmin, isCustomer, isRider };
