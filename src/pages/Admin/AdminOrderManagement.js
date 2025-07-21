import React, { useState, useEffect } from "react";
import { client } from "../../sanityClient";
import OrderCard from "./OrderCard";
import CollapsibleSection from "../../components/CollapsibleSection"; // Assuming this is still used

// Import libraries for PDF generation
import jsPDF from "jspdf";
import "jspdf-autotable";

function AdminOrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    customer: "",
    sortBy: "newest",
  });

  const fetchOrders = async () => {
    setLoading(true);
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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const filteredAndSortedOrders = orders
    .filter((order) => {
      const statusMatch =
        filters.status === "all" || order.orderStatus === filters.status;
      const customerName = order.user?.username || "N/A";
      const customerMatch =
        !filters.customer ||
        customerName.toLowerCase().includes(filters.customer.toLowerCase());
      return statusMatch && customerMatch;
    })
    .sort((a, b) => {
      if (filters.sortBy === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      return new Date(b.createdAt) - new Date(a.createdAt); // Default to newest
    });

  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.text("Order Summary", 14, 20);

    const tableColumn = [
      "Order ID",
      "Date",
      "Customer",
      "Total Amount (SEK)",
      "Status",
    ];
    const tableRows = [];

    filteredAndSortedOrders.forEach((order) => {
      const orderData = [
        order._id.slice(-6),
        new Date(order.createdAt).toLocaleDateString(),
        order.user?.username || "N/A",
        order.totalAmount.toFixed(2),
        order.orderStatus,
      ];
      tableRows.push(orderData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 28,
    });

    doc.save(`order_summary_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  if (error)
    return <div className="text-center text-red-500 py-8">Error: {error}</div>;

  return (
    <div className="p-4 bg-white rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-8 border-b-2 border-red-200 pb-4">
        <h2 className="text-3xl font-extrabold text-gray-900">
          Order Management
        </h2>
        <button
          onClick={handleExportPDF}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200 flex items-center space-x-2"
        >
          <i className="fa-solid fa-file-pdf"></i>
          <span>Export to PDF</span>
        </button>
      </div>

      {/* Assuming you want to keep the collapsible filters */}
      <CollapsibleSection title="Filters and Sorting">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            name="customer"
            placeholder="Filter by customer name..."
            value={filters.customer}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-red-500"
          />
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-red-300 rounded-md bg-white focus:outline-none focus:ring-red-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            name="sortBy"
            value={filters.sortBy}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-red-300 rounded-md bg-white focus:outline-none focus:ring-red-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </CollapsibleSection>

      {loading ? (
        <div className="text-center py-8">Loading orders...</div>
      ) : (
        <div className="space-y-6 mt-6">
          {filteredAndSortedOrders.length > 0 ? (
            filteredAndSortedOrders.map((order) => (
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
      )}
    </div>
  );
}

export default AdminOrderManagement;
