import React, { createContext, useContext, useReducer, useEffect } from "react";

const CartContext = createContext();

const initialState = {
  items: [],
  restaurant: null, // Track which restaurant the items are from
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case "ADD_TO_CART": {
      const existingIndex = state.items.findIndex(
        (item) =>
          item.id === action.payload.item.id && item.size === action.payload.item.size
      );
      if (existingIndex >= 0) {
        const newItems = [...state.items];
        newItems[existingIndex].quantity += action.payload.item.quantity;
        return { ...state, items: newItems };
      }
      return {
        ...state,
        items: [...state.items, action.payload.item],
        restaurant: action.payload.restaurant || state.restaurant,
      };
    }
    case "REMOVE_FROM_CART": {
      const newItems = state.items.filter(
        (item) =>
          !(item.id === action.payload.id && item.size === action.payload.size)
      );
      // Clear restaurant if cart is empty
      return {
        ...state,
        items: newItems,
        restaurant: newItems.length === 0 ? null : state.restaurant,
      };
    }
    case "UPDATE_QUANTITY":
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id && item.size === action.payload.size
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    case "CLEAR_CART":
      return { ...state, items: [], restaurant: null };
    case "LOAD_CART":
      return {
        ...state,
        items: action.payload.items || [],
        restaurant: action.payload.restaurant || null,
      };
    case "SET_RESTAURANT":
      return { ...state, restaurant: action.payload, items: [] };
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    const savedRestaurant = localStorage.getItem("cartRestaurant");
    if (savedCart) {
      dispatch({
        type: "LOAD_CART",
        payload: {
          items: JSON.parse(savedCart),
          restaurant: savedRestaurant ? JSON.parse(savedRestaurant) : null,
        },
      });
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(state.items));
    if (state.restaurant) {
      localStorage.setItem("cartRestaurant", JSON.stringify(state.restaurant));
    } else {
      localStorage.removeItem("cartRestaurant");
    }
  }, [state.items, state.restaurant]);

  const addToCart = (item, restaurant) => {
    // Check if adding from a different restaurant
    if (state.restaurant && state.restaurant._id !== restaurant._id) {
      // Clear cart and set new restaurant
      dispatch({ type: "SET_RESTAURANT", payload: restaurant });
    }
    dispatch({ type: "ADD_TO_CART", payload: { item, restaurant } });
  };

  const removeFromCart = (id, size) => {
    dispatch({ type: "REMOVE_FROM_CART", payload: { id, size } });
  };

  const updateQuantity = (id, size, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id, size);
    } else {
      dispatch({ type: "UPDATE_QUANTITY", payload: { id, size, quantity } });
    }
  };

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" });
  };

  const getCartTotal = () => {
    return state.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const getCartCount = () => {
    return state.items.reduce((count, item) => count + item.quantity, 0);
  };

  const getDeliveryFee = () => {
    return state.restaurant?.deliveryFee || 150;
  };

  return (
    <CartContext.Provider
      value={{
        cart: state.items,
        restaurant: state.restaurant,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        getDeliveryFee,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
