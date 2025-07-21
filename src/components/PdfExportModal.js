import React, { useRef } from "react";
import html2pdf from "html2pdf.js";

const PdfExportModal = ({ order, onClose }) => {
  const pdfRef = useRef();

  const handlePrint = () => {
    const element = pdfRef.current;
    const opt = {
      margin: 0.5,
      filename: `order-${order._id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        scrollY: 0
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      }
    };

    // Show loading overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    
    const spinner = document.createElement('div');
    spinner.style.border = '4px solid rgba(255,255,255,0.3)';
    spinner.style.borderRadius = '50%';
    spinner.style.borderTop = '4px solid #fff';
    spinner.style.width = '36px';
    spinner.style.height = '36px';
    spinner.style.animation = 'spin 1s linear infinite';
    
    overlay.appendChild(spinner);
    document.body.appendChild(overlay);

    html2pdf().from(element).set(opt).save()
      .then(() => {
        document.body.removeChild(overlay);
        onClose();
      })
      .catch(err => {
        document.body.removeChild(overlay);
        console.error('PDF generation failed:', err);
      });
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Order #{order._id.slice(0, 8)}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {/* Printable content */}
        <div ref={pdfRef} className="p-4" style={{ fontFamily: 'Arial, sans-serif' }}>
          <h1 style={{ fontSize: '18pt', fontWeight: 'bold', marginBottom: '10px' }}>
            Order #{order._id}
          </h1>
          <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
          <p><strong>Status:</strong> {order.orderStatus}</p>
          
          <h2 style={{ fontSize: '14pt', fontWeight: 'bold', margin: '15px 0 5px 0' }}>Customer</h2>
          <p>{order.user?.username || 'Guest'}</p>
          
          <h2 style={{ fontSize: '14pt', fontWeight: 'bold', margin: '15px 0 5px 0' }}>Order Items</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', margin: '10px 0' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' }}>Product</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' }}>SKU</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' }}>Qty</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' }}>Price</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.product?.title}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.product?.sku}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.quantity}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.priceAtPurchase.toFixed(2)} SEK</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{(item.quantity * item.priceAtPurchase).toFixed(2)} SEK</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 'bold' }}>
                <td colSpan="4" style={{ border: '1px solid #ddd', padding: '8px' }}>Total</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{order.totalAmount.toFixed(2)} SEK</td>
              </tr>
            </tfoot>
          </table>
          
          <h2 style={{ fontSize: '14pt', fontWeight: 'bold', margin: '15px 0 5px 0' }}>Shipping Address</h2>
          <address style={{ fontStyle: 'normal' }}>
            <p>{order.shippingAddress?.fullName}</p>
            <p>{order.shippingAddress?.addressLine1}</p>
            <p>{order.shippingAddress?.postalCode} {order.shippingAddress?.city}</p>
            <p>{order.shippingAddress?.country}</p>
          </address>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
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
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfExportModal;
