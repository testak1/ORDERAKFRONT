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
            <p>
              <strong>Date:</strong>{" "}
              {new Date(order.createdAt).toLocaleDateString("sv-SE")}
            </p>
            <p>
              <strong>Status:</strong> {order.orderStatus}
            </p>

            <h2>Customer</h2>
            <p>{order.user?.username || "Guest"}</p>

            <h2>Order Items</h2>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.product?.title || item.title}</td>
                    <td>{item.product?.sku || item.sku}</td>
                    <td>{item.quantity}</td>
                    <td>{item.priceAtPurchase?.toFixed(2)} SEK</td>
                    <td>
                      {(item.quantity * item.priceAtPurchase).toFixed(2)} SEK
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td colSpan="2">Total</td>
                  <td>{totalQuantity}</td>
                  <td></td>
                  <td>{order.totalAmount?.toFixed(2)} SEK</td>
                </tr>
              </tfoot>
            </table>

            <h2>Shipping Address</h2>
            <address>
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

        {/* Preview */}
        <div className="border rounded p-4 mb-6 bg-gray-50">
          <h3 className="text-lg font-semibold mb-2">Order Preview</h3>
          <div className="space-y-2">
            <p>
              <strong>Order ID:</strong> {order._id}
            </p>
            <p>
              <strong>Customer:</strong> {order.user?.username || "Guest"}
            </p>
            <p>
              <strong>Date:</strong>{" "}
              {new Date(order.createdAt).toLocaleString()}
            </p>
            <p>
              <strong>Total:</strong> {order.totalAmount?.toFixed(2)} SEK
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span className="capitalize">{order.orderStatus}</span>
            </p>
          </div>

          <h3 className="text-lg font-semibold mt-4 mb-2">Products</h3>
          <ul className="space-y-2">
            {order.items.map((item, index) => (
              <li key={index} className="flex justify-between">
                <span>
                  {item.product?.title || item.title} (SKU:{" "}
                  {item.product?.sku || item.sku})
                </span>
                <span>
                  {item.quantity} × {item.priceAtPurchase?.toFixed(2)} SEK
                </span>
              </li>
            ))}
          </ul>

          <h3 className="text-lg font-semibold mt-4 mb-2">Shipping Address</h3>
          <address className="not-italic">
            <p>{order.shippingAddress?.fullName}</p>
            <p>{order.shippingAddress?.addressLine1}</p>
            {order.shippingAddress?.addressLine2 && (
              <p>{order.shippingAddress.addressLine2}</p>
            )}
            <p>
              {order.shippingAddress?.postalCode} {order.shippingAddress?.city}
            </p>
            <p>{order.shippingAddress?.country}</p>
          </address>
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
