// src/pages/Admin/AdminOrderManagement.js
import React, { useState, useEffect } from "react";
import { client } from "../../sanityClient";
import OrderCard from "./OrderCard"; // Import the OrderCard component

function AdminOrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(""); // Clear previous errors
    try {
      const query = `*[_type == "order"]{
          _id,
          user->{username, _id},
          items[]{product->{title, sku}, quantity, priceAtPurchase},
          shippingAddress,
          totalAmount,
          orderStatus,
          createdAt
        } | order(createdAt desc)`;
      const fetchedOrders = await client.fetch(query);
      console.log("Fetched Orders:", fetchedOrders); // DEBUG: Check what data is returned
      setOrders(fetchedOrders);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Failed to load orders. Please check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await client.patch(orderId).set({ orderStatus: newStatus }).commit();
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, orderStatus: newStatus } : order
        )
      );
      alert("Order status updated!");
    } catch (error) {
      console.error("Failed to update order status:", error);
      alert("Failed to update order status.");
    }
  };

  // --- Render based on loading/error/data states ---
  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-gray-600">Loading orders...</p>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mt-4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p className="text-lg font-semibold mb-2">Error loading orders!</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Management</h2>
      {orders.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No orders found.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminOrderManagement;
