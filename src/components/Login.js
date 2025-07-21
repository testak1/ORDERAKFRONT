import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, loading } = useAuth(); // Lägg till loading från context
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const result = await login(username, password);
    if (result.success) {
      navigate("/");
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logotyp */}
        <div className="text-center mb-8">
          <img
            src="https://cdn.sanity.io/images/2toaqqka/production/fe195e2982641e4d117dd66c4c92768480c7aaaa-600x564.png"
            alt="AK Tuning Logo"
            className="w-48 mx-auto"
          />
        </div>

        <div className="bg-white p-8 rounded-xl shadow-2xl border-t-4 border-red-600">
          <h2 className="text-2xl font-bold text-gray-700 mb-1 text-center">
            Welcome Back
          </h2>
          <p className="text-gray-500 mb-6 text-center text-sm">
            Please log in to access the dealer portal.
          </p>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <p className="bg-red-100 text-red-700 text-sm text-center p-3 rounded-md">
                {error}
              </p>
            )}
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="username"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-base transition"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="password"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-base transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
