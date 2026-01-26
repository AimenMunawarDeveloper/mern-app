import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import axios from "axios";

const FavoritesContext = createContext();

const API_URL = "http://localhost:5000/api/favorites";

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const { isAuthenticated } = useAuth();

  // Load favorites from localStorage or server
  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites();
    } else {
      // Load from localStorage for non-authenticated users
      const savedFavorites = localStorage.getItem("favorites");
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    }
  }, [isAuthenticated]);

  const fetchFavorites = async () => {
    try {
      const response = await axios.get(API_URL);
      if (response.data.success) {
        setFavorites(response.data.favorites);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  const addToFavorites = async (product) => {
    if (isAuthenticated) {
      try {
        const response = await axios.post(`${API_URL}/add`, {
          productId: product._id,
        });
        if (response.data.success) {
          setFavorites([...favorites, product]);
        }
      } catch (error) {
        console.error("Error adding to favorites:", error);
      }
    } else {
      const newFavorites = [...favorites, product];
      setFavorites(newFavorites);
      localStorage.setItem("favorites", JSON.stringify(newFavorites));
    }
  };

  const removeFromFavorites = async (productId) => {
    if (isAuthenticated) {
      try {
        const response = await axios.delete(`${API_URL}/remove/${productId}`);
        if (response.data.success) {
          setFavorites(favorites.filter((fav) => fav._id !== productId));
        }
      } catch (error) {
        console.error("Error removing from favorites:", error);
      }
    } else {
      const newFavorites = favorites.filter((fav) => fav._id !== productId);
      setFavorites(newFavorites);
      localStorage.setItem("favorites", JSON.stringify(newFavorites));
    }
  };

  const isFavorite = (productId) => {
    return favorites.some((fav) => fav._id === productId);
  };

  const toggleFavorite = (product, restaurant = null) => {
    if (isFavorite(product._id)) {
      removeFromFavorites(product._id);
    } else {
      addToFavorites(product, restaurant);
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        toggleFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
};
