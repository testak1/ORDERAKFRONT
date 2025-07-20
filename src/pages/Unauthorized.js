// src/pages/Unauthorized.js
import React from "react";
import { Link } from "react-router-dom";

function Unauthorized() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied!</h1>
        <p className="text-lg text-gray-700 mb-6">
          You do not have permission to view this page.
        </p>
        <Link
          to="/"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
        >
          Go to Home
        </Link>
        <p className="mt-4 text-sm text-gray-500">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  );
}

export default Unauthorized;
