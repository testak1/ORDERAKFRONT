// src/pages/ProfilePage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { client } from '../sanityClient';
import bcrypt from 'bcryptjs';

function ProfilePage() {
  const { user, login } = useAuth(); // Need login to re-set cookie after password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeMessage, setPasswordChangeMessage] = useState('');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');

  // Fetch user-specific orders
  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!user?._id) {
        setOrdersLoading(false);
        return;
      }
      setOrdersLoading(true);
      try {
        const query = `*[_type == "order" && user._ref == "${user._id}"]{
          _id,
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
        setOrdersError("Failed to load your orders.");
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchUserOrders();
  }, [user?._id]); // Re-fetch if user ID changes

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordChangeMessage('');

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordChangeMessage('All password fields are required.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeMessage('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordChangeMessage('New password must be at least 6 characters long.');
      return;
    }

    try {
      // 1. Fetch user to verify current password
      const fetchedUser = await client.fetch(`*[_type == "user" && _id == "${user._id}"][0]{password}`);
      if (!fetchedUser || !bcrypt.compareSync(currentPassword, fetchedUser.password)) {
        setPasswordChangeMessage('Current password incorrect.');
        return;
      }

      // 2. Hash new password
      const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

      // 3. Update password in Sanity
      await client.patch(user._id).set({ password: hashedNewPassword }).commit();

      setPasswordChangeMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      // Optionally re-login the user to update their session cookie, though
      // the existing session should still be valid as only password hash changed.
      // If using JWTs, you'd invalidate and issue new tokens here.
      alert('Password changed successfully!');

    } catch (error) {
      console.error("Password change failed:", error);
      setPasswordChangeMessage('Failed to change password. Please try again.');
    }
  };

  if (!user) {
    return <div className="text-center py-8 text-gray-600">Please log in to view your profile.</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">Welcome, {user.username}</h1>

      {/* Change Password Section */}
      <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          {passwordChangeMessage && (
            <p className={`text-sm text-center ${passwordChangeMessage.includes('successfully') ? 'text-green-600' : 'text-red-500'}`}>
              {passwordChangeMessage}
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="currentPassword">Current Password:</label>
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
            <label className="block text-sm font-medium text-gray-700" htmlFor="newPassword">New Password:</label>
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
            <label className="block text-sm font-medium text-gray-700" htmlFor="confirmNewPassword">Confirm New Password:</label>
            <input
              type="password"
              id="confirmNewPassword"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200">
            Change Password
          </button>
        </form>
      </div>

      {/* Placed Orders Section */}
      <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Placed Orders</h2>
        {ordersLoading ? (
          <div className="text-center py-4 text-gray-600">Loading your orders...</div>
        ) : ordersError ? (
          <div className="text-center py-4 text-red-500">{ordersError}</div>
        ) : orders.length === 0 ? (
          <p className="text-gray-500 text-center py-4">You have not placed any orders yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Order ID: {order._id}</h3>
                  <span className={`text-md font-bold ${
                      order.orderStatus === 'pending' ? 'text-yellow-600' :
                      order.orderStatus === 'processing' ? 'text-blue-600' :
                      order.orderStatus === 'shipped' ? 'text-purple-600' :
                      order.orderStatus === 'completed' ? 'text-green-600' :
                      order.orderStatus === 'cancelled' ? 'text-red-600' : 'text-gray-600'
                    } capitalize`}>
                    {order.orderStatus}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Ordered On: {new Date(order.createdAt).toLocaleString()}</p>
                <p className="text-xl font-bold text-gray-800 mb-4">Total: SEK {order.totalAmount?.toFixed(2) || 'N/A'}</p> {/* CURRENCY CHANGE */}

                <h4 className="text-md font-semibold text-gray-800 mb-2">Items:</h4>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {order.items?.map((item, index) => (
                    <li key={index}>
                      {item.product?.title || item.title} (SKU: {item.product?.sku || item.sku}) - Qty: {item.quantity} @ SEK {item.priceAtPurchase?.toFixed(2)} each {/* CURRENCY CHANGE */}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
