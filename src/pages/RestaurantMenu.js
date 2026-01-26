import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

export default function RestaurantMenu() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: "",
    categoryName: "",
    description: "",
    img: "",
    options: [{ regular: "", medium: "", large: "" }],
  });
  
  // Toast state
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  
  // Confirm modal state
  const [confirmDelete, setConfirmDelete] = useState({ show: false, productId: null, productName: "" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const { isAuthenticated, isRestaurant } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !isRestaurant) {
      navigate("/login");
      return;
    }
    fetchProducts();
  }, [isAuthenticated, isRestaurant, navigate]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/restaurant/my/products"
      );
      if (response.data.success) {
        setProducts(response.data.products);
        setCategories(response.data.categories);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [field]: value ? parseInt(value) : "" };
    setFormData({ ...formData, options: newOptions });
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      categoryName: "",
      description: "",
      img: "",
      options: [{ regular: "", medium: "", large: "" }],
    });
    setImagePreview(null);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      categoryName: product.categoryName,
      description: product.description || "",
      img: product.img || "",
      options: product.options?.length > 0 ? product.options : [{ regular: "", medium: "", large: "" }],
    });
    setImagePreview(product.img || null);
    setShowModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    setUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append("image", file);

      const response = await axios.post(
        "http://localhost:5000/api/upload/image",
        uploadData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.success) {
        setFormData({ ...formData, img: response.data.url });
        showToast("Image uploaded successfully", "success");
      } else {
        showToast("Failed to upload image: " + response.data.message, "error");
      }
    } catch (err) {
      console.error("Upload error:", err);
      showToast("Failed to upload image", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clean up options - remove empty values
    const cleanOptions = formData.options.map((opt) => {
      const cleanOpt = {};
      if (opt.regular) cleanOpt.regular = parseInt(opt.regular);
      if (opt.medium) cleanOpt.medium = parseInt(opt.medium);
      if (opt.large) cleanOpt.large = parseInt(opt.large);
      if (opt.half) cleanOpt.half = parseInt(opt.half);
      if (opt.full) cleanOpt.full = parseInt(opt.full);
      return cleanOpt;
    }).filter((opt) => Object.keys(opt).length > 0);

    const productData = {
      ...formData,
      options: cleanOptions.length > 0 ? cleanOptions : [{ regular: 200 }],
    };

    try {
      if (editingProduct) {
        await axios.put(
          `http://localhost:5000/api/restaurant/my/products/${editingProduct._id}`,
          productData
        );
        showToast("Item updated successfully", "success");
      } else {
        await axios.post(
          "http://localhost:5000/api/restaurant/my/products",
          productData
        );
        showToast("Item added successfully", "success");
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      console.error("Error saving product:", err);
      showToast("Failed to save item", "error");
    }
  };

  const handleDelete = (productId, productName) => {
    setConfirmDelete({ show: true, productId, productName });
  };

  const confirmDeleteProduct = async () => {
    const { productId } = confirmDelete;
    setConfirmDelete({ show: false, productId: null, productName: "" });

    try {
      await axios.delete(
        `http://localhost:5000/api/restaurant/my/products/${productId}`
      );
      showToast("Item deleted successfully", "success");
      fetchProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
      showToast("Failed to delete item", "error");
    }
  };

  const handleToggleAvailability = async (productId, currentStatus) => {
    try {
      await axios.put(
        `http://localhost:5000/api/restaurant/my/products/${productId}/toggle`
      );
      showToast(
        currentStatus ? "Item disabled" : "Item enabled",
        "success"
      );
      fetchProducts();
    } catch (err) {
      console.error("Error toggling availability:", err);
      showToast("Failed to update item status", "error");
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="container py-5 text-center flex-grow-1">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Header />
      <div className="container py-4 flex-grow-1">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Manage Menu</h2>
          <button className="btn btn-success" onClick={openAddModal}>
            + Add New Item
          </button>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-5">
            <h4>No menu items yet</h4>
            <p className="text-muted">Start by adding your first dish!</p>
            <button className="btn btn-success" onClick={openAddModal}>
              Add First Item
            </button>
          </div>
        ) : (
          <>
            {/* Category Filter */}
            <div className="mb-4">
              <strong>Categories:</strong>{" "}
              {categories.map((cat) => (
                <span key={cat} className="badge bg-success me-2">
                  {cat}
                </span>
              ))}
            </div>

            {/* Products Table */}
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Prices</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <img
                          src={product.img || "https://via.placeholder.com/50"}
                          alt={product.name}
                          style={{
                            width: "50px",
                            height: "50px",
                            objectFit: "cover",
                            borderRadius: "5px",
                          }}
                        />
                      </td>
                      <td>
                        <strong>{product.name}</strong>
                        <br />
                        <small className="text-muted">{product.description?.slice(0, 50)}...</small>
                      </td>
                      <td>{product.categoryName}</td>
                      <td>
                        {product.options?.map((opt, idx) => (
                          <div key={idx} className="small">
                            {opt.regular && `Regular: Rs.${opt.regular}`}
                            {opt.medium && ` | Medium: Rs.${opt.medium}`}
                            {opt.large && ` | Large: Rs.${opt.large}`}
                            {opt.half && `Half: Rs.${opt.half}`}
                            {opt.full && ` | Full: Rs.${opt.full}`}
                          </div>
                        ))}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            product.isAvailable ? "bg-success" : "bg-secondary"
                          }`}
                        >
                          {product.isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-outline-primary btn-sm me-1"
                          onClick={() => openEditModal(product)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-outline-warning btn-sm me-1"
                          onClick={() => handleToggleAvailability(product._id, product.isAvailable)}
                        >
                          {product.isAvailable ? "Disable" : "Enable"}
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(product._id, product.name)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingProduct ? "Edit Item" : "Add New Item"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Item Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Category *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="categoryName"
                          value={formData.categoryName}
                          onChange={handleInputChange}
                          required
                          list="categories"
                          placeholder="e.g., Biryani, Pizza, Burger"
                        />
                        <datalist id="categories">
                          {categories.map((cat) => (
                            <option key={cat} value={cat} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="2"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Product Image</label>
                      <div className="row">
                        <div className="col-md-8">
                          <input
                            type="file"
                            className="form-control"
                            accept="image/*"
                            onChange={handleImageUpload}
                            ref={fileInputRef}
                            disabled={uploading}
                          />
                          {uploading && (
                            <div className="text-primary small mt-1">
                              <span className="spinner-border spinner-border-sm me-1"></span>
                              Uploading image...
                            </div>
                          )}
                          <div className="text-muted small mt-1">
                            Or enter URL directly:
                          </div>
                          <input
                            type="url"
                            className="form-control form-control-sm mt-1"
                            name="img"
                            value={formData.img}
                            onChange={handleInputChange}
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                        <div className="col-md-4">
                          {imagePreview || formData.img ? (
                            <img
                              src={imagePreview || formData.img}
                              alt="Preview"
                              className="img-thumbnail"
                              style={{ maxHeight: "120px", objectFit: "cover" }}
                            />
                          ) : (
                            <div
                              className="border rounded d-flex align-items-center justify-content-center bg-light"
                              style={{ height: "100px" }}
                            >
                              <span className="text-muted">No image</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Prices (Rs.) *</label>
                      <div className="row">
                        <div className="col-md-4 mb-2">
                          <label className="form-label small">Regular / Half</label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="e.g., 200"
                            value={formData.options[0]?.regular || formData.options[0]?.half || ""}
                            onChange={(e) =>
                              handleOptionChange(0, "regular", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-md-4 mb-2">
                          <label className="form-label small">Medium / Full</label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="e.g., 350"
                            value={formData.options[0]?.medium || formData.options[0]?.full || ""}
                            onChange={(e) =>
                              handleOptionChange(0, "medium", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-md-4 mb-2">
                          <label className="form-label small">Large</label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="e.g., 500"
                            value={formData.options[0]?.large || ""}
                            onChange={(e) =>
                              handleOptionChange(0, "large", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-success">
                      {editingProduct ? "Update Item" : "Add Item"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        show={confirmDelete.show}
        title="Delete Item"
        message={`Are you sure you want to delete "${confirmDelete.productName}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={confirmDeleteProduct}
        onCancel={() => setConfirmDelete({ show: false, productId: null, productName: "" })}
      />

      <Footer />
    </div>
  );
}
