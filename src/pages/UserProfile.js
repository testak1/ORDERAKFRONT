import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { client } from "../sanityClient";
import OrderCard from "./Admin/OrderCard"; // Reusing the OrderCard
import PdfExportModal from "../components/PdfExportModal"; // Import the modal

function UserProfile() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- NEW STATE FOR CONTROLLING THE MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const query = `*[_type == "order" && user._ref == $userId] { ..., items[]{ ..., product->{title, sku} } } | order(createdAt desc)`;
        const userOrders = await client.fetch(query, { userId: user._id });
        setOrders(userOrders);
      } catch (error) {
        console.error("Failed to fetch user orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  // --- FUNCTIONS TO HANDLE THE MODAL ---
  const handleOpenPdfModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleClosePdfModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  if (!user) {
    return <div>Please log in to see your profile.</div>;
  }

  return (
    <>
      {/* The Modal is rendered here when active */}
      {isModalOpen && (
        <PdfExportModal order={selectedOrder} onClose={handleClosePdfModal} />
      )}

      <div className="p-6 bg-white rounded-lg shadow-xl">
        <div className="flex justify-between items-start mb-6 border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
            <p className="text-lg text-gray-600">Welcome, {user.username}!</p>
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
            <div className="space-y-6">
              {orders.map((order) => (
                // The OrderCard now correctly triggers the modal
                <OrderCard
                  key={order._id}
                  order={order}
                  isAdminView={false}
                  onExportPdf={handleOpenPdfModal}
                />
              ))}
            </div>
          ) : (
            <p>You have not placed any orders yet.</p>
          )}
        </div>
      </div>
    </>
  );
}

export default UserProfile;
