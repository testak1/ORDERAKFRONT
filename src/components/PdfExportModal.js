"use client";

import React, { useRef, useState, useEffect } from "react";
import { useReactToPrint } from "react-to-print";

export default function PdfExportModal({ order, onClose }) {
  const pdfRef = useRef();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handlePrint = useReactToPrint({
    content: () => pdfRef.current,
    documentTitle: `order-${order._id}`,
    onAfterPrint: onClose,
    removeAfterPrint: true,
  });

  if (!order || !order.items || !Array.isArray(order.items)) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-5 rounded-lg w-4/5 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          Orderdetaljer (#{order._id})
        </h2>

        {/* Content to print - must be rendered even when hidden */}
        <div className="hidden">
          <div ref={pdfRef} className="p-4 bg-gray-50">
            <p>
              <strong>Kund:</strong> {order.user?.username}
            </p>
            <p>
              <strong>Datum:</strong>{" "}
              {new Date(order.createdAt).toLocaleString()}
            </p>
            <p>
              <strong>Totalt:</strong> {order.totalAmount} kr
            </p>
            <p>
              <strong>Status:</strong> {order.orderStatus}
            </p>

            <h3 className="font-bold mt-4">Produkter:</h3>
            <ul className="list-disc pl-5">
              {order.items.map((item, index) => (
                <li key={index}>
                  {item.product?.title} – {item.quantity} st à{" "}
                  {item.priceAtPurchase} kr
                </li>
              ))}
            </ul>

            <h3 className="font-bold mt-4">Adress:</h3>
            <p>{order.shippingAddress?.fullName}</p>
            <p>{order.shippingAddress?.addressLine1}</p>
            <p>
              {order.shippingAddress?.postalCode} {order.shippingAddress?.city}
            </p>
            <p>{order.shippingAddress?.country}</p>
          </div>
        </div>

        {/* Visible preview content */}
        <div className="p-4 bg-gray-50 mb-4">
          {/* Same content as above but for preview */}
          <p>
            <strong>Kund:</strong> {order.user?.username}
          </p>
          {/* ... rest of the preview content ... */}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={!isMounted}
          >
            Exportera som PDF
          </button>
          <button
            onClick={onClose}
            className="border border-gray-400 px-4 py-2 rounded hover:bg-gray-100"
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
}
