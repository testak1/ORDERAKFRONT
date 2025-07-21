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
import { useTranslation } from "react-i18next";

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <NavBar />
          <div className="container mx-auto p-4 md:p-6 lg:p-8 min-h-screen bg-gray-50">
            <Routes>
              {/* Dina routes är korrekta som de är */}
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <ProductList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products/:productId"
                element={
                  <ProtectedRoute>
                    <ProductDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cart"
                element={
                  <ProtectedRoute>
                    <CartPage />
                  </ProtectedRoute>
                }
              />
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
                    <UserProfile />
                  </ProtectedRoute>
                }
              />
              <Route path="/unauthorized" element={<Unauthorized />} />
            </Routes>
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

function NavBar() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  
  return (
    <nav className="bg-gradient-to-r from-red-600 to-red-800 text-white p-4 shadow-lg">
      <div className="container mx-auto flex flex-wrap justify-between items-center gap-y-2">
        {/* --- LOGOTYP TILLAGD HÄR --- */}
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="https://cdn.sanity.io/images/2toaqqka/production/fe195e2982641e4d117dd66c4c92768480c7aaaa-600x564.png"
              alt="AK Tuning Logo"
              className="h-10"
            />
          </Link>
          <Link to="/" className="text-lg font-semibold hover:text-red-200">
            {t("navbar.products")}
          </Link>
          <Link to="/cart" className="text-lg font-semibold hover:text-red-200">
            {t("navbar.cart")}
          </Link>
          {user?.role === "admin" && (
            <Link
              to="/admin"
              className="text-lg font-semibold hover:text-red-200"
            >
              {t("navbar.admin")}
            </Link>
          )}
          {user && (
            <Link
              to="/profile"
              className="text-lg font-semibold hover:text-red-200"
            >
              {t("navbar.profile")}
            </Link>
          )}
        </div>
        {/* --------------------------- */}

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-sm text-center">
                {t("navbar.welcomeUser", { user: user.fullName || user.username, role: user.role })}
              </span>
              <button
                onClick={logout}
                className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-1 rounded-md text-sm"
              >
                {t("navbar.logout")}
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded-md text-sm"
            >
              {t("navbar.login")}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default App;
