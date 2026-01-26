import cloudinary from "../config/cloudinary.js";

// Upload image to Cloudinary
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ success: false, message: "No file uploaded" });
    }

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "foodhub/products",
      transformation: [
        { width: 600, height: 400, crop: "fill" },
        { quality: "auto" },
      ],
    });

    res.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Delete image from Cloudinary
const deleteImage = async (req, res) => {
  try {
    const { public_id } = req.body;

    if (!public_id) {
      return res.json({ success: false, message: "Public ID required" });
    }

    await cloudinary.uploader.destroy(public_id);

    res.json({ success: true, message: "Image deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.json({ success: false, message: error.message });
  }
};

export { uploadImage, deleteImage };
