// src/pages/Admin/OrderCard.js
import React, { useRef } from "react";
import Pdf from "react-to-pdf";
import { client } from "../../sanityClient";

function OrderCard({ order, onUpdateOrderStatus, isAdminView = true }) {
  const currentPdfRef = useRef();

  const handleUpdate = async (e) => {
    // Only allow status update if isAdminView is true
    if (isAdminView) {
      await onUpdateOrderStatus(order._id, e.target.value);
    }
  };

  return (
    <div className="p-6 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
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
        <h4 className="text-md font-semibold text-gray-800 mb-2">Items:</h4>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          {order.items.map((item, index) => (
            <li key={index}>
              {item.product?.title || item.title} (SKU:{" "}
              {item.product?.sku || item.sku}) - Qty: {item.quantity} @ SEK{" "}
              {item.priceAtPurchase?.toFixed(2)} each
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
          <p>
            {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}
          </p>
          <p>{order.shippingAddress?.country}</p>
        </address>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        {isAdminView && ( // Conditionally render for admin view
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Update Status:
            </label>
            <select
              value={order.orderStatus}
              onChange={handleUpdate}
              className="mt-1 block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}

        {/* PDF Export Section: Rendered OFF-SCREEN */}
        <div
          ref={currentPdfRef}
          className="absolute -left-[9999px] -top-[9999px] p-6 bg-white border border-gray-200 rounded-lg shadow-md"
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
          <p className="text-xl font-bold text-gray-800">
            Total: SEK {order.totalAmount?.toFixed(2) || "N/A"}
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
                {item.product?.sku || item.sku}) - Qty: {item.quantity} @ SEK{" "}
                {item.priceAtPurchase?.toFixed(2)} each
              </li>
            ))}
          </ul>

          <h4 className="text-lg font-semibold mt-4 mb-2">Shipping Address:</h4>
          <address className="not-italic text-sm">
            <p>{order.shippingAddress?.fullName}</p>
            <p>{order.shippingAddress?.addressLine1}</p>
            <p>
              {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}
            </p>
            <p>{order.shippingAddress?.country}</p>
          </address>
        </div>
        <Pdf targetRef={currentPdfRef} filename={`order-${order._id}.pdf`}>
          {({ toPdf }) => (
            <button
              onClick={toPdf}
              className={`bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-200 ${
                !isAdminView ? "ml-auto" : ""
              }`}
            >
              Export to PDF
            </button>
          )}
        </Pdf>
      </div>
    </div>
  );
}

export default OrderCard;
