import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";

function PdfExportModal({ order, onClose }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [logoBase64, setLogoBase64] = useState(null);

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
    const logoWidth = 50;
    const logoOriginalWidth = 600;
    const logoOriginalHeight = 564;
    const logoHeight = (logoOriginalHeight * logoWidth) / logoOriginalWidth;
    doc.addImage(logoBase64, "PNG", 14, 15, logoWidth, logoHeight);

    doc.setFontSize(22);
    doc.setFont(undefined, "bold");
    doc.text("Invoice", 200, 25, { align: "right" });

    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(`Order ID: #${order._id.slice(-6)}`, 200, 32, { align: "right" });

    // --- BILLING AND ORDER INFO (ADJUSTED Y-COORDINATES) ---
    doc.setLineWidth(0.5);
    // Moved the line down to give the logo space
    const lineY = 15 + logoHeight + 5;
    doc.line(14, lineY, 200, lineY);
    
    const textY = lineY + 8;
    doc.setFontSize(10);
    doc.text("BILLED TO", 14, textY);
    doc.setFont(undefined, "bold");
    doc.text(order.shippingAddress?.fullName || order.user?.username, 14, textY + 6);
    doc.setFont(undefined, "normal");
    doc.text(order.shippingAddress?.addressLine1 || "", 14, textY + 11);
    doc.text(
      `${order.shippingAddress?.postalCode || ""} ${
        order.shippingAddress?.city || ""
      }`,
      14,
      textY + 16
    );
    doc.text(order.shippingAddress?.country || "", 14, textY + 21);

    doc.text(
      `Order Date: ${new Date(order.createdAt).toLocaleString('sv-SE')}`,
      200,
      textY,
      { align: "right" }
    );
    doc.text(`Status: ${order.orderStatus}`, 200, textY + 6, { align: "right" });

    // --- ITEMS TABLE ---
    doc.autoTable({
      startY: textY + 30, // Start table further down
      // ... rest of the autoTable options are the same
    });

    // ... (rest of the function is the same)
    
    doc.save(`Order_${order._id.slice(-6)}.pdf`);
    setIsGenerating(false);
    onClose();
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      {/* Modal content remains the same */}
    </div>
  );
}

export default PdfExportModal;
