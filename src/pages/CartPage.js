import React, { useState, useEffect } from "react";
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

  // --- STATE FOR ADDRESS ---
  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    addressLine1: "",
    city: "",
    postalCode: "",
    country: "",
  });
  const [useDefaultAddress, setUseDefaultAddress] = useState(true);

  // --- STATE FOR ORDER ---
  const [orderLoading, setOrderLoading] = useState(false);

  // Pre-fill the form when the component loads or the user changes
  useEffect(() => {
    if (user && user.address && useDefaultAddress) {
      setShippingAddress({
        fullName: user.fullName || "",
        addressLine1: user.address.addressLine1 || "",
        city: user.address.city || "",
        postalCode: user.address.postalCode || "",
        country: user.address.country || "",
      });
    } else {
      // Clear form if not using default or no default exists
      setShippingAddress({
        fullName: "",
        addressLine1: "",
        city: "",
        postalCode: "",
        country: "",
      });
    }
  }, [user, useDefaultAddress]);

  const handleShippingChange = (e) => {
    setShippingAddress((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
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
    const orderDoc = {
      _type: "order",
      user: { _ref: user._id, _type: "reference" },
      items: cartItems.map((item) => ({
        _key: item._id,
        product: { _ref: item._id, _type: "reference" },
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
      clearCart();
      alert("Order placed successfully!");
      navigate("/profile");
    } catch (error) {
      console.error("Order placement error:", error);
      alert("Failed to place order.");
    } finally {
      setOrderLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Your Shopping Cart
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* Cart items display remains the same */}
        </div>
        <div className="md:col-span-1 p-6 border rounded-lg bg-gray-50 h-fit">
          <h3 className="text-xl font-semibold mb-4">Shipping Address</h3>

          {/* --- ADDRESS SELECTION --- */}
          {user?.address && (
            <div className="mb-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={useDefaultAddress}
                  onChange={(e) => setUseDefaultAddress(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span>Use my default address</span>
              </label>
            </div>
          )}

          {/* Shipping Form */}
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Full Name:</label>
              <input
                type="text"
                name="fullName"
                value={shippingAddress.fullName}
                onChange={handleShippingChange}
                disabled={useDefaultAddress}
                required
                className="mt-1 w-full px-3 py-2 border rounded-md disabled:bg-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Address Line:</label>
              <input
                type="text"
                name="addressLine1"
                value={shippingAddress.addressLine1}
                onChange={handleShippingChange}
                disabled={useDefaultAddress}
                required
                className="mt-1 w-full px-3 py-2 border rounded-md disabled:bg-gray-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">City:</label>
                <input
                  type="text"
                  name="city"
                  value={shippingAddress.city}
                  onChange={handleShippingChange}
                  disabled={useDefaultAddress}
                  required
                  className="mt-1 w-full px-3 py-2 border rounded-md disabled:bg-gray-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Postal Code:
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={shippingAddress.postalCode}
                  onChange={handleShippingChange}
                  disabled={useDefaultAddress}
                  required
                  className="mt-1 w-full px-3 py-2 border rounded-md disabled:bg-gray-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Country:</label>
              <input
                type="text"
                name="country"
                value={shippingAddress.country}
                onChange={handleShippingChange}
                disabled={useDefaultAddress}
                required
                className="mt-1 w-full px-3 py-2 border rounded-md disabled:bg-gray-200"
              />
            </div>
          </form>

          <button
            onClick={handlePlaceOrder}
            disabled={orderLoading}
            className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-md disabled:opacity-50"
          >
            {orderLoading
              ? "Placing Order..."
              : `Buy Now (SEK ${getTotalPrice().toFixed(2)})`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
