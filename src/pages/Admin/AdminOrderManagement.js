// Snippet for exporting order to PDF (in AdminOrderManagement.js, within an order detail component)
import React, { useRef } from "react";
import Pdf from "react-to-pdf";

const ref = useRef(); // Ref for the component you want to convert to PDF

// ... inside your OrderDetail component
return (
  <div>
    <div ref={ref}>
      {/* Order details rendered here */}
      <h3>Order #{order._id}</h3>
      <p>Status: {order.orderStatus}</p>
      {/* ... more details like items, address */}
    </div>
    <Pdf targetRef={ref} filename={`order-${order._id}.pdf`}>
      {({ toPdf }) => <button onClick={toPdf}>Generate PDF</button>}
    </Pdf>
  </div>
);
