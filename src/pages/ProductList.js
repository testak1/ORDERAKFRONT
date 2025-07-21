import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { client } from "../sanityClient";
import { useCart } from "../context/CartContext";

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const query = `*[_type == "product"]{
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

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error)
    return <div className="text-red-500 text-center py-10">{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div
            key={product._id}
            className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col"
          >
            <Link to={`/products/${product._id}`}>
              <img
                src={product.imageUrl || "https://via.placeholder.com/300"}
                alt={product.title}
                className="w-full h-56 object-cover"
              />
              <div className="p-4">
                <h2 className="text-xl font-semibold text-gray-900 truncate">
                  {product.title}
                </h2>
                <p className="text-gray-700 font-bold mt-2">
                  SEK {product.price}
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
      </div>
    </div>
  );
}

export default ProductList;
