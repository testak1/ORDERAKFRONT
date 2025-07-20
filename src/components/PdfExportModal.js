import React, { useRef, useEffect, useState } from "react";
import ReactToPdf from "react-to-pdf";
import { Button } from "@mui/material"; // Du kan ersätta med vanlig <button> vid behov

const PdfExportModal = ({ order, onClose }) => {
  const pdfRef = useRef();
  const [isClient, setIsClient] = useState(false);

  // För att undvika SSR/render-fel
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Skydd om order-data är ofullständig
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
          position: "relative",
        }}
      >
        <h2>Orderdetaljer (#{order._id})</h2>

        {/* Ref: det här exporteras */}
        <div ref={pdfRef} style={{ padding: 10, backgroundColor: "#f9f9f9" }}>
          <p>
            <strong>Kund:</strong> {order.user?.username}
          </p>
          <p>
            <strong>Datum:</strong> {new Date(order.createdAt).toLocaleString()}
          </p>
          <p>
            <strong>Totalt:</strong> {order.totalAmount} kr
          </p>
          <p>
            <strong>Status:</strong> {order.orderStatus}
          </p>

          <h3>Produkter:</h3>
          <ul>
            {order.items.map((item, index) => (
              <li key={index}>
                {item.product?.title} – {item.quantity} st à{" "}
                {item.priceAtPurchase} kr
              </li>
            ))}
          </ul>

          <h3>Adress:</h3>
          <p>{order.shippingAddress?.fullName}</p>
          <p>{order.shippingAddress?.addressLine1}</p>
          <p>
            {order.shippingAddress?.postalCode} {order.shippingAddress?.city}
          </p>
          <p>{order.shippingAddress?.country}</p>
        </div>

        {/* PDF-export & stäng-knapp */}
        <div style={{ marginTop: 20 }}>
          {isClient && pdfRef.current && (
            <ReactToPdf targetRef={pdfRef} filename={`order-${order._id}.pdf`}>
              {({ toPdf }) => (
                <Button variant="contained" color="primary" onClick={toPdf}>
                  Exportera som PDF
                </Button>
              )}
            </ReactToPdf>
          )}
          <Button
            variant="outlined"
            color="secondary"
            onClick={onClose}
            style={{ marginLeft: 10 }}
          >
            Stäng
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PdfExportModal;
