import React, { createContext, useState, useEffect, useContext } from "react";
import { client } from "../sanityClient";
import Cookies from "js-cookie";
import bcrypt from "bcryptjs";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = Cookies.get("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user cookie", e);
        Cookies.remove("user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      // --- UPDATED QUERY to fetch all new user fields ---
      const query = `*[_type == "user" && username == $username][0]{
        _id,
        username,
        password,
        role,
        discountPercentage,
        fullName,
        email,
        phone,
        address
      }`;
      const fetchedUser = await client.fetch(query, { username });

      if (fetchedUser && bcrypt.compareSync(password, fetchedUser.password)) {
        // Remove password before storing the user object
        const { password: _, ...userToStore } = fetchedUser;

        setUser(userToStore);
        Cookies.set("user", JSON.stringify(userToStore), {
          expires: 7, // Store for 7 days
        });
        return { success: true, user: userToStore };
      } else {
        return { success: false, message: "Invalid credentials" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "An error occurred during login." };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    Cookies.remove("user");
    // It's also good practice to clear the cart cookie on logout
    Cookies.remove("cartItems");
    window.location.href = "/login"; // Redirect to login for a clean state
  };

  // --- NEW FUNCTION to keep user info in sync after profile edits ---
  const updateUserContext = (updatedUserData) => {
    setUser((prevUser) => {
      // Merge new data with existing user data
      const newUser = { ...prevUser, ...updatedUserData };
      // Update the cookie with the fresh information
      Cookies.set("user", JSON.stringify(newUser), { expires: 7 });
      return newUser;
    });
  };

  // Expose the new function through the context provider
  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, updateUserContext }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
