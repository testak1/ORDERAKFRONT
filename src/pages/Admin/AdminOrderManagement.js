import React, { useState, useEffect } from "react";
import { client } from "../../sanityClient"; // Import Sanity client
import { useAuth } from "../../context/AuthContext"; // If you need user context here
import Pdf from "react-to-pdf"; // Assuming you'll use this for PDF export later
import { useRef } from "react"; // For PDF export ref

function AdminOrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch orders from Sanity
    const fetchOrders = async () => {
      setLoading(true);
      try {
        // Fetch orders and also reference user and product details if needed
        const query = `*[_type == "order"]{
          _id,
          user->{username, _id}, // Get username of the ordering user
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
    fetchOrders();
  }, []);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await client.patch(orderId).set({ orderStatus: newStatus }).commit();
      // Update state to reflect the change
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
        {orders.map((order) => {
          // A unique ref for each order's PDF content
          const currentPdfRef = useRef();

          return (
            <div
              key={order._id}
              className="p-6 border border-gray-200 rounded-lg shadow-sm bg-gray-50"
            >
              <div className="flex justify-between items-start mb-4 border-b pb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order ID: {order._id}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Ordered by: {order.user?.username || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Created At: {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-lg font-bold ${
                      order.orderStatus === "pending"
                        ? "text-yellow-600"
                        : order.orderStatus === "processing"
                        ? "text-blue-600"
                        : order.orderStatus === "shipped"
                        ? "text-purple-600"
                        : order.orderStatus === "completed"
                        ? "text-green-600"
                        : order.orderStatus === "cancelled"
                        ? "text-red-600"
                        : "text-gray-600"
                    } capitalize`}
                  >
                    Status: {order.orderStatus}
                  </p>
                  <p className="text-xl font-bold text-gray-800">
                    Total: ${order.totalAmount?.toFixed(2) || "N/A"}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-md font-semibold text-gray-800 mb-2">
                  Items:
                </h4>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {order.items.map((item, index) => (
                    <li key={index}>
                      {item.product?.title || item.title} (SKU:{" "}
                      {item.product?.sku || item.sku}) - Qty: {item.quantity} @
                      ${item.priceAtPurchase?.toFixed(2)} each
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="text-md font-semibold text-gray-800 mb-2">
                  Shipping Address:
                </h4>
                <address className="not-italic text-sm text-gray-700">
                  <p>{order.shippingAddress?.fullName}</p>
                  <p>{order.shippingAddress?.addressLine1}</p>
                  {order.shippingAddress?.addressLine2 && (
                    <p>{order.shippingAddress.addressLine2}</p>
                  )}
                  <p>
                    {order.shippingAddress?.city},{" "}
                    {order.shippingAddress?.postalCode}
                  </p>
                  <p>{order.shippingAddress?.country}</p>
                </address>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Update Status:
                  </label>
                  <select
                    value={order.orderStatus}
                    onChange={(e) =>
                      handleUpdateOrderStatus(order._id, e.target.value)
                    }
                    className="mt-1 block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* PDF Export Section */}
                {/* The content to be exported to PDF, potentially hidden until needed */}
                <div
                  ref={currentPdfRef}
                  className="p-6 bg-white border border-gray-200 rounded-lg shadow-md hidden"
                >
                  <h3 className="text-xl font-bold mb-4">
                    Order Details - {order._id}
                  </h3>
                  <p>
                    <strong>Status:</strong> {order.orderStatus}
                  </p>
                  <p>
                    <strong>Ordered by:</strong> {order.user?.username || "N/A"}
                  </p>
                  <p>
                    <strong>Total:</strong> $
                    {order.totalAmount?.toFixed(2) || "N/A"}
                  </p>
                  <p>
                    <strong>Created At:</strong>{" "}
                    {new Date(order.createdAt).toLocaleString()}
                  </p>

                  <h4 className="text-lg font-semibold mt-4 mb-2">Items:</h4>
                  <ul className="list-disc list-inside text-sm">
                    {order.items.map((item, index) => (
                      <li key={index}>
                        {item.product?.title || item.title} (SKU:{" "}
                        {item.product?.sku || item.sku}) - Qty: {item.quantity}{" "}
                        @ ${item.priceAtPurchase?.toFixed(2)}
                      </li>
                    ))}
                  </ul>

                  <h4 className="text-lg font-semibold mt-4 mb-2">
                    Shipping Address:
                  </h4>
                  <address className="not-italic text-sm">
                    <p>{order.shippingAddress?.fullName}</p>
                    <p>{order.shippingAddress?.addressLine1}</p>
                    {order.shippingAddress?.addressLine2 && (
                      <p>{order.shippingAddress.addressLine2}</p>
                    )}
                    <p>
                      {order.shippingAddress?.city},{" "}
                      {order.shippingAddress?.postalCode}
                    </p>
                    <p>{order.shippingAddress?.country}</p>
                  </address>
                </div>
                <Pdf
                  targetRef={currentPdfRef}
                  filename={`order-${order._id}.pdf`}
                >
                  {({ toPdf }) => (
                    <button
                      onClick={toPdf}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-200"
                    >
                      Export to PDF
                    </button>
                  )}
                </Pdf>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AdminOrderManagement;
