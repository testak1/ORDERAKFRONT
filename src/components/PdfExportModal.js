import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";

function PdfExportModal({ order, onClose }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [logoBase64, setLogoBase64] = useState(null);

  // This effect runs once to fetch the logo and convert it to a format
  // that can be safely embedded in the PDF, solving the cross-origin issue.
  useEffect(() => {
    const convertImageToBase64 = async () => {
      try {
        const response = await fetch(
          "https://cdn.sanity.io/images/2toaqqka/production/fe195e2982641e4d117dd66c4c92768480c7aaaa-600x564.png"
        );
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = () => setLogoBase64(reader.result);
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Failed to load logo for PDF:", error);
      }
    };
    convertImageToBase64();
  }, []);

  const generatePdf = () => {
    if (!order || !logoBase64) {
      alert("PDF components are not ready yet. Please wait a moment.");
      return;
    }
    setIsGenerating(true);

    const doc = new jsPDF();

    // --- HEADER ---
    // Add the logo image
    doc.addImage(logoBase64, "PNG", 14, 15, 50, 15); // x, y, width, height

    // Add Invoice title
    doc.setFontSize(22);
    doc.setFont(undefined, "bold");
    doc.text("Invoice", 200, 25, { align: "right" });

    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(`Order ID: #${order._id.slice(-6)}`, 200, 32, { align: "right" });

    // --- BILLING AND ORDER INFO ---
    doc.setLineWidth(0.5);
    doc.line(14, 40, 200, 40);

    doc.setFontSize(10);
    doc.text("BILLED TO", 14, 48);
    doc.setFont(undefined, "bold");
    doc.text(order.shippingAddress?.fullName || order.user?.username, 14, 54);
    doc.setFont(undefined, "normal");
    doc.text(order.shippingAddress?.addressLine1 || "", 14, 59);
    doc.text(
      `${order.shippingAddress?.postalCode || ""} ${
        order.shippingAddress?.city || ""
      }`,
      14,
      64
    );
    doc.text(order.shippingAddress?.country || "", 14, 69);

    doc.text(
      `Order Date: ${new Date(order.createdAt).toLocaleDateString()}`,
      200,
      48,
      { align: "right" }
    );
    doc.text(`Status: ${order.orderStatus}`, 200, 54, { align: "right" });

    // --- ITEMS TABLE ---
    const tableColumn = ["Product", "SKU", "Qty", "Price", "Total"];
    const tableRows = [];

    order.items.forEach((item) => {
      const itemData = [
        doc.splitTextToSize(item.product?.title || item.title, 80), // Wrap long titles
        item.product?.sku || item.sku,
        item.quantity,
        `${Math.round(item.priceAtPurchase)} kr`,
        `${Math.round(item.quantity * item.priceAtPurchase)} kr`,
      ];
      tableRows.push(itemData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 80,
      headStyles: { fillColor: [230, 230, 230], textColor: 20 },
      styles: { fontSize: 9 },
    });

    // --- TOTALS ---
    const finalY = doc.lastAutoTable.finalY || 120;
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Total Amount:", 140, finalY + 15, { align: "left" });
    doc.text(`${Math.round(order.totalAmount)} kr`, 200, finalY + 15, {
      align: "right",
    });

    // --- FOOTER ---
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("Thank you for your order!", 105, 280, { align: "center" });
    doc.text("AK-TUNING", 105, 285, { align: "center" });

    doc.save(`Order_${order._id.slice(-6)}.pdf`);

    setIsGenerating(false);
    onClose();
  };

  if (!order) return null;

  return (
    // The modal now only serves as a confirmation dialog
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Generate PDF</h2>
        <p className="text-gray-600 mb-6">
          A high-quality PDF invoice will be generated for order #
          {order._id.slice(-6)}.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            disabled={isGenerating}
          >
            Cancel
          </button>
          <button
            onClick={generatePdf}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={isGenerating || !logoBase64}
          >
            {isGenerating
              ? "Generating..."
              : logoBase64
              ? "Download"
              : "Loading assets..."}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PdfExportModal;
