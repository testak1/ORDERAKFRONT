// src/pages/ProductDetailPage.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // NEW IMPORTS
import { client } from "../sanityClient";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext"; // NEW IMPORT

function ProductDetailPage() {
  const { productId } = useParams(); // Get product ID from URL
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const { addToCart } = useCart(); // NEW
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError("");
      try {
        const query = `*[_id == "${productId}"][0]{_id, title, description, sku, brand, price, "imageUrl": image.asset->url}`;
        const fetchedProduct = await client.fetch(query);
        if (fetchedProduct) {
          setProduct(fetchedProduct);
        } else {
          setError("Product not found.");
        }
      } catch (err) {
        console.error("Failed to fetch product:", err);
        setError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const applyDiscount = (basePrice) => {
    if (user && user.discountPercentage) {
      return basePrice * (1 - user.discountPercentage / 100);
    }
    return basePrice;
  };

  if (loading) return <div className="text-center py-8">Loading product details...</div>;
  if (error) return <div className="text-center text-red-500 py-8">Error: {error}</div>;
  if (!product) return <div className="text-center py-8 text-gray-600">Product not found.</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg flex flex-col md:flex-row gap-8">
      {product.imageUrl && (
        <div className="md:w-1/2 flex justify-center items-center p-4 bg-gray-100 rounded-md">
          <img
            src={product.imageUrl}
            alt={product.title}
            className="max-w-full max-h-96 object-contain"
          />
        </div>
      )}
      <div className="md:w-1/2">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.title}</h1>
        <p className="text-lg text-gray-700 mb-6">{product.description}</p>
        
        <div className="space-y-2 mb-6 text-gray-600">
          <p><span className="font-semibold">SKU:</span> {product.sku}</p>
          <p><span className="font-semibold">Brand:</span> {product.brand}</p>
        </div>

        <p className="text-4xl font-extrabold text-green-700 mb-8">
          SEK {applyDiscount(product.price).toFixed(2)} {/* CURRENCY CHANGE */}
        </p>

        <button
          onClick={() => addToCart(product._id)} // Add to cart
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md text-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add to Basket
        </button>

        <button
          onClick={() => navigate(-1)} // Go back button
          className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-md text-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
        >
          Back to Products
        </button>
      </div>
    </div>
  );
}

export default ProductDetailPage;
