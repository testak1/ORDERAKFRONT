import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { client } from "../sanityClient";

// Helper for status colors, to be consistent with admin view
const statusColors = {
  pending: "bg-yellow-200 text-yellow-800",
  processing: "bg-blue-200 text-blue-800",
  shipped: "bg-indigo-200 text-indigo-800",
  completed: "bg-green-200 text-green-800",
  cancelled: "bg-red-200 text-red-800",
};

function UserProfile() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (user) {
        setLoading(true);
        try {
          const query = `*[_type == "order" && user._ref == $userId] | order(createdAt desc)`;
          const params = { userId: user._id };
          const userOrders = await client.fetch(query, params);
          setOrders(userOrders);
        } catch (error) {
          console.error("Failed to fetch user orders:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchOrders();
  }, [user]);

  if (!user) {
    return <div>Please log in to see your profile.</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl">
      <div className="flex justify-between items-start mb-6 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
          <p className="text-lg text-gray-600">Welcome, {user.username}!</p>
          {user.discountPercentage > 0 && (
            <p className="text-md text-green-600 font-semibold">
              Your special discount: {user.discountPercentage}%
            </p>
          )}
        </div>
        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md"
        >
          Logout
        </button>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">My Orders</h2>
        {loading ? (
          <p>Loading your orders...</p>
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">
                      Order #{order._id.slice(-6)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Date: {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    <p className="font-bold mt-1">
                      Total: SEK {order.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  {/* Read-only status display for the user */}
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Status:
                    </p>
                    <span
                      className={`px-3 py-1 text-sm font-semibold rounded-full ${
                        statusColors[order.orderStatus] || "bg-gray-200"
                      }`}
                    >
                      {order.orderStatus}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>You have not placed any orders yet.</p>
        )}
      </div>
    </div>
  );
}

export default UserProfile;
