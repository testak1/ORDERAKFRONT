import React from "react";

function OrderCard({
  order,
  onUpdateOrderStatus,
  isAdminView = true,
  onExportPdf,
}) {
  const handleUpdate = async (e) => {
    if (isAdminView) {
      await onUpdateOrderStatus(order._id, e.target.value);
    }
  };

  const statusColorClass = {
    pending: "text-yellow-600",
    processing: "text-blue-600",
    shipped: "text-purple-600",
    completed: "text-green-600",
    cancelled: "text-red-600",
  }[order.orderStatus] || "text-gray-600";

  return (
    <div className="p-4 md:p-6 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
      {/* Uppdaterad för mobil: flex-col på små skärmar, flex-row på större */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-4 border-b pb-3 gap-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Order ID: {order._id.slice(-8).toUpperCase()}
          </h3>
          <p className="text-sm text-gray-600">
            Ordered by: {order.user?.username || "N/A"}
          </p>
          <p className="text-sm text-gray-600">
            Created At: {new Date(order.createdAt).toLocaleString('sv-SE')}
          </p>
        </div>
        <div className="text-left md:text-right mt-2 md:mt-0 w-full md:w-auto">
          <p className={`text-lg font-bold ${statusColorClass} capitalize`}>
            Status: {order.orderStatus}
          </p>
          <p className="text-xl font-bold text-gray-800">
            Total: {Math.round(order.totalAmount || 0)} kr
          </p>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-md font-semibold text-gray-800 mb-2">Items:</h4>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          {order.items.map((item, index) => (
            <li key={index}>
              {item.product?.title || item.title} (SKU:{" "}
              {item.product?.sku || item.sku}) - Qty: {item.quantity} @ kr{" "}
              {Math.round(item.priceAtPurchase)} each
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-4">
        <h4 className="text-md font-semibold text-gray-800 mb-2">
          Shipping Address:
        </h4>
        <address className="not-italic text-sm text-gray-700">
          <p>{order.shippingAddress?.fullName}</p>
          <p>{order.shippingAddress?.addressLine1}</p>
          <p>
            {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}
          </p>
          <p>{order.shippingAddress?.country}</p>
        </address>
      </div>

      {/* Uppdaterad för mobil: flex-col på små skärmar, flex-row på större */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pt-4 border-t border-gray-200 gap-4">
        {isAdminView && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Update Status:
            </label>
            <select
              value={order.orderStatus}
              onChange={handleUpdate}
              className="mt-1 block w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}

        <button
          onClick={() => onExportPdf && onExportPdf(order)}
          className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md text-sm w-full md:w-auto ${
            !isAdminView ? "md:ml-auto" : ""
          }`}
        >
          Export to PDF
        </button>
      </div>
    </div>
  );
}

export default OrderCard;
