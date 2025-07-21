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
      const canvas = await html2canvas(input, {
        scale: 3,
        logging: true,
        useCORS: true,
      }); // Increased scale for even better quality
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add image to PDF
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Handle multiple pages if content is too long
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Order_${order._id}_${order.user?.username || "user"}.pdf`);
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

        {/* Content to be captured by html2canvas */}
        <div
          ref={contentRef}
          className="p-6 bg-white border border-gray-100 rounded-lg shadow-sm"
        >
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">
                Invoice / Order Summary
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Generated: {new Date().toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-semibold text-blue-700">
                Order ID: {order._id.substring(0, 8)}...
              </h2>
              <p className="text-sm text-gray-600">
                Date: {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* User and Status Section */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Customer Details:
              </h3>
              <p className="text-md text-gray-700">
                <strong>Name:</strong> {order.user?.username || "N/A"}
              </p>
              {/* You might want to fetch user email or other details here if available */}
              <p className="text-md text-gray-700">
                <strong>User ID:</strong> {order.user?._id || "N/A"}
              </p>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Order Status:
              </h3>
              <p
                className={`text-xl font-bold ${
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
                {order.orderStatus}
              </p>
            </div>
          </div>

          {/* Items Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
              Order Items:
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-md">
                <thead>
                  <tr className="bg-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    <th className="py-2 px-4 border-b">Product</th>
                    <th className="py-2 px-4 border-b">SKU</th>
                    <th className="py-2 px-4 border-b text-center">Qty</th>
                    <th className="py-2 px-4 border-b text-right">
                      Price @ Purchase
                    </th>
                    <th className="py-2 px-4 border-b text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-200 last:border-b-0"
                    >
                      <td className="py-2 px-4 text-sm text-gray-800">
                        {item.product?.title || item.title}
                      </td>
                      <td className="py-2 px-4 text-sm text-gray-600">
                        {item.product?.sku || item.sku}
                      </td>
                      <td className="py-2 px-4 text-sm text-gray-800 text-center">
                        {item.quantity}
                      </td>
                      <td className="py-2 px-4 text-sm text-gray-800 text-right">
                        {item.priceAtPurchase} kr
                      </td>
                      <td className="py-2 px-4 text-sm text-gray-800 text-right">
                        {item.quantity * item.priceAtPurchase} kr
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Shipping Address and Total Section */}
          <div className="grid grid-cols-2 gap-6 mt-6 pt-4 border-t border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Shipping Address:
              </h3>
              <address className="not-italic text-md text-gray-700 space-y-0.5">
                <p>{order.shippingAddress?.fullName}</p>
                <p>{order.shippingAddress?.addressLine1}</p>
                {order.shippingAddress?.addressLine2 && (
                  <p>{order.shippingAddress.addressLine2}</p>
                )}
                <p>
                  {order.shippingAddress?.postalCode}{" "}
                  {order.shippingAddress?.city}
                </p>
                <p>{order.shippingAddress?.country}</p>
              </address>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Order Total:
              </h3>
              <p className="text-4xl font-extrabold text-green-700">
                {order.totalAmount || "N/A"} kr
              </p>
            </div>
          </div>

          {/* Footer for PDF content */}
          <div className="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
            Thank you for your order!
          </div>
        </div>

        {/* Modal Action Buttons */}
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
