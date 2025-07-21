import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { client } from "../sanityClient";
import OrderCard from "./Admin/OrderCard";
import PdfExportModal from "../components/PdfExportModal";
import { useTranslation } from "react-i18next";

function UserProfile() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedOrderForPdf, setSelectedOrderForPdf] = useState(null);

  useEffect(() => {
    if (user) {
      const fetchOrders = async () => {
        setLoading(true);
        try {
          const query = `*[_type == "order" && user._ref == $userId] { ..., items[]{..., product->{title, sku}}, user->{username, _id} } | order(createdAt desc)`;
          const userOrders = await client.fetch(query, { userId: user._id });
          setOrders(userOrders);
        } catch (error) {
          console.error("Failed to fetch user orders:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchOrders();
    }
  }, [user]);

  const handleExportPdf = (order) => {
    setSelectedOrderForPdf(order);
    setShowPdfModal(true);
  };
  const handleClosePdfModal = () => {
    setShowPdfModal(false);
    setSelectedOrderForPdf(null);
  };

  if (!user) {
    return <div>{t("profile.loginPrompt")}</div>;
  }

  return (
    <>
      {showPdfModal && (
        <PdfExportModal
          order={selectedOrderForPdf}
          onClose={handleClosePdfModal}
        />
      )}
      <div className="p-6 bg-white rounded-lg shadow-xl">
        <div className="flex justify-between items-start mb-6 border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{t("profile.myProfile")}</h1>
            <p className="text-lg text-gray-600">
              {t("profile.welcome", { name: user.fullName || user.username })}
            </p>
          </div>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md"
          >
            {t("navbar.logout")}
          </button>
        </div>

        {/* --- NEW USER STATS SECTION --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-center">
          <div className="p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600 font-semibold">
              {t("profile.totalOrders")}
            </p>
            <p className="text-2xl font-bold text-red-600">
              {loading ? "..." : orders.length}
            </p>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600 font-semibold">
              {t("profile.dealerDiscount")}
            </p>
            <p className="text-2xl font-bold text-green-600">
              {user.discountPercentage || 0}%
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t("profile.myOrders")}</h2>
          {loading ? (
            <p>{t("profile.loadingOrders")}</p>
          ) : orders.length > 0 ? (
            <div className="space-y-6">
              {orders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  isAdminView={false}
                  onExportPdf={handleExportPdf}
                />
              ))}
            </div>
          ) : (
            <p>{t("profile.noOrders")}</p>
          )}
        </div>
      </div>
    </>
  );
}

export default UserProfile;