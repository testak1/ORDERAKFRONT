"use client";

import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";

export default function PdfExportModal({ order, onClose }) {
  const pdfRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => pdfRef.current,
    documentTitle: `order-${order._id}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm;
      }
      body {
        font-family: Arial, sans-serif;
        font-size: 12pt;
        padding: 20px;
      }
      h1 {
        color: #333;
        font-size: 18pt;
        margin-bottom: 10px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      th {
        background-color: #f2f2f2;
      }
      .total-row {
        font-weight: bold;
      }
      address {
        font-style: normal;
      }
    `,
    onAfterPrint: onClose,
  });

  if (!order || !order.items) return null;

  // Calculate total quantity
  const totalQuantity = order.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Export Order #{order._id.slice(0, 8)}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Hidden printable content */}
        <div style={{ position: "absolute", left: "-10000px", top: 0 }}>
          <div ref={pdfRef} className="p-4">
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
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
          >
            Export to PDF
          </button>
          <button
            onClick={onClose}
            className="border border-gray-300 hover:bg-gray-100 px-4 py-2 rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
