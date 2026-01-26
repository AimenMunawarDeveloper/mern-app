import React, { useEffect, useState, useMemo } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Carousel from "../components/Carousel";
import Search from "../components/Search";
import Products from "../components/Products";
import axios from "axios";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const getProducts = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/product/list"
      );
      if (response.data.success) {
        setProducts(response.data.products);
        setFilteredProducts(response.data.products);
      } else {
        setError("Failed to fetch products. Please try again later.");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("An error occurred while fetching products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProducts();
  }, []);

  // Get unique categories from products
  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.CategoryName))];
    return ["All", ...cats.filter(Boolean)];
  }, [products]);

  // Filter by category
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    if (category === "All") {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(
        products.filter((p) => p.CategoryName === category)
      );
    }
  };

  // Handle search with category filter
  const handleSearch = (searchedProducts) => {
    if (selectedCategory === "All") {
      setFilteredProducts(searchedProducts);
    } else {
      setFilteredProducts(
        searchedProducts.filter((p) => p.CategoryName === selectedCategory)
      );
    }
  };

  return (
    <div>
      <Header />
      <Carousel />
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading delicious food...</p>
        </div>
      )}
      {error && (
        <div className="container">
          <div className="alert alert-danger mt-4" role="alert">
            {error}
          </div>
        </div>
      )}
      {!loading && !error && (
        <>
          <Search
            products={products}
            setFilteredProducts={handleSearch}
          />

          {/* Category Filter */}
          <div className="container">
            <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`btn ${
                    selectedCategory === category
                      ? "btn-success"
                      : "btn-outline-success"
                  }`}
                  onClick={() => handleCategoryChange(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Results count */}
            <p className="text-center text-muted">
              Showing {filteredProducts.length} of {products.length} items
              {selectedCategory !== "All" && ` in ${selectedCategory}`}
            </p>
          </div>

          <Products products={filteredProducts} />
        </>
      )}
      <Footer />
    </div>
  );
}
