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
  const [activeImageUrl, setActiveImageUrl] = useState('');
  const [allImages, setAllImages] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const query = `*[_type == "product" && _id == $productId][0]{
          _id, 
          title, 
          description, 
          sku, 
          price,
          "mainImageUrl": mainImage.asset->url,
          "galleryImageUrls": galleryImages[].asset->url
        }`;
        const data = await client.fetch(query, { productId });
        setProduct(data);
        
        if (data) {
          const images = [data.mainImageUrl, ...(data.galleryImageUrls || [])].filter(Boolean);
          setAllImages(images);
          setActiveImageUrl(images[0] || '');
        }

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
    const priceExclVat = product.price / 1.25;  // Beräkna först exkl. moms
    const discountedPriceExclVat = priceExclVat * (1 - user.discountPercentage / 100);
    const discountedPriceInclVat = discountedPriceExclVat * 1.25;
    
    return {
      original: Math.round(product.price),
      originalExclVat: Math.round(priceExclVat),
      discounted: Math.round(discountedPriceInclVat),
      discountedExclVat: Math.round(discountedPriceExclVat)
    };
  }
  return product ? { 
    original: Math.round(product.price),
    originalExclVat: Math.round(product.price / 1.25)
  } : {};
};

  if (loading) return <div className="text-center py-10">{t("common.loading")}</div>;
  if (error) return <div className="text-red-500 text-center py-10">{error}</div>;
  if (!product) return <div>{t("productDetail.notFound")}</div>;

  const displayPrice = getDisplayPrice();
  const descriptionPreview = product.description?.substring(0, 250) + "...";

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      <button onClick={() => navigate(-1)} className="mb-4 text-red-600 hover:text-red-800 font-semibold">
        &larr; {t("productDetail.backToProducts")}
      </button>
      <div className="bg-white shadow-xl rounded-lg overflow-hidden md:flex">
        <div className="md:w-1/2 p-4">
          <div className="mb-4 bg-gray-200 rounded-lg overflow-hidden">
            <img
              src={activeImageUrl || "https://placehold.co/400x300?text=BILD%20SAKNAS"}
              alt={product.title}
              className="w-full h-96 object-cover"
            />
          </div>
          {allImages.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {allImages.map((imageUrl, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImageUrl(imageUrl)}
                  className={`rounded-md overflow-hidden border-2 ${activeImageUrl === imageUrl ? 'border-red-600' : 'border-transparent hover:border-red-300'}`}
                >
                  <img src={imageUrl} alt={`${product.title} thumbnail ${index + 1}`} className="w-full h-20 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="md:w-1/2 p-8 flex flex-col justify-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {product.title}
          </h1>
          <p className="text-sm text-gray-500 mb-4">{t("common.skuLabel", { sku: product.sku })}</p>

          <div className="text-gray-600 mb-6">
            <div dangerouslySetInnerHTML={{ __html: isDescriptionExpanded ? product.description : descriptionPreview }} />
            {product.description?.length > 250 && (
              <button onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)} className="text-red-600 font-semibold hover:underline mt-2">
                {isDescriptionExpanded ? t("productDetail.readLess") : t("productDetail.readMore")}
              </button>
            )}
          </div>
          
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            {displayPrice.discounted ? (
              <>
                <p className="text-2xl text-gray-500 line-through">
                  {t("productDetail.regularPrice", { price: displayPrice.original })}
                </p>
                <p className="text-4xl font-extrabold text-green-600">
                  {t("productDetail.yourPrice", { price: displayPrice.discounted })}
                </p>
                <p className="text-md text-gray-600 mt-1">
                  (Exkl. moms: {Math.round(displayPrice.discounted / 1.25)} kr)
                </p>
              </>
            ) : (
              <>
                <p className="text-3xl font-extrabold text-gray-800">
                  {t("common.priceFormatted", { price: displayPrice.original })}
                </p>
                <p className="text-md text-gray-600 mt-1">
                  (Exkl. moms: {Math.round(displayPrice.original / 1.25)} kr)
                </p>
              </>
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
