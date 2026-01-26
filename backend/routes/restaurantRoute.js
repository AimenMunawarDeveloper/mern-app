import express from "express";
import {
  getAllRestaurants,
  getRestaurantById,
  getRestaurantMenu,
  addProduct,
  updateProduct,
  deleteProduct,
  toggleProductAvailability,
  getMyProducts,
  updateRestaurantProfile,
  toggleRestaurantStatus,
  getMyRestaurantInfo,
} from "../controllers/restaurantController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { isRestaurant } from "../middleware/roleMiddleware.js";

const restaurantRouter = express.Router();

// Public routes (for customers) - specific routes first
restaurantRouter.get("/list", getAllRestaurants);

// Protected routes (for restaurant owners) - MUST come before /:restaurantId
restaurantRouter.get("/my/info", authMiddleware, isRestaurant, getMyRestaurantInfo);
restaurantRouter.get("/my/products", authMiddleware, isRestaurant, getMyProducts);
restaurantRouter.post("/my/products", authMiddleware, isRestaurant, addProduct);
restaurantRouter.put("/my/products/:productId", authMiddleware, isRestaurant, updateProduct);
restaurantRouter.delete("/my/products/:productId", authMiddleware, isRestaurant, deleteProduct);
restaurantRouter.put("/my/products/:productId/toggle", authMiddleware, isRestaurant, toggleProductAvailability);
restaurantRouter.put("/my/profile", authMiddleware, isRestaurant, updateRestaurantProfile);
restaurantRouter.put("/my/toggle-status", authMiddleware, isRestaurant, toggleRestaurantStatus);

// Public routes with params (must come after /my/* routes)
restaurantRouter.get("/:restaurantId", getRestaurantById);
restaurantRouter.get("/:restaurantId/menu", getRestaurantMenu);

export default restaurantRouter;
