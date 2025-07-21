"use client";

import React, { useRef, useState, useEffect } from "react";
import { useReactToPrint } from "react-to-print";

export default function PdfExportModal({ order, onClose }) {
  const pdfRef = useRef();
  const [isReady, setIsReady] = useState(false);

  // Ensure the component is mounted and ref is set
  useEffect(() => {
    setIsReady(true);
    return () => setIsReady(false);
  }, []);

  const handlePrint = useReactToPrint({
    content: () => pdfRef.current,
    documentTitle: `order-${order._id}`,
    onAfterPrint: onClose,
    removeAfterPrint: true,
    pageStyle: `
      @page { size: auto; margin: 10mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
      }
    `,
  });

  if (!order || !order.items || !Array.isArray(order.items)) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-5 rounded-lg w-4/5 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          Orderdetaljer (#{order._id})
        </h2>

        {/* This is the actual content that will be printed */}
        <div style={{ display: "none" }}>
          <div ref={pdfRef} className="p-4">
            <h1 className="text-xl font-bold mb-2">Order #{order._id}</h1>
            <div className="mb-4">
              <p>
                <strong>Customer:</strong> {order.user?.username}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(order.createdAt).toLocaleString()}
              </p>
              <p>
                <strong>Total:</strong> {order.totalAmount} kr
              </p>
              <p>
                <strong>Status:</strong> {order.orderStatus}
              </p>
            </div>

            <h2 className="text-lg font-semibold mb-2">Products:</h2>
            <ul className="list-disc pl-5 mb-4">
              {order.items.map((item, index) => (
                <li key={index}>
                  {item.product?.title} - {item.quantity} x{" "}
                  {item.priceAtPurchase} kr
                </li>
              ))}
            </ul>

            <h2 className="text-lg font-semibold mb-2">Shipping Address:</h2>
            <address className="not-italic">
              <p>{order.shippingAddress?.fullName}</p>
              <p>{order.shippingAddress?.addressLine1}</p>
              <p>
                {order.shippingAddress?.postalCode}{" "}
                {order.shippingAddress?.city}
              </p>
              <p>{order.shippingAddress?.country}</p>
            </address>
          </div>
        </div>

        {/* This is the preview content visible in the modal */}
        <div className="p-4 border border-gray-200 rounded mb-4">
          <h3 className="text-lg font-semibold mb-2">Order Preview</h3>
          <p>
            <strong>Customer:</strong> {order.user?.username}
          </p>
          <p>
            <strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}
          </p>
          <p>
            <strong>Total:</strong> {order.totalAmount} kr
          </p>
          <p>
            <strong>Status:</strong> {order.orderStatus}
          </p>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={!isReady}
          >
            Export to PDF
          </button>
          <button
            onClick={onClose}
            className="border border-gray-400 px-4 py-2 rounded hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
