// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Login from "./components/Login";
import ProductList from "./pages/ProductList";
import CartPage from "./pages/CartPage";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <NavBar />
          <div className="container mx-auto p-4 md:p-6 lg:p-8 min-h-screen bg-gray-50">
            {" "}
            {/* Main content wrapper */}
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProductList />} />
              <Route path="/cart" element={<CartPage />} />
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              {/* Add more routes for order history, user profile etc. */}
            </Routes>
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

function NavBar() {
  const { user, logout } = useAuth();
  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex space-x-6">
          <Link
            to="/"
            className="text-lg font-semibold hover:text-blue-200 transition duration-200"
          >
            Products
          </Link>
          <Link
            to="/cart"
            className="text-lg font-semibold hover:text-blue-200 transition duration-200"
          >
            Cart
          </Link>
          {user && user.role === "admin" && (
            <Link
              to="/admin"
              className="text-lg font-semibold hover:text-blue-200 transition duration-200"
            >
              Admin
            </Link>
          )}
        </div>
        <div>
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm">
                Welcome, <span className="font-medium">{user.username}</span> (
                <span className="capitalize">{user.role}</span>)
              </span>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-md text-sm transition duration-200"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded-md text-sm transition duration-200"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default App;
