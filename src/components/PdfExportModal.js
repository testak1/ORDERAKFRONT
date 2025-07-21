"use client";

import React, { useRef, useEffect } from "react";
import { useReactToPrint } from "react-to-print";

export default function PdfExportModal({ order, onClose }) {
  const pdfRef = useRef(null);

  // Create a printable component that matches your Sanity schema
  const PrintableOrder = React.forwardRef(({ order }, ref) => {
    // Calculate total quantity
    const totalQuantity = order.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    return (
      <div ref={ref} className="p-4 font-sans">
        <div className="mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold">Order #{order._id.slice(0, 8)}</h1>
          <p className="text-gray-600 text-sm">
            {new Date(order.createdAt).toLocaleDateString("sv-SE", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Customer Information</h2>
          <p>
            <strong>User:</strong> {order.user?.username || "Guest"}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span className="capitalize">{order.orderStatus}</span>
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Order Items</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border text-left">Product</th>
                <th className="p-2 border text-left">SKU</th>
                <th className="p-2 border text-right">Qty</th>
                <th className="p-2 border text-right">Price</th>
                <th className="p-2 border text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index}>
                  <td className="p-2 border">
                    {item.title || item.product?.title}
                  </td>
                  <td className="p-2 border">
                    {item.sku || item.product?.sku}
                  </td>
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
            <tfoot>
              <tr>
                <td colSpan="2" className="p-2 border font-semibold">
                  Total
                </td>
                <td className="p-2 border text-right font-semibold">
                  {totalQuantity}
                </td>
                <td className="p-2 border"></td>
                <td className="p-2 border text-right font-semibold">
                  {order.totalAmount.toFixed(2)} kr
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Shipping Address</h2>
          <address className="not-italic">
            <p>{order.shippingAddress?.fullName}</p>
            <p>{order.shippingAddress?.addressLine1}</p>
            <p>
              {order.shippingAddress?.postalCode} {order.shippingAddress?.city}
            </p>
            <p>{order.shippingAddress?.country}</p>
          </address>
        </div>

        <div className="text-xs text-gray-500 mt-8">
          <p>Thank you for your order!</p>
          <p>Order ID: {order._id}</p>
        </div>
      </div>
    );
  });

  const handlePrint = useReactToPrint({
    content: () => pdfRef.current,
    documentTitle: `order-${order._id}`,
    pageStyle: `
      @page { 
        size: A4;
        margin: 10mm;
      }
      @media print {
        body { 
          -webkit-print-color-adjust: exact;
          font-size: 12pt;
        }
      }
    `,
    onAfterPrint: onClose,
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-5 rounded-lg w-11/12 md:w-4/5 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Order #{order._id.slice(0, 8)}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Hidden printable content */}
        <div style={{ display: "none" }}>
          <PrintableOrder ref={pdfRef} order={order} />
        </div>

        {/* Preview */}
        <div className="border rounded p-4 mb-4">
          <PrintableOrder order={order} />
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
