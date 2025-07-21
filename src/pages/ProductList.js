import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { client } from "../sanityClient";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

function ProductList() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const query = `*[_type == "product" && (!defined(isArchived) || isArchived == false)] | order(title asc) {
          _id, title, sku, price, "imageUrl": mainImage.asset->url
        }`;
        const data = await client.fetch(query);
        setProducts(data);
      } catch (err) {
        setError(t("productList.loadError"));
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [t]);

  const filteredProducts = products.filter(
    (product) =>
      product.title.toLowerCase().includes(filter.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(filter.toLowerCase()))
  );

  const getDisplayPrice = (productPrice) => {
    if (user && user.discountPercentage > 0) {
      const discountedPrice =
        productPrice * (1 - user.discountPercentage / 100);
      return {
        original: Math.round(productPrice), // Avrundar till heltal
        discounted: Math.round(discountedPrice), // Avrundar till heltal
      };
    }
    return { original: Math.round(productPrice) }; // Avrundar till heltal
  };

  if (loading) return <div className="text-center py-10">{t("common.loading")}</div>;
  if (error)
    return <div className="text-red-500 text-center py-10">{error}</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">{t("productList.title")}</h1>
        <input
          type="text"
          placeholder={t("productList.searchPlaceholder")}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-1/3 px-4 py-2 border border-gray-300 rounded-md"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => {
          const displayPrice = getDisplayPrice(product.price);
          return (
            <div
              key={product._id}
              className="bg-white rounded-lg shadow-lg flex flex-col"
            >
              <Link
                to={`/products/${product._id}`}
                className="flex flex-col flex-grow"
              >
                <img
                  src={
                    product.imageUrl ||
                    "https://placehold.co/400x300?text=BILD%20KOMMER%20INKOM%20KORT"
                  }
                  alt={product.title}
                  className="w-full h-56 object-cover bg-gray-200"
                />
                {/* --- IMPROVED LAYOUT FOR TEXT --- */}
                <div className="p-4 flex flex-col flex-grow">
                  <h2 className="text-xl font-semibold text-gray-900 flex-grow">
                    {product.title}
                  </h2>
                  <p className="text-xs text-gray-500 mt-2">
                    {t("common.skuLabel", { sku: product.sku })}
                  </p>
                  <div className="mt-2">
                    {displayPrice.discounted ? (
                      <div>
                        <p className="text-gray-500 line-through">
                          {t("common.priceFormatted", { price: displayPrice.original })}
                        </p>
                        <p className="text-green-600 font-bold text-lg">
                          {t("common.priceFormatted", { price: displayPrice.discounted })}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-700 font-bold text-lg">
                        {t("common.priceFormatted", { price: displayPrice.original })}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
              <div className="p-4 border-t mt-auto">
                <button
                  onClick={() => addToCart(product)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md"
                >
                  {t("productList.addToCart")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProductList;