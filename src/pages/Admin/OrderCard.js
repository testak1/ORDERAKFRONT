// src/pages/Admin/OrderCard.js
import React from "react";
import { client } from "../../sanityClient";

// Add onExportPdf prop
function OrderCard({
  order,
  onUpdateOrderStatus,
  isAdminView = true,
  onExportPdf,
}) {
  const handleUpdate = async (e) => {
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
            Total: {order.totalAmount?.toFixed(2) || "N/A"} kr
          </p>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-md font-semibold text-gray-800 mb-2">Items:</h4>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          {order.items.map((item, index) => (
            <li key={index}>
              {item.product?.title || item.title} (SKU:{" "}
              {item.product?.sku || item.sku}) - Qty: {item.quantity} @ kr{" "}
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
          {order.shippingAddress?.addressLine2 && ( // Keep this for display even if schema is removed
            <p>{order.shippingAddress.addressLine2}</p>
          )}
          <p>
            {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}
          </p>
          <p>{order.shippingAddress?.country}</p>
        </address>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        {isAdminView && (
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

        {/* This button now triggers the modal */}
        <button
          onClick={() => onExportPdf && onExportPdf(order)}
          className={`bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-200 ${
            !isAdminView ? "ml-auto" : ""
          }`}
        >
          Export to PDF
        </button>
      </div>
    </div>
  );
}

export default OrderCard;
