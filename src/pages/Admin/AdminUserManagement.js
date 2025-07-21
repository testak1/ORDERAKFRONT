import React, { useState, useEffect } from "react";
import { client } from "../../sanityClient";
import bcrypt from "bcryptjs";
import CollapsibleSection from "../../components/CollapsibleSection";
import { useTranslation } from "react-i18next";

// Sub-komponent för att hantera en enskild användare
const UserEditor = ({ user, refreshUsers }) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    fullName: user.fullName || "",
    email: user.email || "",
    phone: user.phone || "",
    discountPercentage: user.discountPercentage || 0,
    address: user.address || {
      addressLine1: "",
      city: "",
      postalCode: "",
      country: "",
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      address: { ...prev.address, [name]: value },
    }));
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await client
        .patch(user._id)
        .set({
          ...editData,
          discountPercentage: parseFloat(editData.discountPercentage),
        })
        .commit();
      alert(t("adminUserManagement.userEditor.updateSuccess"));
      setIsEditing(false);
      refreshUsers();
    } catch (error) {
      console.error("Failed to update user:", error);
      alert(t("adminUserManagement.userEditor.updateError"));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (
      window.confirm(t("adminUserManagement.userEditor.deleteConfirm"))
    ) {
      try {
        await client.delete(userId);
        alert(t("adminUserManagement.userEditor.deleteSuccess"));
        refreshUsers();
      } catch (error) {
        console.error("Failed to delete user:", error);
        alert(t("adminUserManagement.userEditor.deleteError"));
      }
    }
  };

  return (
    <div className="bg-white p-4 rounded-md shadow-sm border border-red-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
          <h4 className="text-lg font-medium text-gray-900">
            {user.username} ({user.role})
          </h4>
          <p className="text-sm text-gray-500">
            {user.email || t("adminUserManagement.userEditor.noEmail")}
          </p>
        </div>
        <div className="flex space-x-2 mt-2 md:mt-0">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded-md text-sm"
          >
            {isEditing ? t("adminUserManagement.userEditor.cancel") : t("adminUserManagement.userEditor.edit")}
          </button>
          <button
            onClick={() => handleDeleteUser(user._id)}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded-md text-sm"
          >
            {t("common.delete")}
          </button>
        </div>
      </div>

      {isEditing && (
        <form
          onSubmit={handleUpdateUser}
          className="mt-4 pt-4 border-t space-y-4"
        >
          {/* --- DETTA ÄR DEN ÅTERSTÄLLDA FORMULÄRKODEN --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">{t("adminUserManagement.form.fullName")}</label>
              <input
                type="text"
                name="fullName"
                value={editData.fullName}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">{t("adminUserManagement.form.email")}</label>
              <input
                type="email"
                name="email"
                value={editData.email}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">{t("adminUserManagement.form.phone")}</label>
              <input
                type="tel"
                name="phone"
                value={editData.phone}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">{t("adminUserManagement.form.discount")}</label>
              <input
                type="number"
                name="discountPercentage"
                value={editData.discountPercentage}
                onChange={handleChange}
                min="0"
                max="100"
                className="mt-1 w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          <fieldset className="border p-4 rounded-md">
            <legend className="text-md font-medium px-2">
              {t("adminUserManagement.userEditor.defaultAddress")}
            </legend>
            <div className="space-y-2">
              <input
                type="text"
                name="addressLine1"
                placeholder={t("adminUserManagement.userEditor.addressLine1")}
                value={editData.address.addressLine1}
                onChange={handleAddressChange}
                className="w-full px-3 py-2 border rounded-md"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  name="city"
                  placeholder={t("adminUserManagement.userEditor.city")}
                  value={editData.address.city}
                  onChange={handleAddressChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <input
                  type="text"
                  name="postalCode"
                  placeholder={t("adminUserManagement.userEditor.postalCode")}
                  value={editData.address.postalCode}
                  onChange={handleAddressChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <input
                  type="text"
                  name="country"
                  placeholder={t("adminUserManagement.userEditor.country")}
                  value={editData.address.country}
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
            {t("adminUserManagement.form.saveChangesButton")}
          </button>
        </form>
      )}
    </div>
  );
};

function AdminUserManagement() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "user",
    discountPercentage: 0,
    fullName: "",
    email: "",
    phone: "",
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const query = `*[_type == "user"]{_id, username, role, discountPercentage, fullName, email, phone, address}`;
      const fetchedUsers = await client.fetch(query);
      setUsers(fetchedUsers);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) {
      alert(t("adminUserManagement.form.alertRequired"));
      return;
    }

    const hashedPassword = bcrypt.hashSync(newUser.password, 10);
    const userDoc = {
      _type: "user",
      ...newUser,
      password: hashedPassword,
      discountPercentage: parseFloat(newUser.discountPercentage),
    };

    try {
      await client.create(userDoc);
      alert(t("adminUserManagement.form.addSuccess"));
      setNewUser({
        username: "",
        password: "",
        role: "user",
        discountPercentage: 0,
        fullName: "",
        email: "",
        phone: "",
      });
      fetchUsers();
    } catch (error) {
      console.error("Failed to add user:", error);
      alert(t("adminUserManagement.form.addError"));
    }
  };

  return (
    <div className="p-2 md:p-4 bg-white rounded-lg shadow-xl">
      <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-8 text-center border-b-2 border-red-200 pb-4">
        {t("adminUserManagement.title")}
      </h2>

      <CollapsibleSection title={t("adminUserManagement.addUserTitle")}>
        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">
                {t("adminUserManagement.form.username")}:<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={newUser.username}
                onChange={handleNewUserChange}
                required
                className="mt-1 w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                {t("adminUserManagement.form.password")}:<span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={newUser.password}
                onChange={handleNewUserChange}
                required
                className="mt-1 w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">{t("adminUserManagement.form.fullName")}:</label>
              <input
                type="text"
                name="fullName"
                value={newUser.fullName}
                onChange={handleNewUserChange}
                className="mt-1 w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">{t("adminUserManagement.form.email")}:</label>
              <input
                type="email"
                name="email"
                value={newUser.email}
                onChange={handleNewUserChange}
                className="mt-1 w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">{t("adminUserManagement.form.phone")}:</label>
              <input
                type="tel"
                name="phone"
                value={newUser.phone}
                onChange={handleNewUserChange}
                className="mt-1 w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">{t("adminUserManagement.form.role")}:</label>
              <select
                name="role"
                value={newUser.role}
                onChange={handleNewUserChange}
                className="mt-1 w-full px-3 py-2 border rounded-md bg-white"
              >
                <option value="user">{t("adminUserManagement.form.userRole")}</option>
                <option value="admin">{t("adminUserManagement.form.adminRole")}</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">{t("adminUserManagement.form.discount")}:</label>
              <input
                type="number"
                name="discountPercentage"
                value={newUser.discountPercentage}
                onChange={handleNewUserChange}
                min="0"
                max="100"
                className="mt-1 w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md"
          >
            {t("adminUserManagement.form.addUserButton")}
          </button>
        </form>
      </CollapsibleSection>

      <CollapsibleSection title={t("adminUserManagement.existingUsersTitle")} startOpen={true}>
        {loading && <p>{t("common.loading")}...</p>}
        {error && <p className="text-red-500">{error}</p>}
        <div className="space-y-4">
          {users.map((user) => (
            <UserEditor key={user._id} user={user} refreshUsers={fetchUsers} />
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}

export default AdminUserManagement;
