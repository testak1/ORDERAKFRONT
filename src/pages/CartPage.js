// src/pages/CartPage.js (Styled Example)
import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { client } from "../sanityClient";
import { useNavigate } from "react-router-dom";

function CartPage() {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    getTotalPrice,
    clearCart,
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    addressLine1: "",
    city: "",
    postalCode: "",
    country: "",
  });
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      alert("Please log in to place an order.");
      navigate("/login");
      return;
    }
    if (cartItems.length === 0) {
      alert("Your cart is empty.");
      return;
    }
    if (Object.values(shippingAddress).some((val) => val === "")) {
      alert("Please fill in all shipping address fields.");
      return;
    }

    setOrderLoading(true);
    setOrderError("");
    setOrderSuccess(false);

    const orderDoc = {
      _type: "order",
      user: {
        _ref: user._id,
        _type: "reference",
      },
      items: cartItems.map((item) => ({
        _key: item._id, // Use product ID as key
        product: {
          _ref: item._id, // Reference the product
          _type: "reference",
        },
        title: item.title,
        sku: item.sku,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
      })),
      shippingAddress: shippingAddress,
      totalAmount: getTotalPrice(),
      orderStatus: "pending",
      createdAt: new Date().toISOString(),
    };

    try {
      await client.create(orderDoc);
      setOrderSuccess(true);
      clearCart();
      alert("Order placed successfully!");
      navigate("/profile");
    } catch (error) {
      console.error("Order placement error:", error);
      setOrderError("Failed to place order. Please try again.");
    } finally {
      setOrderLoading(false);
    }
  };

  if (cartItems.length === 0 && !orderSuccess) {
    return (
      <div className="text-center py-8 text-gray-600">
        <h1 className="text-2xl font-semibold mb-4">Your Cart</h1>
        <p>Your cart is empty.</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Your Shopping Cart
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div
              key={item._id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg shadow-sm bg-white"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                <p className="text-md font-medium text-green-700 mt-1">
                  Price: SEK {item.priceAtPurchase.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <label className="text-sm text-gray-600">Quantity:</label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateQuantity(item._id, parseInt(e.target.value))
                  }
                  className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center focus:ring-red-500 focus:border-red-500"
                />
                <button
                  onClick={() => removeFromCart(item._id)}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1.5 px-3 rounded-md text-sm transition-colors duration-200"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">
              Total: SEK {getTotalPrice().toFixed(2)}
            </h2>
          </div>
        </div>
        <div className="md:col-span-1 p-6 border border-gray-200 rounded-lg shadow-sm bg-gray-50 h-fit">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Shipping Address
          </h3>
          <form className="space-y-4">
            {/* Samma formulär som innan */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name:
              </label>
              <input
                type="text"
                name="fullName"
                value={shippingAddress.fullName}
                onChange={handleShippingChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address Line:
              </label>
              <input
                type="text"
                name="addressLine1"
                value={shippingAddress.addressLine1}
                onChange={handleShippingChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  City:
                </label>
                <input
                  type="text"
                  name="city"
                  value={shippingAddress.city}
                  onChange={handleShippingChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Postal Code:
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={shippingAddress.postalCode}
                  onChange={handleShippingChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Country:
              </label>
              <input
                type="text"
                name="country"
                value={shippingAddress.country}
                onChange={handleShippingChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              />
            </div>
          </form>

          {orderError && (
            <p className="text-red-500 text-sm mt-4">{orderError}</p>
          )}
          {orderSuccess && (
            <p className="text-green-600 text-sm mt-4">
              Order placed successfully!
            </p>
          )}
          <button
            onClick={handlePlaceOrder}
            disabled={orderLoading}
            className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            {orderLoading ? "Placing Order..." : "Buy Now"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
