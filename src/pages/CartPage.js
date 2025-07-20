// src/pages/CartPage.js
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
    addressLine2: "",
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
        _key: item.productId, // Unique key for array items
        product: {
          _ref: item.productId,
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
      navigate("/orders"); // Redirect to order history or confirmation
    } catch (error) {
      console.error("Order placement error:", error);
      setOrderError("Failed to place order. Please try again.");
    } finally {
      setOrderLoading(false);
    }
  };

  if (cartItems.length === 0 && !orderSuccess) {
    return <div>Your cart is empty.</div>;
  }

  return (
    <div>
      <h1>Your Shopping Cart</h1>
      {cartItems.map((item) => (
        <div
          key={item.productId}
          style={{
            border: "1px solid #eee",
            padding: "10px",
            marginBottom: "10px",
          }}
        >
          <h3>{item.title}</h3>
          <p>SKU: {item.sku}</p>
          <p>Price: ${item.priceAtPurchase.toFixed(2)}</p>
          <p>
            Quantity:
            <input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) =>
                updateQuantity(item.productId, parseInt(e.target.value))
              }
              style={{ width: "60px", marginLeft: "5px" }}
            />
          </p>
          <button onClick={() => removeFromCart(item.productId)}>Remove</button>
        </div>
      ))}
      <h2>Total: ${getTotalPrice().toFixed(2)}</h2>

      <h3>Shipping Address</h3>
      <form>
        <div>
          <label>Full Name:</label>
          <input
            type="text"
            name="fullName"
            value={shippingAddress.fullName}
            onChange={handleShippingChange}
            required
          />
        </div>
        <div>
          <label>Address Line 1:</label>
          <input
            type="text"
            name="addressLine1"
            value={shippingAddress.addressLine1}
            onChange={handleShippingChange}
            required
          />
        </div>
        <div>
          <label>Address Line 2:</label>
          <input
            type="text"
            name="addressLine2"
            value={shippingAddress.addressLine2}
            onChange={handleShippingChange}
          />
        </div>
        <div>
          <label>City:</label>
          <input
            type="text"
            name="city"
            value={shippingAddress.city}
            onChange={handleShippingChange}
            required
          />
        </div>
        <div>
          <label>Postal Code:</label>
          <input
            type="text"
            name="postalCode"
            value={shippingAddress.postalCode}
            onChange={handleShippingChange}
            required
          />
        </div>
        <div>
          <label>Country:</label>
          <input
            type="text"
            name="country"
            value={shippingAddress.country}
            onChange={handleShippingChange}
            required
          />
        </div>
      </form>

      {orderError && <p style={{ color: "red" }}>{orderError}</p>}
      {orderSuccess && (
        <p style={{ color: "green" }}>Order placed successfully!</p>
      )}
      <button onClick={handlePlaceOrder} disabled={orderLoading}>
        {orderLoading ? "Placing Order..." : "Buy Now"}
      </button>
    </div>
  );
}

export default CartPage;
