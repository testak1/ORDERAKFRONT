// src/pages/Admin/AdminDashboard.js
import React, { useState } from "react";
import AdminProductManagement from "./AdminProductManagement";
import AdminUserManagement from "./AdminUserManagement";
import AdminOrderManagement from "./AdminOrderManagement";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("products"); // 'products', 'users', 'orders'

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <nav>
        <button onClick={() => setActiveTab("products")}>
          Product Management
        </button>
        <button onClick={() => setActiveTab("users")}>User Management</button>
        <button onClick={() => setActiveTab("orders")}>Order Management</button>
      </nav>

      <div style={{ marginTop: "20px" }}>
        {activeTab === "products" && <AdminProductManagement />}
        {activeTab === "users" && <AdminUserManagement />}
        {activeTab === "orders" && <AdminOrderManagement />}
      </div>
    </div>
  );
}

export default AdminDashboard;
