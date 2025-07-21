// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Login from "./components/Login";
import ProductList from "./pages/ProductList";
import ProductDetail from "./pages/ProductDetail";
import CartPage from "./pages/CartPage";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import UserProfile from "./pages/UserProfile";
import Unauthorized from "./pages/Unauthorized";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <NavBar />
          <div className="container mx-auto p-4 md:p-6 lg:p-8 min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProductList />} />
              <Route path="/products/:productId" element={<ProductDetail />} />
              <Route path="/cart" element={<CartPage />} />
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <UserProfile key="user-profile" />
                  </ProtectedRoute>
                }
              />
              <Route path="/unauthorized" element={<Unauthorized />} />{" "}
              {/* New Unauthorized Route */}
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
    <nav className="bg-gradient-to-r from-red-600 to-red-800 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex space-x-6">
          <Link
            to="/"
            className="text-lg font-semibold hover:text-red-200 transition duration-200"
          >
            Products
          </Link>
          <Link
            to="/cart"
            className="text-lg font-semibold hover:text-red-200 transition duration-200"
          >
            Cart
          </Link>
          {user && user.role === "admin" && (
            <Link
              to="/admin"
              className="text-lg font-semibold hover:text-red-200 transition duration-200"
            >
              Admin
            </Link>
          )}
          {user && ( // Show profile link for any logged-in user
            <Link
              to="/profile"
              className="text-lg font-semibold hover:text-red-200 transition duration-200"
            >
              Profile
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
                className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-1 rounded-md text-sm transition duration-200"
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
