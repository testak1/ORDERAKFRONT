import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { client } from "../sanityClient";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

function ProductDetail() {
  const { t } = useTranslation();
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();
  const { user } = useAuth();
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
        setError(t("productDetail.loadError"));
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId, t]);

  const getDisplayPrice = () => {
    if (product && user && user.discountPercentage > 0) {
      const discountedPrice =
        product.price * (1 - user.discountPercentage / 100);
      return {
        original: Math.round(product.price),
        discounted: Math.round(discountedPrice),
      };
    }
    return product ? { original: Math.round(product.price) } : {};
  };

  if (loading) return <div className="text-center py-10">{t("common.loading")}</div>;
  if (error)
    return <div className="text-red-500 text-center py-10">{error}</div>;
  if (!product) return <div>{t("productDetail.notFound")}</div>;

  const displayPrice = getDisplayPrice();
  const descriptionPreview = product.description?.substring(0, 250) + "...";

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl"> {/* Bredare container */}
      <button onClick={() => navigate(-1)} className="mb-4 text-red-600 hover:text-red-800 font-semibold">
        &larr; {t("productDetail.backToProducts")}
      </button>
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
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {product.title}
          </h1>
          <p className="text-sm text-gray-500 mb-4">{t("common.skuLabel", { sku: product.sku })}</p>

          <div className="text-gray-600 mb-6">
            <div
              dangerouslySetInnerHTML={{ __html: isDescriptionExpanded ? product.description : descriptionPreview }}
            />
            {product.description?.length > 250 && (
                 <button onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)} className="text-red-600 font-semibold hover:underline mt-2">
                    {isDescriptionExpanded ? t("productDetail.readLess") : t("productDetail.readMore")}
                 </button>
            )}
          </div>
          
          <div className="mb-6">
            {displayPrice.discounted ? (
              <>
                <p className="text-2xl text-gray-500 line-through">
                  {t("productDetail.regularPrice", { price: displayPrice.original })}
                </p>
                <p className="text-4xl font-extrabold text-green-600">
                  {t("productDetail.yourPrice", { price: displayPrice.discounted })}
                </p>
              </>
            ) : (
              <p className="text-3xl font-extrabold text-gray-800">
                {t("common.priceFormatted", { price: displayPrice.original })}
              </p>
            )}
          </div>

          <button
            onClick={() => addToCart(product)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            {t("productDetail.addToCart")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
