// src/pages/Admin/AdminDashboard.js (Styled Example)
import React, { useState } from "react";
import AdminProductManagement from "./AdminProductManagement";
import AdminUserManagement from "./AdminUserManagement";
import AdminOrderManagement from "./AdminOrderManagement";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("products"); // 'products', 'users', 'orders'

  const tabClasses = (tabName) =>
    `px-4 py-2 text-lg font-medium rounded-t-lg transition-colors duration-200 ` +
    (activeTab === tabName
      ? "bg-blue-600 text-white shadow-md"
      : "bg-gray-200 text-gray-700 hover:bg-gray-300");

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">
        Admin Dashboard
      </h1>

      <nav className="flex space-x-2 border-b-2 border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("products")}
          className={tabClasses("products")}
        >
          Product Management
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={tabClasses("users")}
        >
          User Management
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={tabClasses("orders")}
        >
          Order Management
        </button>
      </nav>

      <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 min-h-[500px]">
        {activeTab === "products" && <AdminProductManagement />}
        {activeTab === "users" && <AdminUserManagement />}
        {activeTab === "orders" && <AdminOrderManagement />}
      </div>
    </div>
  );
}

export default AdminDashboard;
