import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { client } from "../sanityClient";
import { useCart } from "../context/CartContext";

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState(""); // State for filtering
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // --- THIS QUERY IS NOW CORRECTED ---
        // It now filters out any product where 'isArchived' is true.
        const query = `*[_type == "product" && (!defined(isArchived) || isArchived == false)] | order(title asc) {
          _id,
          title,
          sku,
          price,
          "imageUrl": mainImage.asset->url
        }`;
        const data = await client.fetch(query);
        setProducts(data);
      } catch (err) {
        setError("Failed to load products.");
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(
    (product) =>
      product.title.toLowerCase().includes(filter.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(filter.toLowerCase()))
  );

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error)
    return <div className="text-red-500 text-center py-10">{error}</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Products</h1>
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-1/3 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div
            key={product._id}
            className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col"
          >
            <Link to={`/products/${product._id}`}>
              <img
                src={
                  product.imageUrl ||
                  "https://placehold.co/400x300?text=BILD%20KOMMER%20INKOM%20KORT"
                }
                alt={product.title}
                className="w-full h-56 object-cover bg-gray-200"
              />
              <div className="p-4">
                <h2 className="text-xl font-semibold text-gray-900 truncate">
                  {product.title}
                </h2>
                <p className="text-gray-700 font-bold mt-2">
                  SEK {product.price.toFixed(2)}
                </p>
              </div>
            </Link>
            <div className="p-4 mt-auto">
              <button
                onClick={() => addToCart(product)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
        {/* Show message if no products match filter */}
        {filteredProducts.length === 0 && !loading && (
          <div className="col-span-full text-center py-10 text-gray-500">
            <p>No products found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductList;
