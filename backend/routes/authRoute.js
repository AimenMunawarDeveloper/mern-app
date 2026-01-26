import express from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  addAddress,
  deleteAddress,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const authRouter = express.Router();

// Public routes
authRouter.post("/register", register);
authRouter.post("/login", login);

// Protected routes
authRouter.get("/profile", authMiddleware, getProfile);
authRouter.put("/profile", authMiddleware, updateProfile);
authRouter.post("/address", authMiddleware, addAddress);
authRouter.delete("/address/:addressId", authMiddleware, deleteAddress);

export default authRouter;
