import React, { useState, useEffect } from "react";
import { client } from "../../sanityClient";
import bcrypt from "bcryptjs";

function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newUsername, setNewUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");
  const [newUserDiscount, setNewUserDiscount] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const query = `*[_type == "user"]{_id, username, role, discountPercentage}`;
      const fetchedUsers = await client.fetch(query);
      setUsers(fetchedUsers);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUsername || !newUserPassword) {
      alert("Username and Password are required.");
      return;
    }

    const hashedPassword = bcrypt.hashSync(newUserPassword, 10);

    const userDoc = {
      _type: "user",
      username: newUsername,
      password: hashedPassword,
      role: newUserRole,
      discountPercentage: parseFloat(newUserDiscount),
    };

    try {
      await client.create(userDoc);
      alert("User added successfully!");
      setNewUsername("");
      setNewUserPassword("");
      setNewUserRole("user");
      setNewUserDiscount(0);
      fetchUsers();
    } catch (error) {
      console.error("Failed to add user:", error);
      if (
        error.details &&
        error.details.some((d) => d.type === "uniqueConstraintViolation")
      ) {
        alert("Failed to add user. Username already exists.");
      } else {
        alert("Failed to add user.");
      }
    }
  };

  const handleUpdateUserDiscount = async (userId, newDiscount) => {
    try {
      await client
        .patch(userId)
        .set({ discountPercentage: parseFloat(newDiscount) })
        .commit();
      alert("User discount updated!");
      fetchUsers();
    } catch (error) {
      console.error("Failed to update user discount:", error);
      alert("Failed to update user discount.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this user? All their orders will remain unless manually deleted."
      )
    ) {
      try {
        await client.delete(userId);
        alert("User deleted successfully!");
        fetchUsers();
      } catch (error) {
        console.error("Failed to delete user:", error);
        alert("Failed to delete user.");
      }
    }
  };

  if (loading) return <div className="text-center py-8">Loading users...</div>;
  if (error)
    return <div className="text-center text-red-500 py-8">Error: {error}</div>;

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">User Management</h2>

      {/* Add New User */}
      <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Add New User
        </h3>
        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Username:
            </label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password:
            </label>
            <input
              type="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role:
            </label>
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
            >
              <option value="user">User (Dealer)</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Discount (%):
            </label>
            <input
              type="number"
              value={newUserDiscount}
              onChange={(e) => setNewUserDiscount(parseFloat(e.target.value))}
              min="0"
              max="100"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
          >
            Add User
          </button>
        </form>
      </div>

      {/* Manage Existing Users */}
      <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Existing Users
        </h3>
        {users.length === 0 && <p className="text-gray-500">No users found.</p>}
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user._id}
              className="flex justify-between items-center bg-white p-4 rounded-md shadow-sm border border-gray-100"
            >
              <div>
                <h4 className="text-lg font-medium text-gray-900">
                  {user.username} (
                  <span className="capitalize">{user.role}</span>)
                </h4>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-600 mr-2">
                    Current Discount: {user.discountPercentage}%
                  </span>
                  <label className="sr-only">Update Discount (%):</label>{" "}
                  {/* Screen reader only label */}
                  <input
                    type="number"
                    value={user.discountPercentage}
                    onChange={(e) =>
                      handleUpdateUserDiscount(user._id, e.target.value)
                    }
                    min="0"
                    max="100"
                    className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={() => handleDeleteUser(user._id)}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-200"
              >
                Delete User
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminUserManagement;
