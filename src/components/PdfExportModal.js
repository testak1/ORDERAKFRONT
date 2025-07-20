// src/components/PdfExportModal.js
import React, { useRef } from "react";
import Pdf from "react-to-pdf";

function PdfExportModal({ order, onClose }) {
  const pdfContentRef = useRef();

  if (!order) return null; // Don't render if no order data

  const getOrderStatusClass = (status) => {
    switch (status) {
      case "pending":
        return "text-yellow-600";
      case "processing":
        return "text-blue-600";
      case "shipped":
        return "text-purple-600";
      case "completed":
        return "text-green-600";
      case "cancelled":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl transform transition-all scale-100 opacity-100 relative">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            Order Details for PDF
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content to be exported to PDF */}
        {/* Ensure this content is visually within the modal and not hidden by other means */}
        <div ref={pdfContentRef} className="p-6 bg-white">
          <h3 className="text-2xl font-bold mb-4">Order #{order._id}</h3>
          <div className="grid grid-cols-2 gap-4 text-gray-700 mb-6">
            <div>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`${getOrderStatusClass(
                    order.orderStatus
                  )} capitalize`}
                >
                  {order.orderStatus}
                </span>
              </p>
              <p>
                <strong>Ordered by:</strong> {order.user?.username || "N/A"}
              </p>
              <p>
                <strong>Created At:</strong>{" "}
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">
                Total: SEK {order.totalAmount?.toFixed(2) || "N/A"}
              </p>
            </div>
          </div>

          <h4 className="text-lg font-semibold text-gray-800 mb-2">Items:</h4>
          <ul className="list-disc list-inside text-sm text-gray-700 mb-6">
            {order.items.map((item, index) => (
              <li key={index}>
                {item.product?.title || item.title} (SKU:{" "}
                {item.product?.sku || item.sku}) - Qty: {item.quantity} @ SEK{" "}
                {item.priceAtPurchase?.toFixed(2)} each
              </li>
            ))}
          </ul>

          <h4 className="text-lg font-semibold text-gray-800 mb-2">
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

        {/* Modal Footer with PDF Export Button */}
        <div className="p-4 border-t border-gray-200 flex justify-end">
          {/* Removed x, y, scale properties from Pdf component */}
          <Pdf targetRef={pdfContentRef} filename={`order-${order._id}.pdf`}>
            {({ toPdf }) => (
              <button
                onClick={toPdf}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
              >
                Download PDF
              </button>
            )}
          </Pdf>
          <button
            onClick={onClose}
            className="ml-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-md transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default PdfExportModal;
