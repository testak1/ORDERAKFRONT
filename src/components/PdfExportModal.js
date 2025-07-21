"use client";

import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";

export default function PdfExportModal({ order, onClose }) {
  const pdfRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => pdfRef.current,
    documentTitle: `order-${order._id}`,
    onAfterPrint: onClose,
  });

  if (!order || !order.items || !Array.isArray(order.items)) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: 8,
          width: "80%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h2>Orderdetaljer (#{order._id})</h2>

        <div ref={pdfRef} style={{ padding: 10, backgroundColor: "#f9f9f9" }}>
          {/* Your existing content */}
        </div>

        <div style={{ marginTop: 20 }}>
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Exportera som PDF
          </button>
          <button
            onClick={onClose}
            className="ml-4 border border-gray-400 px-4 py-2 rounded"
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
}
