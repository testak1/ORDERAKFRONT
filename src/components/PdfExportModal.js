// src/components/PdfExportModal.js (Conceptual using jspdf/html2canvas)
import React, { useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

function PdfExportModal({ order, onClose }) {
  const pdfContentRef = useRef();

  if (!order) return null;

  const handleDownloadPdf = async () => {
    const input = pdfContentRef.current;
    if (!input) {
      console.error("PDF target element not found.");
      return;
    }

    try {
      // Add a small delay to ensure DOM is fully ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(input, {
        scale: 2, // Increase scale for better quality
        useCORS: true, // If images are cross-origin
        logging: true, // Enable logging to debug
      });
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

      pdf.save(`order-${order._id}.pdf`);
      onClose(); // Close modal after saving
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl relative">
        {/* ... (Modal Header) ... */}

        <div ref={pdfContentRef} className="p-6 bg-white">
          {/* ... (Your existing PDF content here) ... */}
        </div>

        {/* ... (Modal Footer) ... */}
        <button onClick={handleDownloadPdf} /* ... (Tailwind classes) */>
          Download PDF
        </button>
        {/* ... (Close button) ... */}
      </div>
    </div>
  );
}
export default PdfExportModal;
