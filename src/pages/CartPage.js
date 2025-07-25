import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { client } from "../sanityClient";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from 'react-toastify';

function CartPage() {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    getTotalPrice,
    clearCart,
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // STATE FOR ADDRESS
  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    addressLine1: "",
    city: "",
    postalCode: "",
    country: "",
  });
  const [useDefaultAddress, setUseDefaultAddress] = useState(true);

  // STATE FOR ORDER
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => {
    if (user && user.address && useDefaultAddress) {
      setShippingAddress({
        fullName: user.fullName || "",
        addressLine1: user.address.addressLine1 || "",
        city: user.address.city || "",
        postalCode: user.address.postalCode || "",
        country: user.address.country || "",
      });
    } else if (user && useDefaultAddress) {
      // If user has no default address but checkbox is checked, use their name
      setShippingAddress({
        fullName: user.fullName || "",
        addressLine1: "",
        city: "",
        postalCode: "",
        country: "",
      });
    } else {
      // Clear form if not using default
      setShippingAddress({
        fullName: "",
        addressLine1: "",
        city: "",
        postalCode: "",
        country: "",
      });
    }
  }, [user, useDefaultAddress]);

  const handleShippingChange = (e) => {
    setShippingAddress((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePlaceOrder = async () => {
  if (!user) {
    toast.error(t("cart.alerts.loginRequired"));
    navigate("/login");
    return;
  }
  if (cartItems.length === 0) {
    toast.error(t("cart.alerts.emptyCart"));
    return;
  }
  if (Object.values(shippingAddress).some((val) => val === "")) {
    toast.error(t("cart.alerts.fillAddress"));
    return;
  }

    setOrderLoading(true);
  const orderDoc = {
    _type: "order",
    user: { _ref: user._id, _type: "reference" },
    items: cartItems.map((item) => ({
      _key: item._id,
      product: { _ref: item._id, _type: "reference" },
      title: item.title,
      sku: item.sku,
      quantity: item.quantity,
      priceAtPurchase: item.priceAtPurchase,
    })),
    shippingAddress: shippingAddress,
    totalAmount: getTotalPrice(),
    orderStatus: "pending",
    createdAt: new Date().toISOString(),
  };

  try {
    await client.create(orderDoc);
    clearCart();
    toast.success(
      <div>
        <h3 className="font-bold">{t("cart.alerts.orderSuccessTitle")}</h3>
        <p>{t("cart.alerts.orderSuccessMessage")}</p>
      </div>,
      {
        icon: '🚀',
        autoClose: 5000,
      }
    );
    navigate("/profile");
  } catch (error) {
    console.error("Order placement error:", error);
    toast.error(t("cart.alerts.orderFailure"));
  } finally {
    setOrderLoading(false);
  }
};
  
   const total = getTotalPrice();
  // NY: Beräkna totalpriset exklusive moms
  const totalExclVat = Math.round(total / 1.25);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {t("cart.title")}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>{t("cart.emptyCart")}</p>
              <button onClick={() => navigate("/")} className="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md">
                {t("cart.continueShopping")}
              </button>
            </div>
          ) : (
            <>
              {cartItems.map((item) => (
                <div key={item._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg shadow-sm">
                  <div>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    {/* NY: Lägg till pris exkl. moms här */}
                    <p className="text-md font-medium text-green-700">
                      {t("common.priceFormatted", { price: item.priceAtPurchase })}
                      <span className="text-sm text-gray-500 font-normal ml-2">
                        (exkl. moms: {Math.round(item.priceAtPurchase / 1.25)} kr)
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <input type="number" min="1" value={item.quantity} onChange={(e) => updateQuantity(item._id, parseInt(e.target.value))} className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center" />
                    <button onClick={() => removeFromCart(item._id)} className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1.5 px-3 rounded-md text-sm">
                      {t("cart.remove")}
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex flex-col items-end pt-4 border-t mt-4">
                {/* NY: Visa total exkl. moms */}
                <h3 className="text-lg font-semibold text-gray-600">
                  Totalt (exkl. moms): {totalExclVat} kr
                </h3>
                <h2 className="text-2xl font-bold text-gray-800">
                  {t("cart.total", { total })}
                </h2>
              </div>
            </>
          )}
        </div>

        <div className="md:col-span-1 p-6 border rounded-lg bg-gray-50 h-fit">
          <h3 className="text-xl font-semibold mb-4">{t("cart.shippingAddress")}</h3>

          {user?.address?.addressLine1 && (
            <div className="mb-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={useDefaultAddress}
                  onChange={(e) => setUseDefaultAddress(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span>{t("cart.useDefaultAddress")}</span>
              </label>
            </div>
          )}

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium">{t("cart.fullName")}:</label>
              <input
                type="text"
                name="fullName"
                value={shippingAddress.fullName}
                onChange={handleShippingChange}
                disabled={useDefaultAddress}
                required
                className="mt-1 w-full px-3 py-2 border rounded-md disabled:bg-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">{t("cart.addressLine")}:</label>
              <input
                type="text"
                name="addressLine1"
                value={shippingAddress.addressLine1}
                onChange={handleShippingChange}
                disabled={useDefaultAddress}
                required
                className="mt-1 w-full px-3 py-2 border rounded-md disabled:bg-gray-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">{t("cart.city")}:</label>
                <input
                  type="text"
                  name="city"
                  value={shippingAddress.city}
                  onChange={handleShippingChange}
                  disabled={useDefaultAddress}
                  required
                  className="mt-1 w-full px-3 py-2 border rounded-md disabled:bg-gray-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  {t("cart.postalCode")}:
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={shippingAddress.postalCode}
                  onChange={handleShippingChange}
                  disabled={useDefaultAddress}
                  required
                  className="mt-1 w-full px-3 py-2 border rounded-md disabled:bg-gray-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">{t("cart.country")}:</label>
              <input
                type="text"
                name="country"
                value={shippingAddress.country}
                onChange={handleShippingChange}
                disabled={useDefaultAddress}
                required
                className="mt-1 w-full px-3 py-2 border rounded-md disabled:bg-gray-200"
              />
            </div>
          </form>

          <button
            onClick={handlePlaceOrder}
            disabled={orderLoading || cartItems.length === 0}
            className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-md disabled:opacity-50"
          >
            {orderLoading
              ? t("cart.placingOrder")
              : t("cart.buyNow", { total })}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartPage;