import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { client } from "../sanityClient";
import OrderCard from "./Admin/OrderCard";
import PdfExportModal from "../components/PdfExportModal";

function UserProfile() {
  const { user, logout, updateUserContext } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- STATE FOR PROFILE FORM ---
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: { addressLine1: "", city: "", postalCode: "", country: "" },
  });
  const [isEditing, setIsEditing] = useState(false);

  // --- STATE FOR PDF MODAL ---
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedOrderForPdf, setSelectedOrderForPdf] = useState(null);

  useEffect(() => {
    if (user) {
      // Pre-fill profile form with user data
      setProfileData({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || {
          addressLine1: "",
          city: "",
          postalCode: "",
          country: "",
        },
      });

      // Fetch orders
      const fetchOrders = async () => {
        setLoading(true);
        try {
          const query = `*[_type == "order" && user._ref == $userId] { ..., items[]{..., product->{title, sku}}, user->{username, _id} } | order(createdAt desc)`;
          const userOrders = await client.fetch(query, { userId: user._id });
          setOrders(userOrders);
        } catch (error) {
          console.error("Failed to fetch orders:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchOrders();
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      address: { ...prev.address, [name]: value },
    }));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      await client.patch(user._id).set(profileData).commit();
      updateUserContext(profileData); // Update context and local storage
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Profile update failed:", error);
      alert("Failed to update profile.");
    }
  };

  // PDF Modal Handlers
  const handleExportPdf = (order) => {
    setSelectedOrderForPdf(order);
    setShowPdfModal(true);
  };
  const handleClosePdfModal = () => {
    setShowPdfModal(false);
    setSelectedOrderForPdf(null);
  };

  if (!user) {
    return <div>Please log in.</div>;
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
          <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md"
          >
            Logout
          </button>
        </div>

        {/* --- PROFILE DETAILS & EDIT FORM --- */}
        <div className="mb-8 p-6 border border-gray-200 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">My Details</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1 px-3 rounded-md"
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {!isEditing ? (
            <div className="space-y-2 text-gray-700">
              <p>
                <strong>Full Name:</strong> {user.fullName || "Not set"}
              </p>
              <p>
                <strong>Email:</strong> {user.email || "Not set"}
              </p>
              <p>
                <strong>Phone:</strong> {user.phone || "Not set"}
              </p>
              <p>
                <strong>Default Address:</strong>{" "}
                {user.address
                  ? `${user.address.addressLine1}, ${user.address.city}, ${user.address.postalCode}`
                  : "Not set"}
              </p>
            </div>
          ) : (
            <form onSubmit={handleProfileSave} className="space-y-4">
              {/* Form fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={profileData.fullName}
                    onChange={handleProfileChange}
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                />
              </div>
              <fieldset className="border p-4 rounded-md">
                <legend className="text-lg font-medium px-2">
                  Default Address
                </legend>
                <div className="space-y-4">
                  <input
                    type="text"
                    name="addressLine1"
                    placeholder="Address Line 1"
                    value={profileData.address.addressLine1}
                    onChange={handleAddressChange}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      name="city"
                      placeholder="City"
                      value={profileData.address.city}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                    <input
                      type="text"
                      name="postalCode"
                      placeholder="Postal Code"
                      value={profileData.address.postalCode}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                    <input
                      type="text"
                      name="country"
                      placeholder="Country"
                      value={profileData.address.country}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
              </fieldset>
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md"
              >
                Save Changes
              </button>
            </form>
          )}
        </div>

        {/* --- ORDER HISTORY --- */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">My Orders</h2>
          {/* Order rendering logic remains the same */}
          {loading ? (
            <p>Loading orders...</p>
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
            <p>You have no orders.</p>
          )}
        </div>
      </div>
    </>
  );
}

export default UserProfile;
