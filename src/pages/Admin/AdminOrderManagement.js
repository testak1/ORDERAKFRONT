// src/pages/Admin/AdminOrderManagement.js
import React, { useState, useEffect } from "react";
import { client } from "../../sanityClient";
// No longer need useRef or Pdf imports here as they are in OrderCard
// import { useAuth } from "../../context/AuthContext"; // Only if you need user details directly in this component
import OrderCard from "./OrderCard"; // Import the new OrderCard component

function AdminOrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
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
      setOrders(fetchedOrders);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  // This function is passed down to OrderCard to handle status updates
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await client.patch(orderId).set({ orderStatus: newStatus }).commit();
      // Update state in parent to reflect the change
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

  if (loading) return <div className="text-center py-8">Loading orders...</div>;
  if (error)
    return <div className="text-center text-red-500 py-8">Error: {error}</div>;

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Order Management
      </h2>
      {orders.length === 0 && <p className="text-gray-500">No orders found.</p>}
      <div className="space-y-6">
        {orders.map((order) => (
          <OrderCard
            key={order._id} // Important for React list rendering
            order={order}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            // If you need to re-fetch all orders from parent after update, pass fetchOrders too
            // fetchOrders={fetchOrders}
          />
        ))}
      </div>
    </div>
  );
}

export default AdminOrderManagement;
