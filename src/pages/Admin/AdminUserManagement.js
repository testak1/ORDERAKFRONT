import React, { useState, useEffect } from "react";
import { client } from "../../sanityClient"; // Import Sanity client
import bcrypt from "bcryptjs"; // For hashing passwords (remember security considerations!)

function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State for adding a new user
  const [newUsername, setNewUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("user"); // Default to 'user'
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

    // Hashing password on frontend: IMPORTANT SECURITY NOTE!
    // In a real production application, password hashing and user creation
    // should ideally happen on a secure backend server, not directly from the frontend.
    // This is for demonstration purposes in a purely Sanity-driven setup.
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
      fetchUsers(); // Re-fetch users
    } catch (error) {
      console.error("Failed to add user:", error);
      // Check for unique constraint error from Sanity
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
      fetchUsers(); // Re-fetch users
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
        fetchUsers(); // Re-fetch users
      } catch (error) {
        console.error("Failed to delete user:", error);
        alert("Failed to delete user.");
      }
    }
  };

  if (loading) return <div>Loading users...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>User Management</h2>

      {/* Add New User */}
      <h3>Add New User</h3>
      <form onSubmit={handleAddUser}>
        <div>
          <label>
            Username:{" "}
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Password:{" "}
            <input
              type="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Role:
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
            >
              <option value="user">User (Dealer)</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            Discount (%):{" "}
            <input
              type="number"
              value={newUserDiscount}
              onChange={(e) => setNewUserDiscount(parseFloat(e.target.value))}
              min="0"
              max="100"
            />
          </label>
        </div>
        <button type="submit">Add User</button>
      </form>

      {/* Manage Existing Users */}
      <h3>Existing Users</h3>
      {users.length === 0 && <p>No users found.</p>}
      {users.map((user) => (
        <div
          key={user._id}
          style={{
            border: "1px solid #eee",
            padding: "10px",
            marginBottom: "10px",
          }}
        >
          <h4>
            {user.username} ({user.role})
          </h4>
          <p>Current Discount: {user.discountPercentage}%</p>
          <div>
            <label>
              Update Discount (%):
              <input
                type="number"
                value={user.discountPercentage} // This will show the current value
                onChange={(e) =>
                  handleUpdateUserDiscount(user._id, e.target.value)
                }
                min="0"
                max="100"
              />
            </label>
          </div>
          <button onClick={() => handleDeleteUser(user._id)}>
            Delete User
          </button>
        </div>
      ))}
    </div>
  );
}

export default AdminUserManagement;
