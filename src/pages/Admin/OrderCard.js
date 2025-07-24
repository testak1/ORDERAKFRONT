import React, { useState } from "react";
import { useTranslation } from "react-i18next";

function OrderCard({
  order,
  onUpdateOrderStatus,
  isAdminView = true,
  onExportPdf,
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleUpdate = async (e) => {
    if (isAdminView) {
      await onUpdateOrderStatus(order._id, e.target.value);
    }
  };

  const statusColorClass = {
    pending: "text-yellow-800 bg-yellow-100",
    processing: "text-blue-800 bg-blue-100",
    shipped: "text-purple-800 bg-purple-100",
    completed: "text-green-800 bg-green-100",
    cancelled: "text-red-800 bg-red-100",
  }[order.orderStatus] || "text-gray-800 bg-gray-100";
  
  const orderStatusText = t(`orderStatus.${order.orderStatus}`, order.orderStatus);

    // NY: Beräkna total exkl. moms
  const totalAmountExclVat = Math.round((order.totalAmount || 0) / 1.25);

   return (
    <div className="border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left p-4 md:p-6 bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-col md:flex-row justify-between items-start flex-grow">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t("orderCard.orderId", { id: order._id.slice(-8).toUpperCase() })}
              </h3>
              <p className="text-sm text-gray-600">
                {t("orderCard.createdAt", { date: new Date(order.createdAt).toLocaleString('sv-SE') })}
              </p>
            </div>
            <div className="text-left md:text-right mt-2 md:mt-0">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColorClass}`}>
                {orderStatusText}
              </span>
              {/* NY: Visa total exkl. moms */}
              <p className="text-md text-gray-600 mt-2">
                Totalt (exkl. moms): {totalAmountExclVat} kr
              </p>
              <p className="text-xl font-bold text-gray-800">
                {t("orderCard.total", { total: Math.round(order.totalAmount || 0) })}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 ml-4 pt-1">
            <span className="text-2xl font-semibold text-gray-500">
              {isOpen ? "−" : "+"}
            </span>
          </div>
        </div>
      </button>

      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? "max-h-[2000px]" : "max-h-0"}`}>
        <div className="p-4 md:p-6 border-t border-gray-200">
          <div className="mb-4">
            <h4 className="text-md font-semibold text-gray-800 mb-2">{t("orderCard.items")}</h4>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {order.items.map((item, index) => (
                <li key={index}>
                  {/* NY: Uppdatera itemLine-översättningen för att inkludera exkl. moms */}
                  {item.product?.title} (Art.nr: {item.product?.sku}) - Antal: {item.quantity} @ {Math.round(item.priceAtPurchase)} kr st
                  <span className="text-gray-500"> (exkl. moms: {Math.round(item.priceAtPurchase / 1.25)} kr)</span>
                </li>
              ))}
            </ul>
          </div>

            <div className="mb-4">
                <h4 className="text-md font-semibold text-gray-800 mb-2">
                {t("orderCard.shippingAddress")}
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

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between pt-4 border-t border-gray-200 gap-4">
                {isAdminView && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("orderCard.updateStatus")}
                    </label>
                    <select
                    value={order.orderStatus}
                    onChange={handleUpdate}
                    className="mt-1 block w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
                    >
                    <option value="pending">{t("orderStatus.pending")}</option>
                    <option value="processing">{t("orderStatus.processing")}</option>
                    <option value="shipped">{t("orderStatus.shipped")}</option>
                    <option value="completed">{t("orderStatus.completed")}</option>
                    <option value="cancelled">{t("orderStatus.cancelled")}</option>
                    </select>
                </div>
                )}

                <button
                onClick={() => onExportPdf && onExportPdf(order)}
                className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md text-sm w-full md:w-auto ${
                    !isAdminView ? "md:ml-auto" : ""
                }`}
                >
                {t("orderCard.exportPdf")}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}

export default OrderCard;
