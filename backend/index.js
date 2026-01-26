// set up express js here
import dotenv from "dotenv";
dotenv.config();

import productRouter from "./routes/productRoute.js";
import authRouter from "./routes/authRoute.js";
import orderRouter from "./routes/orderRoute.js";
import reviewRouter from "./routes/reviewRoute.js";
import favoritesRouter from "./routes/favoritesRoute.js";
import restaurantRouter from "./routes/restaurantRoute.js";
import uploadRouter from "./routes/uploadRoute.js";
import riderRouter from "./routes/riderRoute.js";
import cors from "cors";
import monogoDB from "./db.js";

import express from "express";

const app = express();
const port = 5000; // front end port
monogoDB();

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON request bodies

// Routes
app.use("/api/product", productRouter);
app.use("/api/auth", authRouter);
app.use("/api/order", orderRouter);
app.use("/api/review", reviewRouter);
app.use("/api/favorites", favoritesRouter);
app.use("/api/restaurant", restaurantRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/rider", riderRouter);

app.get("/", (req, res) => {
  res.send("Hello world - FoodHub API");
});

app.listen(port, () => console.log("server listening at port 5000"));
// 'nodemon' automatically reflect changes on backend
// use mongoose to create schema in mongodb
