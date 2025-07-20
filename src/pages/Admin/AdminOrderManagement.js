import React, { useState, useEffect } from "react";
import { client } from "../../sanityClient"; // Import Sanity client
import { useAuth } from "../../context/AuthContext"; // If you need user context here
import Pdf from "react-to-pdf"; // Assuming you'll use this for PDF export later
import { useRef } from "react"; // For PDF export ref

function AdminOrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Example ref for PDF export, you'd likely have one per order in a list
  const pdfRef = useRef();

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

  if (loading) return <div>Loading orders...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Order Management</h2>
      {orders.length === 0 && <p>No orders found.</p>}
      {orders.map((order) => (
        <div
          key={order._id}
          style={{
            border: "1px solid #ccc",
            padding: "15px",
            marginBottom: "15px",
          }}
        >
          <h3>Order ID: {order._id}</h3>
          <p>Ordered by: {order.user?.username || "N/A"}</p>
          <p>Status: {order.orderStatus}</p>
          <p>Total: ${order.totalAmount?.toFixed(2) || "N/A"}</p>
          <p>Created At: {new Date(order.createdAt).toLocaleString()}</p>

          <h4>Items:</h4>
          <ul>
            {order.items.map((item, index) => (
              <li key={index}>
                {item.product?.title || item.title} (SKU:{" "}
                {item.product?.sku || item.sku}) - Qty: {item.quantity} @ $
                {item.priceAtPurchase?.toFixed(2)} each
              </li>
            ))}
          </ul>

          <h4>Shipping Address:</h4>
          <p>{order.shippingAddress?.fullName}</p>
          <p>{order.shippingAddress?.addressLine1}</p>
          {order.shippingAddress?.addressLine2 && (
            <p>{order.shippingAddress.addressLine2}</p>
          )}
          <p>
            {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}
          </p>
          <p>{order.shippingAddress?.country}</p>

          <div>
            <label>Update Status: </label>
            <select
              value={order.orderStatus}
              onChange={(e) =>
                handleUpdateOrderStatus(order._id, e.target.value)
              }
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Example PDF Export - you'd likely want a dedicated component or better styling */}
          <div ref={pdfRef} style={{ padding: "10px", display: "none" }}>
            {" "}
            {/* Hidden for now */}
            <h4>Order Details for PDF: {order._id}</h4>
            <p>Status: {order.orderStatus}</p>
            {/* ... full details you want in PDF */}
          </div>
          <Pdf targetRef={pdfRef} filename={`order-${order._id}.pdf`}>
            {({ toPdf }) => <button onClick={toPdf}>Export to PDF</button>}
          </Pdf>
        </div>
      ))}
    </div>
  );
}

export default AdminOrderManagement;
