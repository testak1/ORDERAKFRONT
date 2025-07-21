import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { client } from "../sanityClient";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext"; // Import useAuth

function ProductDetail() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();
  const { user } = useAuth(); // Get the logged-in user

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const query = `*[_type == "product" && _id == $productId][0]{
          _id, title, description, sku, price, "imageUrl": mainImage.asset->url
        }`;
        const data = await client.fetch(query, { productId });
        setProduct(data);
      } catch (err) {
        setError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  // --- PRICE CALCULATION LOGIC ---
  const getDisplayPrice = () => {
    if (product && user && user.discountPercentage > 0) {
      const discountedPrice =
        product.price * (1 - user.discountPercentage / 100);
      return {
        original: product.price,
        discounted: discountedPrice,
      };
    }
    return product ? { original: product.price } : {};
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error)
    return <div className="text-red-500 text-center py-10">{error}</div>;
  if (!product) return <div>Product not found.</div>;

  const displayPrice = getDisplayPrice();

  return (
    <div className="container mx-auto p-8">
      <div className="bg-white shadow-xl rounded-lg overflow-hidden md:flex">
        <div className="md:w-1/2">
          <img
            src={
              product.imageUrl ||
              "https://placehold.co/400x300?text=BILD%20KOMMER%20INKOM%20KORT"
            }
            alt={product.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="md:w-1/2 p-8 flex flex-col justify-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {product.title}
          </h1>
          <div
            className="text-gray-600 mb-6"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />

          {/* --- NEW PRICE DISPLAY --- */}
          <div className="mb-6">
            {displayPrice.discounted ? (
              <>
                <p className="text-2xl text-gray-500 line-through">
                  ORD PRIS: {displayPrice.original} kr
                </p>
                <p className="text-4xl font-extrabold text-green-600">
                  DITT PRIS: {displayPrice.discounted} kr
                </p>
              </>
            ) : (
              <p className="text-3xl font-extrabold text-gray-800">
                {displayPrice.original} kr
              </p>
            )}
          </div>

          <button
            onClick={() => addToCart(product)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
