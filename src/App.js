// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Login from "./components/Login";
import ProductList from "./pages/ProductList";
import CartPage from "./pages/CartPage";
import AdminDashboard from "./pages/Admin/AdminDashboard"; // Create this component
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <NavBar /> {/* Navigation bar */}
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProductList />} />
            <Route path="/cart" element={<CartPage />} />
            <Route
              path="/admin/*" // Nested routes for admin
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            {/* Add more routes for order history, user profile etc. */}
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

function NavBar() {
  const { user, logout } = useAuth();
  return (
    <nav
      style={{
        padding: "10px",
        background: "#f0f0f0",
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <div>
        <Link to="/" style={{ marginRight: "10px" }}>
          Products
        </Link>
        <Link to="/cart" style={{ marginRight: "10px" }}>
          Cart
        </Link>
        {user && user.role === "admin" && (
          <Link to="/admin" style={{ marginRight: "10px" }}>
            Admin
          </Link>
        )}
      </div>
      <div>
        {user ? (
          <>
            <span>
              Welcome, {user.username} ({user.role})
            </span>
            <button onClick={logout} style={{ marginLeft: "10px" }}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}

export default App;
