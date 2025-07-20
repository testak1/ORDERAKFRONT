// src/pages/ProductList.js
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // NEW IMPORT
import { client } from "../sanityClient";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext"; // NEW IMPORT

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const { addToCart } = useCart(); // NEW

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [sortOrder, setSortOrder] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError("");
      try {
        const query = `*[_type == "product"]{_id, title, description, sku, brand, price, "imageUrl": image.asset->url}`;
        const fetchedProducts = await client.fetch(query);
        setProducts(fetchedProducts);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const applyDiscount = (basePrice) => {
    if (user && user.discountPercentage) {
      return basePrice * (1 - user.discountPercentage / 100);
    }
    return basePrice;
  };

  const getUniqueBrands = () => {
    return [...new Set(products.map((p) => p.brand))].filter(Boolean);
  };

  const filteredAndSortedProducts = products
    .filter((product) => {
      const matchesSearch = searchTerm
        ? product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      const matchesBrand = selectedBrand
        ? product.brand === selectedBrand
        : true;
      return matchesSearch && matchesBrand;
    })
    .sort((a, b) => {
      const priceA = applyDiscount(a.price);
      const priceB = applyDiscount(b.price);
      if (sortOrder === "price-asc") return priceA - priceB;
      if (sortOrder === "price-desc") return priceB - priceA;
      if (sortOrder === "title-asc") return a.title.localeCompare(b.title);
      if (sortOrder === "title-desc") return b.title.localeCompare(a.title);
      return 0;
    });

  if (loading)
    return <div className="text-center py-8">Loading products...</div>;
  if (error)
    return <div className="text-center text-red-500 py-8">Error: {error}</div>;

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Our Products</h1>

      {/* Search, Filter, Sort Controls */}
      <div className="flex flex-wrap gap-4 mb-8">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 flex-grow"
        />
        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="p-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Brands</option>
          {getUniqueBrands().map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="p-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Sort By</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="title-asc">Title: A-Z</option>
          <option value="title-desc">Title: Z-A</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAndSortedProducts.map((product) => (
          <div
            key={product._id}
            className="border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden bg-white"
          >
            {/* Wrap image and title in Link */}
            <Link to={`/products/${product._id}`} className="block">
                {product.imageUrl && (
                <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-48 object-cover object-center"
                />
                )}
                <div className="p-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2 truncate">
                    {product.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {product.description}
                </p>
                </div>
            </Link>
            <div className="p-4 pt-0"> {/* Adjusted padding for better flow */}
                <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
                    <span>SKU: {product.sku}</span>
                    <span>Brand: {product.brand}</span>
                </div>
                <p className="text-2xl font-bold text-green-700 mb-4">
                    SEK {applyDiscount(product.price).toFixed(2)} {/* CURRENCY CHANGE */}
                </p>
                <button
                    onClick={() => addToCart(product._id)} // Changed to use addToCart
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
                >
                    Add to Basket
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductList;
