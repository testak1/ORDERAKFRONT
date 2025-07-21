"use client";
import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";

export default function PdfExportModal({ order, onClose }) {
  const pdfRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => pdfRef.current,
    pageStyle: `
      @page { size: A4; margin: 10mm; }
      @media print { 
        body { -webkit-print-color-adjust: exact; } 
      }
    `,
    onAfterPrint: onClose,
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
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

        {/* Hidden printable content (must NOT be `display: none`) */}
        <div style={{ position: "absolute", left: "-9999px" }}>
          <div ref={pdfRef} className="p-4">
            <h1 className="text-2xl font-bold mb-2">
              Order #{order._id.slice(0, 8)}
            </h1>
            {/* Your order details here */}
          </div>
        </div>

        {/* Preview (optional) */}
        <div className="border rounded p-4 mb-4">
          {/* Show a preview of the PDF */}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
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
