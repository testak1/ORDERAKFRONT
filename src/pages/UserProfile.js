// src/pages/UserProfile.js
import React, { useState, useEffect } from "react";
import { client } from "../sanityClient";
import { useAuth } from "../context/AuthContext";
import OrderCard from "./Admin/OrderCard"; // Reuse the OrderCard component

function UserProfile() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserOrders = async () => {
      if (authLoading || !user) {
        // Wait for auth to load or if no user is logged in
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        // Query orders specific to the logged-in user
        const query = `*[_type == "order" && user._ref == "${user._id}"]{
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
        console.error("Failed to fetch user orders:", err);
        setError("Failed to load your orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserOrders();
  }, [user, authLoading]); // Re-run effect when user or authLoading changes

  if (authLoading) {
    return <div className="text-center py-8">Loading user profile...</div>;
  }

  if (!user) {
    return (
      <div className="text-center py-8 text-red-500">
        Please log in to view your profile.
      </div>
    );
  }

  if (loading)
    return <div className="text-center py-8">Loading your orders...</div>;
  if (error)
    return <div className="text-center text-red-500 py-8">Error: {error}</div>;

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">
        My Profile
      </h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">
        Welcome, {user.username}!
      </h2>

      <h3 className="text-xl font-semibold text-gray-800 mb-4">My Orders</h3>
      {orders.length === 0 && (
        <p className="text-gray-500">You have not placed any orders yet.</p>
      )}
      <div className="space-y-6">
        {orders.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            isAdminView={false} // Pass false to hide admin-specific controls
            // onUpdateOrderStatus is not passed as users can't update status from profile
          />
        ))}
      </div>
    </div>
  );
}

export default UserProfile;
