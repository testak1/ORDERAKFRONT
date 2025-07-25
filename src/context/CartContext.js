// src/context/CartContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const localCart = localStorage.getItem("cartItems");
      return localCart ? JSON.parse(localCart) : [];
    } catch (error) {
      console.error("Failed to parse cart from localStorage", error);
      return [];
    }
  });

  const { user } = useAuth();

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  const applyDiscount = (basePrice) => {
    if (user && user.discountPercentage) {
      return basePrice * (1 - user.discountPercentage / 100);
    }
    return basePrice;
  };

  const addToCart = (product, quantity = 1) => {
  if (!product || !product._id || typeof product.price !== "number") {
    console.error("Invalid product data:", product);
    toast.error("Kunde inte lägga till produkten. Ogiltig produktdata.", {
      position: "top-center",
    });
    return;
  }

  const discountedPrice = applyDiscount(product.price);

  setCartItems((prevItems) => {
    const existingItem = prevItems.find((item) => item._id === product._id);
    
    if (existingItem) {
      toast(`Ökade antal för ${product.title}`, {
        position: "top-right",
        autoClose: 2000,
      });
      return prevItems.map((item) =>
        item._id === product._id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      toast.success(`${product.title} lades till i varukorgen!`, {
        position: "top-right",
        autoClose: 2000,
      });
      return [
          ...prevItems,
          {
            ...product,
            _id: product._id,
            title: product.title,
            sku: product.sku,
            priceAtPurchase: discountedPrice,
            quantity: quantity,
          },
        ];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item._id !== productId)
    );
  };

  const updateQuantity = (productId, newQuantity) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) =>
          item._id === productId ? { ...item, quantity: newQuantity } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const getTotalPrice = () => {
    return cartItems.reduce(
      (total, item) => total + item.quantity * item.priceAtPurchase,
      0
    );
  };

  const clearCart = () => {
    setCartItems([]);
    toast.success('Order placed successfully!', {
      icon: '🎉',
    });
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        getTotalPrice,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
