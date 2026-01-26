import express from "express";
import {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  reorder,
  // Restaurant functions
  getAllOrders,
  acceptOrder,
  rejectOrder,
  updateStatus,
  getOrderStats,
} from "../controllers/orderController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { isRestaurant } from "../middleware/roleMiddleware.js";

const orderRouter = express.Router();

// All routes require authentication
orderRouter.use(authMiddleware);

// Customer routes
orderRouter.post("/create", createOrder);
orderRouter.get("/list", getUserOrders);
orderRouter.get("/reorder/:orderId", reorder);
orderRouter.put("/cancel/:orderId", cancelOrder);

// Restaurant routes (require restaurant or admin role)
orderRouter.get("/restaurant/all", isRestaurant, getAllOrders);
orderRouter.get("/restaurant/stats", isRestaurant, getOrderStats);
orderRouter.put("/restaurant/accept/:orderId", isRestaurant, acceptOrder);
orderRouter.put("/restaurant/reject/:orderId", isRestaurant, rejectOrder);
orderRouter.put("/restaurant/status/:orderId", isRestaurant, updateStatus);

// This should be last to avoid conflicts with other routes
orderRouter.get("/:orderId", getOrderById);
orderRouter.put("/status/:orderId", updateOrderStatus);

export default orderRouter;
