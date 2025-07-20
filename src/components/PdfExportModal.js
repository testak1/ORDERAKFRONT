import React, { useRef, useEffect, useState } from "react";
import ReactToPdf from "react-to-pdf";
import { Button } from "@mui/material"; // Eller byt till vanliga <button>

const PdfExportModal = ({ order, onClose }) => {
  const pdfRef = useRef();
  const [isMounted, setIsMounted] = useState(false);

  // Se till att elementet har hunnit mountas innan PDF genereras
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!order) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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

        <div
          ref={pdfRef}
          style={{ padding: "10px", backgroundColor: "#f9f9f9" }}
        >
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
          <pre>{JSON.stringify(order.shippingAddress, null, 2)}</pre>
        </div>

        <div style={{ marginTop: 20 }}>
          {isMounted && pdfRef.current && (
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
