import React, { useState, useEffect } from "react";
import { client } from "../../sanityClient";
import OrderCard from "./OrderCard";
import CollapsibleSection from "../../components/CollapsibleSection"; // Import component

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
                _id,
                _createdAt,
                customerName,
                customerRef->{username}, // Fetch username from referenced user
                shippingAddress,
                orderNumber,
                items[]{
                    _key,
                    quantity,
                    product->{_id, title, price, "imageUrl": mainImage.asset->url}
                },
                totalAmount,
                discountApplied,
                finalAmount,
                status
            } | order(_createdAt desc)`; // Default sort by newest
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
        filters.status === "all" || order.status === filters.status;
      const customerName = order.customerRef?.username || order.customerName;
      const customerMatch =
        !filters.customer ||
        customerName.toLowerCase().includes(filters.customer.toLowerCase());
      return statusMatch && customerMatch;
    })
    .sort((a, b) => {
      if (filters.sortBy === "newest") {
        return new Date(b._createdAt) - new Date(a._createdAt);
      }
      if (filters.sortBy === "oldest") {
        return new Date(a._createdAt) - new Date(b._createdAt);
      }
      return 0;
    });

  if (error)
    return <div className="text-center text-red-500 py-8">Error: {error}</div>;

  return (
    <div className="p-4 bg-white rounded-lg shadow-xl">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center border-b-2 border-red-200 pb-4">
        Order Management
      </h2>

      <CollapsibleSection title="Filters">
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
            <option value="delivered">Delivered</option>
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
        <div className="space-y-6">
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
