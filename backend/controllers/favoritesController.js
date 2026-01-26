import userModel from "../models/userModel.js";

// Get user's favorites
const getFavorites = async (req, res) => {
  try {
    const user = await userModel
      .findById(req.userId)
      .populate("favorites");

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({ success: true, favorites: user.favorites });
  } catch (error) {
    console.error("Get favorites error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Add to favorites
const addToFavorites = async (req, res) => {
  try {
    const { productId } = req.body;

    const user = await userModel.findById(req.userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Check if already in favorites
    if (user.favorites.includes(productId)) {
      return res.json({
        success: false,
        message: "Product already in favorites",
      });
    }

    user.favorites.push(productId);
    await user.save();

    const updatedUser = await userModel
      .findById(req.userId)
      .populate("favorites");

    res.json({ success: true, favorites: updatedUser.favorites });
  } catch (error) {
    console.error("Add to favorites error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Remove from favorites
const removeFromFavorites = async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await userModel.findById(req.userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    user.favorites = user.favorites.filter(
      (fav) => fav.toString() !== productId
    );
    await user.save();

    const updatedUser = await userModel
      .findById(req.userId)
      .populate("favorites");

    res.json({ success: true, favorites: updatedUser.favorites });
  } catch (error) {
    console.error("Remove from favorites error:", error);
    res.json({ success: false, message: error.message });
  }
};

export { getFavorites, addToFavorites, removeFromFavorites };
