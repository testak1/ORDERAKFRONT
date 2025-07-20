// src/pages/UserProfile.js
import React, { useState, useEffect } from "react";
import { client } from "../sanityClient";
import { useAuth } from "../context/AuthContext";
import OrderCard from "./Admin/OrderCard";
import PdfExportModal from "../components/PdfExportModal"; // Import the modal
import bcrypt from "bcryptjs";

function UserProfile() {
  const { user, loading: authLoading, login } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State for Change Password functionality
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordChangeMessage, setPasswordChangeMessage] = useState("");

  // State for PDF modal
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedOrderForPdf, setSelectedOrderForPdf] = useState(null);

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

      const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

      await client
        .patch(user._id)
        .set({ password: hashedNewPassword })
        .commit();

      setPasswordChangeMessage("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      alert("Password changed successfully!");
    } catch (error) {
      console.error("Password change failed:", error);
      setPasswordChangeMessage("Failed to change password. Please try again.");
    }
  };

  // Function to open the PDF modal
  const handleExportPdf = (order) => {
    setSelectedOrderForPdf(order);
    setShowPdfModal(true);
  };

  const handleClosePdfModal = () => {
    setShowPdfModal(false);
    setSelectedOrderForPdf(null);
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
              onExportPdf={handleExportPdf} // Pass the new handler
            />
          ))}
        </div>
      </div>

      {showPdfModal && (
        <PdfExportModal
          order={selectedOrderForPdf}
          onClose={handleClosePdfModal}
        />
      )}
    </div>
  );
}

export default UserProfile;
