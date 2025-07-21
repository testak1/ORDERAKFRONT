// src/components/PdfExportModal.js
import React, { useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function PdfExportModal({ order, onClose }) {
  const contentRef = useRef();
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePdf = async () => {
    if (!order) return;

    setIsGenerating(true);

    try {
      const input = contentRef.current;
      const canvas = await html2canvas(input, { scale: 2 }); // Scale up for better quality
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Order_${order._id}_${order.user?.username || 'user'}.pdf`);
      onClose();
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!order) {
    return null; // Don't render if no order is provided
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold"
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
          Export Order to PDF
        </h2>

        <div ref={contentRef} className="p-4 border border-gray-200 rounded-lg bg-white">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Order Details:
          </h3>
          <p className="text-sm text-gray-600">
            <strong>Order ID:</strong> {order._id}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Ordered by:</strong> {order.user?.username || "N/A"}
          </p>
          <p className="text-sm text-gray-600 mb-3">
            <strong>Created At:</strong>{" "}
            {new Date(order.createdAt).toLocaleString()}
          </p>

          <p className="text-md font-semibold text-gray-800 mb-2">Items:</p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mb-3">
            {order.items.map((item, index) => (
              <li key={index}>
                {item.product?.title || item.title} (SKU:{" "}
                {item.product?.sku || item.sku}) - Qty: {item.quantity} @ SEK{" "}
                {item.priceAtPurchase?.toFixed(2)} each
              </li>
            ))}
          </ul>

          <p className="text-md font-semibold text-gray-800 mb-2">
            Shipping Address:
          </p>
          <address className="not-italic text-sm text-gray-700 mb-3">
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
          <p className="text-xl font-bold text-gray-800 mt-2">
            Total: SEK {order.totalAmount?.toFixed(2) || "N/A"}
          </p>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200"
            disabled={isGenerating}
          >
            Cancel
          </button>
          <button
            onClick={generatePdf}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isGenerating}
          >
            {isGenerating ? "Generating..." : "Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PdfExportModal;
