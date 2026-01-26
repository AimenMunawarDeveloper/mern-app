import express from "express";
import {
  getRiderProfile,
  updateRiderStatus,
  updateLocation,
  getAvailableOrders,
  getMyOrders,
  acceptOrder,
  pickupOrder,
  deliverOrder,
  getRiderStats,
  getAvailableRiders,
  assignRiderToOrder,
  getOrderTracking,
} from "../controllers/riderController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { isRider, isRestaurant } from "../middleware/roleMiddleware.js";

const riderRouter = express.Router();

// Rider routes (protected)
riderRouter.get("/profile", authMiddleware, isRider, getRiderProfile);
riderRouter.put("/status", authMiddleware, isRider, updateRiderStatus);
riderRouter.put("/location", authMiddleware, isRider, updateLocation);
riderRouter.get("/available-orders", authMiddleware, isRider, getAvailableOrders);
riderRouter.get("/my-orders", authMiddleware, isRider, getMyOrders);
riderRouter.put("/accept/:orderId", authMiddleware, isRider, acceptOrder);
riderRouter.put("/pickup/:orderId", authMiddleware, isRider, pickupOrder);
riderRouter.put("/deliver/:orderId", authMiddleware, isRider, deliverOrder);
riderRouter.get("/stats", authMiddleware, isRider, getRiderStats);

// Restaurant routes for rider assignment
riderRouter.get("/available", authMiddleware, isRestaurant, getAvailableRiders);
riderRouter.put("/assign/:orderId", authMiddleware, isRestaurant, assignRiderToOrder);

// Public route for order tracking (customer can track their order)
riderRouter.get("/track/:orderId", authMiddleware, getOrderTracking);

export default riderRouter;
