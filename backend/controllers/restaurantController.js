import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import reviewModel from "../models/reviewModel.js";

// Helper function to calculate restaurant rating from product reviews
const calculateRestaurantRating = async (restaurantId) => {
  try {
    // Get all products for this restaurant
    const products = await productModel.find({ restaurantId });
    const productIds = products.map((p) => p._id);

    // Get all reviews for these products
    const reviews = await reviewModel.find({ productId: { $in: productIds } });

    if (reviews.length === 0) {
      return { rating: 0, totalRatings: 0 };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = Math.round((totalRating / reviews.length) * 10) / 10;

    return { rating: avgRating, totalRatings: reviews.length };
  } catch (error) {
    console.error("Calculate rating error:", error);
    return { rating: 0, totalRatings: 0 };
  }
};

// Get all restaurants (for customers) with dynamic ratings
const getAllRestaurants = async (req, res) => {
  try {
    const { cuisine, city, search } = req.query;

    const query = { role: "restaurant" };

    if (cuisine) {
      query.cuisineType = { $regex: cuisine, $options: "i" };
    }

    if (city) {
      query.restaurantAddress = { $regex: city, $options: "i" };
    }

    if (search) {
      query.$or = [
        { restaurantName: { $regex: search, $options: "i" } },
        { cuisineType: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const restaurants = await userModel
      .find(query)
      .select(
        "restaurantName restaurantAddress restaurantImage cuisineType description deliveryTime minimumOrder deliveryFee rating totalRatings isOpen"
      )
      .lean();

    // Calculate dynamic ratings for each restaurant
    const restaurantsWithRatings = await Promise.all(
      restaurants.map(async (restaurant) => {
        const { rating, totalRatings } = await calculateRestaurantRating(restaurant._id);
        return {
          ...restaurant,
          rating,
          totalRatings,
        };
      })
    );

    // Sort by rating (open restaurants first, then by rating)
    restaurantsWithRatings.sort((a, b) => {
      if (a.isOpen !== b.isOpen) return b.isOpen - a.isOpen;
      return b.rating - a.rating;
    });

    res.json({ success: true, restaurants: restaurantsWithRatings });
  } catch (error) {
    console.error("Get restaurants error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get single restaurant details with dynamic rating
const getRestaurantById = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const restaurant = await userModel
      .findOne({ _id: restaurantId, role: "restaurant" })
      .select(
        "restaurantName restaurantAddress restaurantImage cuisineType description deliveryTime minimumOrder deliveryFee rating totalRatings isOpen"
      )
      .lean();

    if (!restaurant) {
      return res.json({ success: false, message: "Restaurant not found" });
    }

    // Calculate dynamic rating
    const { rating, totalRatings } = await calculateRestaurantRating(restaurantId);
    restaurant.rating = rating;
    restaurant.totalRatings = totalRatings;

    res.json({ success: true, restaurant });
  } catch (error) {
    console.error("Get restaurant error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get restaurant's menu/products
const getRestaurantMenu = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { category } = req.query;

    const query = { restaurantId, isAvailable: true };

    if (category && category !== "All") {
      query.categoryName = category;
    }

    const products = await productModel.find(query).sort({ categoryName: 1 });

    // Get unique categories
    const allProducts = await productModel.find({ restaurantId, isAvailable: true });
    const categories = [...new Set(allProducts.map((p) => p.categoryName))];

    res.json({ success: true, products, categories });
  } catch (error) {
    console.error("Get menu error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ============ RESTAURANT OWNER FUNCTIONS ============

// Add product to restaurant menu
const addProduct = async (req, res) => {
  try {
    const { categoryName, name, img, options, description } = req.body;

    const product = await productModel.create({
      restaurantId: req.userId,
      categoryName,
      name,
      img,
      options: options || [],
      description,
    });

    res.json({ success: true, product, message: "Product added successfully" });
  } catch (error) {
    console.error("Add product error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const updates = req.body;

    const product = await productModel.findOneAndUpdate(
      { _id: productId, restaurantId: req.userId },
      updates,
      { new: true }
    );

    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, product, message: "Product updated successfully" });
  } catch (error) {
    console.error("Update product error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await productModel.findOneAndDelete({
      _id: productId,
      restaurantId: req.userId,
    });

    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Toggle product availability
const toggleProductAvailability = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await productModel.findOne({
      _id: productId,
      restaurantId: req.userId,
    });

    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    product.isAvailable = !product.isAvailable;
    await product.save();

    res.json({
      success: true,
      product,
      message: `Product ${product.isAvailable ? "enabled" : "disabled"}`,
    });
  } catch (error) {
    console.error("Toggle availability error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get restaurant's own products (for management)
const getMyProducts = async (req, res) => {
  try {
    const products = await productModel
      .find({ restaurantId: req.userId })
      .sort({ categoryName: 1, name: 1 });

    const categories = [...new Set(products.map((p) => p.categoryName))];

    res.json({ success: true, products, categories });
  } catch (error) {
    console.error("Get my products error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Update restaurant profile
const updateRestaurantProfile = async (req, res) => {
  try {
    const {
      restaurantName,
      restaurantAddress,
      restaurantImage,
      cuisineType,
      description,
      deliveryTime,
      minimumOrder,
      deliveryFee,
      isOpen,
    } = req.body;

    const updates = {};
    if (restaurantName) updates.restaurantName = restaurantName;
    if (restaurantAddress) updates.restaurantAddress = restaurantAddress;
    if (restaurantImage) updates.restaurantImage = restaurantImage;
    if (cuisineType) updates.cuisineType = cuisineType;
    if (description !== undefined) updates.description = description;
    if (deliveryTime) updates.deliveryTime = deliveryTime;
    if (minimumOrder !== undefined) updates.minimumOrder = minimumOrder;
    if (deliveryFee !== undefined) updates.deliveryFee = deliveryFee;
    if (isOpen !== undefined) updates.isOpen = isOpen;

    const restaurant = await userModel
      .findByIdAndUpdate(req.userId, updates, { new: true })
      .select("-password");

    res.json({ success: true, restaurant });
  } catch (error) {
    console.error("Update restaurant profile error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Toggle restaurant open/close status
const toggleRestaurantStatus = async (req, res) => {
  try {
    const restaurant = await userModel.findById(req.userId);

    if (!restaurant) {
      return res.json({ success: false, message: "Restaurant not found" });
    }

    restaurant.isOpen = !restaurant.isOpen;
    await restaurant.save();

    res.json({
      success: true,
      isOpen: restaurant.isOpen,
      message: `Restaurant is now ${restaurant.isOpen ? "open" : "closed"}`,
    });
  } catch (error) {
    console.error("Toggle status error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get restaurant's own status and info
const getMyRestaurantInfo = async (req, res) => {
  try {
    const restaurant = await userModel
      .findById(req.userId)
      .select(
        "restaurantName restaurantAddress restaurantImage cuisineType description deliveryTime minimumOrder deliveryFee isOpen"
      )
      .lean();

    if (!restaurant) {
      return res.json({ success: false, message: "Restaurant not found" });
    }

    // Calculate dynamic rating
    const { rating, totalRatings } = await calculateRestaurantRating(req.userId);
    restaurant.rating = rating;
    restaurant.totalRatings = totalRatings;

    res.json({ success: true, restaurant });
  } catch (error) {
    console.error("Get my restaurant info error:", error);
    res.json({ success: false, message: error.message });
  }
};

export {
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
};
