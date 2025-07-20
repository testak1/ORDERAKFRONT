// src/pages/ProductDetail.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { client } from "../sanityClient";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

function ProductDetail() {
  const { productId } = useParams(); // Get product ID from URL
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1); // For adding to cart

  useEffect(() => {
    if (!productId) {
      setError("No product ID provided.");
      setLoading(false);
      return;
    }

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
    fetchProduct();
  }, [productId]); // Re-fetch if productId changes

  const applyDiscount = (basePrice) => {
    if (user && user.discountPercentage) {
      return basePrice * (1 - user.discountPercentage / 100);
    }
    return basePrice;
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product._id, quantity);
      alert(`${quantity} of ${product.title} added to basket!`);
    }
  };

  if (loading)
    return <div className="text-center py-8">Loading product details...</div>;
  if (error)
    return <div className="text-center text-red-500 py-8">Error: {error}</div>;
  if (!product)
    return (
      <div className="text-center py-8 text-gray-600">Product not found.</div>
    );

  const discountedPrice = applyDiscount(product.price);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)} // Go back to previous page
        className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        Back to Products
      </button>

      <div className="md:flex md:space-x-8">
        {product.imageUrl && (
          <div className="md:w-1/2 mb-6 md:mb-0">
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-80 object-contain rounded-lg shadow-sm border border-gray-100"
            />
          </div>
        )}
        <div className="md:w-1/2">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {product.title}
          </h1>
          <p className="text-xl text-gray-700 mb-4">{product.description}</p>
          <div className="text-sm text-gray-500 mb-2">
            <span>SKU: {product.sku}</span>{" "}
            <span className="ml-4">Brand: {product.brand}</span>
          </div>
          <p className="text-3xl font-bold text-green-700 mb-6">
            SEK {discountedPrice.toFixed(2)}
          </p>

          <div className="flex items-center space-x-4 mb-6">
            <label
              htmlFor="quantity"
              className="text-lg font-medium text-gray-700"
            >
              Quantity:
            </label>
            <input
              type="number"
              id="quantity"
              min="1"
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value) || 1))
              } // Ensure at least 1
              className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md text-lg transition-colors duration-200"
          >
            Add to Basket
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
