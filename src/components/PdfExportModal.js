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
      // Create a clone of the printable content
      const printableContent = document
        .getElementById("printable-content")
        .cloneNode(true);
      printableContent.style.display = "block";
      document.body.appendChild(printableContent);
      return printableContent;
    },
    documentTitle: `order-${order._id}`,
    onAfterPrint: () => {
      // Clean up the cloned content
      const clonedContent = document.getElementById("printable-content-clone");
      if (clonedContent) {
        document.body.removeChild(clonedContent);
      }
      onClose();
    },
    pageStyle: `
      @page { size: auto; margin: 10mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        * { 
          -webkit-print-color-adjust: exact !important; 
          color-adjust: exact !important;
        }
      }
    `,
  });

  if (!order || !order.items || !Array.isArray(order.items)) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-5 rounded-lg w-4/5 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          Order Details (#{order._id})
        </h2>

        {/* Printable content - hidden but in DOM */}
        <div id="printable-content" ref={pdfRef} style={{ display: "none" }}>
          <div className="p-4">
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
                <strong>Total:</strong> {order.totalAmount.toFixed(2)} kr
              </p>
              <p>
                <strong>Status:</strong> {order.orderStatus}
              </p>
            </div>

            <h2 className="text-lg font-semibold mb-2">Products:</h2>
            <table className="w-full mb-4 border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border text-left">Product</th>
                  <th className="p-2 border text-left">SKU</th>
                  <th className="p-2 border text-right">Quantity</th>
                  <th className="p-2 border text-right">Price</th>
                  <th className="p-2 border text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={index}>
                    <td className="p-2 border">{item.product?.title}</td>
                    <td className="p-2 border">{item.product?.sku}</td>
                    <td className="p-2 border text-right">{item.quantity}</td>
                    <td className="p-2 border text-right">
                      {item.priceAtPurchase.toFixed(2)} kr
                    </td>
                    <td className="p-2 border text-right">
                      {(item.quantity * item.priceAtPurchase).toFixed(2)} kr
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2 className="text-lg font-semibold mb-2">Shipping Address:</h2>
            <address className="not-italic">
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
        </div>

        {/* Preview content */}
        <div className="p-4 border border-gray-200 rounded mb-4">
          <h3 className="text-lg font-semibold mb-2">Order Preview</h3>
          <div className="space-y-2">
            <p>
              <strong>Customer:</strong> {order.user?.username}
            </p>
            <p>
              <strong>Date:</strong>{" "}
              {new Date(order.createdAt).toLocaleString()}
            </p>
            <p>
              <strong>Total:</strong> {order.totalAmount.toFixed(2)} kr
            </p>
            <p>
              <strong>Status:</strong> {order.orderStatus}
            </p>
          </div>

          <h3 className="text-lg font-semibold mt-4 mb-2">Products:</h3>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>
                  {item.product?.title} (SKU: {item.product?.sku})
                </span>
                <span>
                  {item.quantity} × {item.priceAtPurchase.toFixed(2)} kr
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={!isMounted}
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
