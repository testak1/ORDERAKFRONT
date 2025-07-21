"use client";

import React, { useRef, useState, useEffect } from "react";
import { useReactToPrint } from "react-to-print";

export default function PdfExportModal({ order, onClose }) {
  const pdfRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handlePrint = useReactToPrint({
    content: () => {
      // Create a temporary container
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-10000px";
      container.style.top = "0";

      // Clone the printable content
      const content = pdfRef.current.cloneNode(true);
      container.appendChild(content);
      document.body.appendChild(container);

      return container;
    },
    documentTitle: `order-${order._id}`,
    onAfterPrint: () => {
      // Clean up temporary elements
      const tempElements = document.querySelectorAll("[data-print-temp]");
      tempElements.forEach((el) => el.remove());
      onClose();
    },
    pageStyle: `
      @page { size: A4; margin: 10mm; }
      body { font-family: Arial; font-size: 12pt; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ddd; padding: 8px; }
    `,
    removeAfterPrint: true,
  });

  if (!order || !isMounted) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Export Order #{order._id.slice(0, 8)}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Printable content (must be in DOM) */}
        <div ref={pdfRef} style={{ display: "none" }} data-print-content>
          <div className="p-4">
            <h1>Order #{order._id.slice(0, 8)}</h1>
            {/* Your order content here */}
          </div>
        </div>

        {/* Preview content */}
        <div className="border rounded p-4 mb-6">
          {/* Preview version of the content */}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            disabled={!isMounted}
          >
            Export to PDF
          </button>
          <button
            onClick={onClose}
            className="border border-gray-300 hover:bg-gray-100 px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
