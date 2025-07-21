import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { client } from "../sanityClient";
import OrderCard from "./Admin/OrderCard"; // We can reuse the OrderCard component!

function UserProfile() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (user) {
        setLoading(true);
        try {
          // This query now fetches referenced product data directly
          const query = `*[_type == "order" && user._ref == $userId] {
            ...,
            items[]{
              ...,
              product->{title, sku} // Fetch title and sku from the referenced product
            }
          } | order(createdAt desc)`;
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

  // --- NEW PDF EXPORT FUNCTION ---
  const handleExportOrderPdf = (order) => {
    const doc = new jsPDF();

    // Add Header
    doc.setFontSize(20);
    doc.text("Order Details", 14, 22);
    doc.setFontSize(10);
    doc.text(`Order ID: ${order._id}`, 14, 30);
    doc.text(
      `Order Date: ${new Date(order.createdAt).toLocaleDateString()}`,
      14,
      35
    );

    // Shipping Details
    doc.setFontSize(12);
    doc.text("Shipping Address", 14, 45);
    doc.setFontSize(10);
    const shippingAddr = order.shippingAddress;
    doc.text(`${shippingAddr.fullName}`, 14, 50);
    doc.text(`${shippingAddr.addressLine1}`, 14, 55);
    doc.text(`${shippingAddr.city}, ${shippingAddr.postalCode}`, 14, 60);
    doc.text(`${shippingAddr.country}`, 14, 65);

    // Items Table
    const tableColumn = ["Product Title", "SKU", "Quantity", "Price", "Total"];
    const tableRows = [];

    order.items.forEach((item) => {
      const itemData = [
        item.title || item.product?.title,
        item.sku || item.product?.sku,
        item.quantity,
        `SEK ${item.priceAtPurchase.toFixed(2)}`,
        `SEK ${(item.quantity * item.priceAtPurchase).toFixed(2)}`,
      ];
      tableRows.push(itemData);
    });

    // Add a row for the total
    tableRows.push([
      "",
      "",
      "",
      "Total Amount:",
      `SEK ${order.totalAmount.toFixed(2)}`,
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 75,
      styles: { halign: "left" },
      headStyles: { fillColor: [209, 213, 219] }, // gray-300
      didDrawCell: (data) => {
        // Style the total row
        if (data.row.index === tableRows.length - 1) {
          doc.setFont(undefined, "bold");
        }
      },
    });

    doc.save(`order_${order._id.slice(-6)}.pdf`);
  };

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
          <div className="space-y-6">
            {orders.map((order) => (
              // Re-use the OrderCard, passing the PDF function and setting isAdminView to false
              <OrderCard
                key={order._id}
                order={order}
                isAdminView={false}
                onExportPdf={handleExportOrderPdf}
              />
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
