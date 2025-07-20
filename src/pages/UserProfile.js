// src/pages/UserProfile.js (Updated to include Password Change)
import React, { useState, useEffect } from "react";
import { client } from "../sanityClient";
import { useAuth } from "../context/AuthContext";
import OrderCard from "./Admin/OrderCard";
import bcrypt from "bcryptjs"; // Make sure to install bcryptjs: npm install bcryptjs

function UserProfile() {
  const { user, loading: authLoading, login } = useAuth(); // Added login from AuthContext
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State for Change Password functionality
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordChangeMessage, setPasswordChangeMessage] = useState("");

  useEffect(() => {
    const fetchUserOrders = async () => {
      if (authLoading || !user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
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
  }, [user, authLoading]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordChangeMessage("");

    if (!user) {
      setPasswordChangeMessage("You must be logged in to change password.");
      return;
    }
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordChangeMessage("All password fields are required.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeMessage("New password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordChangeMessage(
        "New password must be at least 6 characters long."
      );
      return;
    }

    try {
      // 1. Fetch user again to verify current password (from Sanity directly)
      const fetchedUserForPassCheck = await client.fetch(
        `*[_type == "user" && _id == "${user._id}"][0]{password}`
      );
      if (
        !fetchedUserForPassCheck ||
        !bcrypt.compareSync(currentPassword, fetchedUserForPassCheck.password)
      ) {
        setPasswordChangeMessage("Current password incorrect.");
        return;
      }

      // 2. Hash new password
      const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

      // 3. Update password in Sanity
      await client
        .patch(user._id)
        .set({ password: hashedNewPassword })
        .commit();

      setPasswordChangeMessage("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      alert("Password changed successfully!");
      // Optionally, you might want to re-login the user to update their session,
      // though typically the existing session is fine if only hash changed.
      // If using JWTs, you'd invalidate and issue new tokens here.

      // If you changed the password for the current user, it's good practice to update
      // the user context to reflect potential changes, though not strictly needed for just password.
      // If user had roles/discount updated via admin, then refetching user details for context would be needed.
    } catch (error) {
      console.error("Password change failed:", error);
      setPasswordChangeMessage("Failed to change password. Please try again.");
    }
  };

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

      {/* Change Password Section */}
      <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Change Password
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          {passwordChangeMessage && (
            <p
              className={`text-sm text-center ${
                passwordChangeMessage.includes("successfully")
                  ? "text-green-600"
                  : "text-red-500"
              }`}
            >
              {passwordChangeMessage}
            </p>
          )}
          <div>
            <label
              className="block text-sm font-medium text-gray-700"
              htmlFor="currentPassword"
            >
              Current Password:
            </label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-gray-700"
              htmlFor="newPassword"
            >
              New Password:
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-gray-700"
              htmlFor="confirmNewPassword"
            >
              Confirm New Password:
            </label>
            <input
              type="password"
              id="confirmNewPassword"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
          >
            Change Password
          </button>
        </form>
      </div>

      {/* Placed Orders Section */}
      <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
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
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
