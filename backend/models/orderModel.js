import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "products",
    required: true,
  },
  name: { type: String, required: true },
  img: { type: String },
  size: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
});

// Track rider's location history for the delivery
const locationUpdateSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    restaurantName: { type: String },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    deliveryAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      // Coordinates for delivery location
      latitude: { type: Number },
      longitude: { type: Number },
    },
    // Restaurant location for pickup
    restaurantLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    paymentMethod: {
      type: String,
      enum: ["card", "cash", "jazzcash", "easypaisa"],
      default: "cash",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    orderStatus: {
      type: String,
      enum: [
        "placed",
        "confirmed",
        "preparing",
        "ready_for_pickup",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "placed",
    },
    // Rider assignment
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    riderName: { type: String },
    riderPhone: { type: String },
    riderAssignedAt: { type: Date },
    // Real-time tracking
    riderCurrentLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      lastUpdated: { type: Date },
    },
    locationHistory: [locationUpdateSchema],
    // Timestamps for tracking
    pickedUpAt: { type: Date },
    deliveredAt: { type: Date },
    estimatedDeliveryTime: { type: Date },
    // Distance and ETA
    totalDistance: { type: Number }, // in kilometers
    estimatedMinutes: { type: Number },
    specialInstructions: { type: String },
  },
  { timestamps: true }
);

const orderModel = mongoose.model("orders", orderSchema);
export default orderModel;
