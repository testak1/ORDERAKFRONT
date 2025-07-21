// src/pages/Admin/AdminDashboard.js (Styled Example)
import React, { useState } from "react";
import AdminProductManagement from "./AdminProductManagement";
import AdminUserManagement from "./AdminUserManagement";
import AdminOrderManagement from "./AdminOrderManagement";
import { useTranslation } from "react-i18next";

function AdminDashboard() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("products");

  const tabClasses = (tabName) =>
    `px-3 py-2 text-base font-medium rounded-t-lg transition-colors duration-200 ` +
    (activeTab === tabName
      ? "bg-red-600 text-white shadow-md"
      : "bg-gray-200 text-gray-700 hover:bg-gray-300");

  return (
    <div className="p-2 md:p-4 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 border-b-2 border-red-200 pb-4">
        {t("admin.dashboard")}
      </h1>

      {/* Nav-länkarna kommer nu att radbrytas snyggt på små skärmar */}
      <nav className="flex flex-wrap gap-2 border-b-2 border-red-200 mb-6">
        <button
          onClick={() => setActiveTab("products")}
          className={tabClasses("products")}
        >
          {t("admin.productManagement")}
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={tabClasses("users")}
        >
          {t("admin.userManagement")}
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={tabClasses("orders")}
        >
          {t("admin.orderManagement")}
        </button>
      </nav>

      <div className="bg-red-50/20 p-2 md:p-6 rounded-lg border border-red-200 min-h-[500px]">
        {activeTab === "products" && <AdminProductManagement />}
        {activeTab === "users" && <AdminUserManagement />}
        {activeTab === "orders" && <AdminOrderManagement />}
      </div>
    </div>
  );
}

export default AdminDashboard;