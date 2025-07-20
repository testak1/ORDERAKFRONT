// src/pages/ProductList.js
import React, { useEffect, useState } from "react";
import { client } from "../sanityClient";
import { useAuth } from "../context/AuthContext";

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth(); // Get logged-in user for discount

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [sortOrder, setSortOrder] = useState(""); // 'price-asc', 'price-desc', 'title-asc', 'title-desc'

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

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Our Products</h1>
      {/* Search, Filter, Sort Controls */}
      <input
        type="text"
        placeholder="Search products..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <select
        value={selectedBrand}
        onChange={(e) => setSelectedBrand(e.target.value)}
      >
        <option value="">All Brands</option>
        {getUniqueBrands().map((brand) => (
          <option key={brand} value={brand}>
            {brand}
          </option>
        ))}
      </select>
      <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
        <option value="">Sort By</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="title-asc">Title: A-Z</option>
        <option value="title-desc">Title: Z-A</option>
      </select>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "20px",
        }}
      >
        {filteredAndSortedProducts.map((product) => (
          <div
            key={product._id}
            style={{ border: "1px solid #ccc", padding: "15px" }}
          >
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.title}
                style={{ maxWidth: "100%", height: "auto" }}
              />
            )}
            <h3>{product.title}</h3>
            <p>{product.description}</p>
            <p>SKU: {product.sku}</p>
            <p>Brand: {product.brand}</p>
            <p>Price: ${applyDiscount(product.price).toFixed(2)}</p>
            <button onClick={() => alert(`Add ${product.title} to basket`)}>
              Add to Basket
            </button>
            {/* Implement Quick View Modal */}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductList;
