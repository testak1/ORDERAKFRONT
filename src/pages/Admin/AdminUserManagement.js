import React, { useState, useEffect } from "react";
import { client } from "../../sanityClient";
import bcrypt from "bcryptjs";
import CollapsibleSection from "../../components/CollapsibleSection";

// A sub-component for managing a single user to keep the main component cleaner
const UserEditor = ({ user, refreshUsers }) => {
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
      alert("User updated successfully!");
      setIsEditing(false);
      refreshUsers();
    } catch (error) {
      console.error("Failed to update user:", error);
      alert("Failed to update user.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone and may affect their past orders."
      )
    ) {
      try {
        await client.delete(userId);
        alert("User deleted successfully!");
        refreshUsers();
      } catch (error) {
        console.error("Failed to delete user:", error);
        alert(
          "Failed to delete user. They may have existing orders linked to them."
        );
      }
    }
  };

  return (
    <div className="bg-white p-4 rounded-md shadow-sm border border-red-100">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-lg font-medium text-gray-900">
            {user.username} ({user.role})
          </h4>
          <p className="text-sm text-gray-500">
            {user.email || "No email set"}
          </p>
        </div>
        <div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded-md text-sm mr-2"
          >
            {isEditing ? "Cancel" : "Edit"}
          </button>
          <button
            onClick={() => handleDeleteUser(user._id)}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded-md text-sm"
          >
            Delete
          </button>
        </div>
      </div>

      {isEditing && (
        <form
          onSubmit={handleUpdateUser}
          className="mt-4 pt-4 border-t space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={editData.fullName}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
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
              <label className="block text-sm font-medium">Phone</label>
              <input
                type="tel"
                name="phone"
                value={editData.phone}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Discount (%)</label>
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
              Default Address
            </legend>
            <div className="space-y-2">
              <input
                type="text"
                name="addressLine1"
                placeholder="Address Line 1"
                value={editData.address.addressLine1}
                onChange={handleAddressChange}
                className="w-full px-3 py-2 border rounded-md"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={editData.address.city}
                  onChange={handleAddressChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <input
                  type="text"
                  name="postalCode"
                  placeholder="Postal Code"
                  value={editData.address.postalCode}
                  onChange={handleAddressChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <input
                  type="text"
                  name="country"
                  placeholder="Country"
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
            Save Changes
          </button>
        </form>
      )}
    </div>
  );
};

function AdminUserManagement() {
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
      // Updated query to fetch all necessary fields
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
      alert("Username and Password are required.");
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
      alert("User added successfully!");
      // Reset form
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
      alert(
        "Failed to add user. The username or email might already be taken."
      );
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-xl">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center border-b-2 border-red-200 pb-4">
        User Management
      </h2>

      <CollapsibleSection title="Add New User">
        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">
                Username:<span className="text-red-500">*</span>
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
                Password:<span className="text-red-500">*</span>
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
              <label className="block text-sm font-medium">Full Name:</label>
              <input
                type="text"
                name="fullName"
                value={newUser.fullName}
                onChange={handleNewUserChange}
                className="mt-1 w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Email:</label>
              <input
                type="email"
                name="email"
                value={newUser.email}
                onChange={handleNewUserChange}
                className="mt-1 w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Phone:</label>
              <input
                type="tel"
                name="phone"
                value={newUser.phone}
                onChange={handleNewUserChange}
                className="mt-1 w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Role:</label>
              <select
                name="role"
                value={newUser.role}
                onChange={handleNewUserChange}
                className="mt-1 w-full px-3 py-2 border rounded-md bg-white"
              >
                <option value="user">User (Dealer)</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Discount (%):</label>
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
            Add User
          </button>
        </form>
      </CollapsibleSection>

      <CollapsibleSection title="Existing Users" startOpen={true}>
        {loading && <p>Loading users...</p>}
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
