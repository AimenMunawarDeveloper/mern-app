import express from "express";
import {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
} from "../controllers/favoritesController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const favoritesRouter = express.Router();

// All routes require authentication
favoritesRouter.use(authMiddleware);

favoritesRouter.get("/", getFavorites);
favoritesRouter.post("/add", addToFavorites);
favoritesRouter.delete("/remove/:productId", removeFromFavorites);

export default favoritesRouter;
