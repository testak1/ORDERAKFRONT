// src/pages/Admin/OrderCard.js
import React, { useState } from "react";
import { client } from "../../sanityClient";

// Helper for status colors
const statusColors = {
  pending: "bg-yellow-200 text-yellow-800",
  processing: "bg-blue-200 text-blue-800",
  shipped: "bg-indigo-200 text-indigo-800",
  completed: "bg-green-200 text-green-800",
  cancelled: "bg-red-200 text-red-800",
};

function OrderCard({ order, refreshOrders }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    try {
      await client.patch(order._id).set({ orderStatus: newStatus }).commit();
      // Call the refresh function passed from the parent
      if (typeof refreshOrders === "function") {
        refreshOrders();
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
      alert("Failed to update status.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden bg-white">
      <div
        className="p-4 flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h3 className="font-bold text-lg text-gray-800">
            Order #{order._id.slice(-6)}
          </h3>
          <p className="text-sm text-gray-600">
            Customer: {order.user?.username || "N/A"}
          </p>
          <p className="text-sm text-gray-600">
            Date: {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <span
            className={`px-3 py-1 text-sm font-semibold rounded-full ${
              statusColors[order.orderStatus] || "bg-gray-200"
            }`}
          >
            {order.orderStatus}
          </span>
          <i
            className={`fa-solid fa-chevron-down transform transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          ></i>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <h4 className="font-semibold mb-2">Order Details</h4>
          <div className="mb-4">
            <strong>Shipping to:</strong>
            <p className="text-sm text-gray-700">
              {order.shippingAddress.fullName},{" "}
              {order.shippingAddress.addressLine1}, {order.shippingAddress.city}
              , {order.shippingAddress.postalCode}
            </p>
          </div>

          <ul className="space-y-2 mb-4">
            {order.items.map((item) => (
              <li key={item._key} className="flex justify-between text-sm">
                <span>
                  {item.title} (x{item.quantity})
                </span>
                <span>
                  SEK {(item.priceAtPurchase * item.quantity).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>

          <div className="font-bold text-right mb-4">
            Total: SEK {order.totalAmount.toFixed(2)}
          </div>

          <div className="flex items-center space-x-2">
            <label
              htmlFor={`status-${order._id}`}
              className="text-sm font-medium"
            >
              Update Status:
            </label>
            <select
              id={`status-${order._id}`}
              value={order.orderStatus}
              disabled={isUpdating}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-red-500 disabled:opacity-50"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderCard;
