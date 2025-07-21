// src/pages/Admin/AdminOrderManagement.js
import React, { useState, useEffect } from "react";
import { client } from "../../sanityClient";
import OrderCard from "./OrderCard";
import PdfExportModal from "../../components/PdfExportModal"; // Import the modal

function AdminOrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedOrderForPdf, setSelectedOrderForPdf] = useState(null);

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

  // Function to open the PDF modal
  const handleExportPdf = (order) => {
    setSelectedOrderForPdf(order);
    setShowPdfModal(true);
  };

  const handleClosePdfModal = () => {
    setShowPdfModal(false);
    setSelectedOrderForPdf(null);
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
            key={order._id}
            order={order}
            isAdminView={true} // This is the admin view
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onExportPdf={handleExportPdf} // Pass the new handler
          />
        ))}
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

export default AdminOrderManagement;
