'use client';

import React, { useRef, useState, useEffect } from "react";
import ReactToPdf from "react-to-pdf";

export default function PdfExportModal({ order, onClose }) {
  const pdfRef = useRef();
  const [isClient, setIsClient] = useState(false);
  const [triggerPdf, setTriggerPdf] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const observer = new MutationObserver(() => {
      if (pdfRef.current) {
        setTriggerPdf(true);
        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

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
          <p><strong>Kund:</strong> {order.user?.username}</p>
          <p><strong>Datum:</strong> {new Date(order.createdAt).toLocaleString()}</p>
          <p><strong>Totalt:</strong> {order.totalAmount} kr</p>
          <p><strong>Status:</strong> {order.orderStatus}</p>

          <h3>Produkter:</h3>
          <ul>
            {order.items.map((item, index) => (
              <li key={index}>
                {item.product?.title} – {item.quantity} st à {item.priceAtPurchase} kr
              </li>
            ))}
          </ul>

          <h3>Adress:</h3>
          <p>{order.shippingAddress?.fullName}</p>
          <p>{order.shippingAddress?.addressLine1}</p>
          <p>{order.shippingAddress?.postalCode} {order.shippingAddress?.city}</p>
          <p>{order.shippingAddress?.country}</p>
        </div>

        <div style={{ marginTop: 20 }}>
          {isClient && pdfRef.current && (
            <ReactToPdf targetRef={pdfRef} filename={`order-${order._id}.pdf`}>
              {({ toPdf }) => {
                // Trigger automatic download when ready
                useEffect(() => {
                  if (triggerPdf) {
                    toPdf();
                  }
                }, [triggerPdf]);

                return null; // No button needed
              }}
            </ReactToPdf>
          )}
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
