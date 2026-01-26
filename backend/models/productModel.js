import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  categoryName: { type: String, required: true },
  name: { type: String, required: true },
  img: { type: String },
  options: { type: Array },
  description: { type: String },
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

const productModel = mongoose.model("products", productSchema);
export default productModel;
