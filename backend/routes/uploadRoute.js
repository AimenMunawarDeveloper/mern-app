import express from "express";
import multer from "multer";
import { uploadImage, deleteImage } from "../controllers/uploadController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { isRestaurant } from "../middleware/roleMiddleware.js";

const uploadRouter = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Routes
uploadRouter.post(
  "/image",
  authMiddleware,
  isRestaurant,
  upload.single("image"),
  uploadImage
);

uploadRouter.delete("/image", authMiddleware, isRestaurant, deleteImage);

export default uploadRouter;
