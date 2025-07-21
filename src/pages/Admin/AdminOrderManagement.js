// src/pages/Admin/AdminOrderManagement.js
import React, { useState, useEffect } from "react";
import { client } from "../../sanityClient";
import OrderCard from "./OrderCard";

function AdminOrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    if (orders.length === 0) setLoading(true);

    try {
      const query = `*[_type == "order"]{
        ...,
        user->{username} 
      } | order(createdAt desc)`;
      const data = await client.fetch(query);
      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) return <div className="text-center py-8">Loading orders...</div>;
  if (error)
    return <div className="text-center text-red-500 py-8">Error: {error}</div>;

  return (
    <div className="p-4 bg-white rounded-lg shadow-xl">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center border-b-2 border-red-200 pb-4">
        Order Management
      </h2>

      <div className="space-y-6">
        {orders.length > 0 ? (
          orders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              refreshOrders={fetchOrders}
            />
          ))
        ) : (
          <p className="text-center text-gray-500 py-8">No orders found.</p>
        )}
      </div>
    </div>
  );
}

export default AdminOrderManagement;
