import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { client } from "../sanityClient";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

function ProductDetail() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();
  const { user } = useAuth();

  // --- NEW STATE FOR EXPANDABLE DESCRIPTION ---
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

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

  const getDisplayPrice = () => {
    if (product && user && user.discountPercentage > 0) {
      const discountedPrice = product.price * (1 - user.discountPercentage / 100);
      return {
        original: product.price.toFixed(2), // Use toFixed(2) for consistency
        discounted: discountedPrice.toFixed(2),
      };
    }
    return product ? { original: product.price.toFixed(2) } : {};
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <div className="text-red-500 text-center py-10">{error}</div>;
  if (!product) return <div>Product not found.</div>;

  const displayPrice = getDisplayPrice();
  
  // Logic for truncating description
  const descriptionPreview = product.description?.substring(0, 250) + "...";

  return (
    <div className="container mx-auto p-8">
      <div className="bg-white shadow-xl rounded-lg overflow-hidden md:flex">
        <div className="md:w-1/2">
          <img
            src={product.imageUrl || "https://placehold.co/400x300?text=BILD%20KOMMER%20INKOM%20KORT"}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="md:w-1/2 p-8 flex flex-col justify-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{product.title}</h1>
          
          {/* --- SKU DISPLAY --- */}
          <p className="text-sm text-gray-500 mb-4">SKU: {product.sku}</p>

          {/* --- EXPANDABLE DESCRIPTION --- */}
          <div className="text-gray-600 mb-6">
            <div
              dangerouslySetInnerHTML={{ __html: isDescriptionExpanded ? product.description : descriptionPreview }}
            />
            {product.description?.length > 250 && (
                 <button onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)} className="text-red-600 font-semibold hover:underline mt-2">
                    {isDescriptionExpanded ? "Read less" : "Read more..."}
                 </button>
            )}
          </div>
          
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
