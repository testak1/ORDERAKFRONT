// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import { client } from "../sanityClient";
import Cookies from "js-cookie";
import bcrypt from "bcryptjs"; // For client-side hashing (caution!)

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
      const query = `*[_type == "user" && username == $username][0]`;
      const fetchedUser = await client.fetch(query, { username });

      if (fetchedUser && bcrypt.compareSync(password, fetchedUser.password)) {
        const userWithoutPassword = {
          _id: fetchedUser._id,
          username: fetchedUser.username,
          role: fetchedUser.role,
          discountPercentage: fetchedUser.discountPercentage,
        };
        setUser(userWithoutPassword);
        Cookies.set("user", JSON.stringify(userWithoutPassword), {
          expires: 7,
        }); // Store for 7 days
        return { success: true, user: userWithoutPassword };
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
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
