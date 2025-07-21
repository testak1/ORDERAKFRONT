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
      const canvas = await html2canvas(input, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`Order_${order._id.slice(-6)}.pdf`);
      onClose();
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!order) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-start z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-3xl font-light"
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
          PDF Preview
        </h2>

        <div ref={contentRef} className="p-8 bg-white" id="pdf-content">
          <div className="flex justify-between items-center mb-8 pb-4 border-b">
            <img
              src="https://tuning.aktuning.se/ak-logo2.png"
              alt="Company Logo"
              className="w-48"
              crossOrigin="anonymous"
            />
            <div className="text-right">
              <h1 className="text-4xl font-bold text-gray-800">Invoice</h1>
              <p className="text-sm text-gray-500">
                Order ID: #{order._id.slice(-6)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Billed To
              </h3>
              <p className="text-md text-gray-800 font-medium">
                {order.shippingAddress?.fullName || order.user?.username}
              </p>
              <p className="text-md text-gray-600">
                {order.shippingAddress?.addressLine1}
              </p>
              <p className="text-md text-gray-600">
                {order.shippingAddress?.postalCode}{" "}
                {order.shippingAddress?.city}
              </p>
              <p className="text-md text-gray-600">
                {order.shippingAddress?.country}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                <strong>Order Date:</strong>{" "}
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Generated:</strong> {new Date().toLocaleDateString()}
              </p>
              <p className="text-sm font-medium mt-2">
                Status:
                <span className="font-bold capitalize">
                  {" "}
                  {order.orderStatus}
                </span>
              </p>
            </div>
          </div>

          <div className="mb-8">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-100 text-sm text-gray-700">
                  <th className="py-2 px-4 font-semibold">Product</th>
                  <th className="py-2 px-4 font-semibold">SKU</th>
                  <th className="py-2 px-4 font-semibold text-center">Qty</th>
                  <th className="py-2 px-4 font-semibold text-right">Price</th>
                  <th className="py-2 px-4 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 px-4 text-sm">
                      {item.product?.title || item.title}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {item.product?.sku || item.sku}
                    </td>
                    <td className="py-3 px-4 text-sm text-center">
                      {item.quantity}
                    </td>
                    {/* --- FIXED PRICE FORMATTING (NO DECIMALS) --- */}
                    <td className="py-3 px-4 text-sm text-right">
                      {Math.round(item.priceAtPurchase)} kr
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-medium">
                      {Math.round(item.quantity * item.priceAtPurchase)} kr
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end text-right">
            <div>
              <p className="text-lg font-semibold text-gray-800">
                Total Amount:
              </p>
              <p className="text-3xl font-extrabold text-gray-900">
                {/* --- FIXED PRICE FORMATTING (NO DECIMALS) --- */}
                {Math.round(order.totalAmount) || "N/A"} kr
              </p>
            </div>
          </div>

          <div className="mt-12 pt-4 border-t text-center text-xs text-gray-500">
            <p>TACK FÖR DIN ORDER!</p>
            <p>AK-TUNING</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            disabled={isGenerating}
          >
            Cancel
          </button>
          <button
            onClick={generatePdf}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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
