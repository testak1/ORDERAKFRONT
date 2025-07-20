// src/context/CartContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import { client } from "../sanityClient";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const localCart = localStorage.getItem("cartItems");
    return localCart ? JSON.parse(localCart) : [];
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

  const addToCart = async (productId, quantity = 1) => {
    const product = await client.fetch(
      `*[_id == "${productId}"][0]{_id, title, sku, price}`
    );
    if (!product) {
      console.error("Product not found:", productId);
      return;
    }

    const discountedPrice = applyDiscount(product.price);

    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.productId === productId
      );
      if (existingItem) {
        return prevItems.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [
          ...prevItems,
          {
            productId: product._id,
            title: product.title,
            sku: product.sku,
            quantity: quantity,
            priceAtPurchase: discountedPrice, // Store the price at the time of adding
          },
        ];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.productId !== productId)
    );
  };

  const updateQuantity = (productId, newQuantity) => {
    setCartItems(
      (prevItems) =>
        prevItems
          .map((item) =>
            item.productId === productId
              ? { ...item, quantity: newQuantity }
              : item
          )
          .filter((item) => item.quantity > 0) // Remove if quantity becomes 0 or less
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
