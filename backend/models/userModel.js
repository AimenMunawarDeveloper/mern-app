import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    role: {
      type: String,
      enum: ["customer", "restaurant", "admin", "rider"],
      default: "customer",
    },
    // Restaurant specific fields
    restaurantName: { type: String },
    restaurantAddress: { type: String },
    restaurantImage: { type: String },
    cuisineType: { type: String }, // e.g., "Pakistani", "Chinese", "Fast Food"
    description: { type: String },
    deliveryTime: { type: String, default: "30-45 min" },
    minimumOrder: { type: Number, default: 200 },
    deliveryFee: { type: Number, default: 150 },
    rating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    isOpen: { type: Boolean, default: true },
    // Rider specific fields
    vehicleType: { type: String, enum: ["bike", "motorcycle", "car", "bicycle"] },
    vehicleNumber: { type: String },
    licenseNumber: { type: String },
    riderStatus: { 
      type: String, 
      enum: ["available", "busy", "offline"], 
      default: "offline" 
    },
    currentLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      lastUpdated: { type: Date },
    },
    totalDeliveries: { type: Number, default: 0 },
    riderRating: { type: Number, default: 5 },
    totalRiderRatings: { type: Number, default: 0 },
    addresses: [addressSchema],
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "products" }],
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const userModel = mongoose.model("users", userSchema);
export default userModel;
