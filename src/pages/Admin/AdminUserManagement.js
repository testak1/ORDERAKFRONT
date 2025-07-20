// Snippet for adding a user (AdminUserManagement.js)
import bcrypt from "bcryptjs";

const handleAddUser = async () => {
  // ... state for new user details (username, password, role, discount)
  const hashedPassword = bcrypt.hashSync(newUserPassword, 10); // HASH ON SERVER IN REAL APP!

  const userDoc = {
    _type: "user",
    username: newUsername,
    password: hashedPassword,
    role: newUserRole,
    discountPercentage: newUserDiscount,
  };

  try {
    await client.create(userDoc);
    alert("User added successfully!");
    // Re-fetch users
  } catch (error) {
    console.error("Failed to add user:", error);
    alert("Failed to add user. Username might already exist.");
  }
};
