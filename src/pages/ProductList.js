import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { client } from "../sanityClient";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

const PRODUCTS_PER_PAGE = 20; // Bestäm hur många produkter som ska visas per sida

function ProductList() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();
  const { user } = useAuth();

  // --- NY STATE FÖR FILTRERING OCH PAGINERING ---
  const [page, setPage] = useState(0); // Håller koll på vilken sida vi är på
  const [hasMore, setHasMore] = useState(true); // Kollar om det finns fler sidor
  const [searchTerm, setSearchTerm] = useState(""); // Omdöpt från 'filter' för tydlighet
  const [selectedCategory, setSelectedCategory] = useState(""); // För kategorifiltret
  const [categories, setCategories] = useState([]); // Lista med alla tillgängliga kategorier

  // --- Effekt för att hämta alla unika produktkategorier en gång ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const query = `*[_type == "product" && defined(category)].category`;
        const uniqueCategories = await client.fetch(query);
        // Skapa en unik, sorterad lista av kategorier
        setCategories([...new Set(uniqueCategories)].sort());
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // --- Omarbetad funktion för att hämta produkter med filter och paginering ---
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const start = page * PRODUCTS_PER_PAGE;
      const end = start + PRODUCTS_PER_PAGE;
      
      // Bygg upp query-villkor dynamiskt
      const conditions = [
        `!defined(isArchived) || isArchived == false`
      ];
      const params = {};

      if (searchTerm) {
        conditions.push(`(title match $searchTerm + "*" || sku match $searchTerm + "*")`);
        params.searchTerm = searchTerm;
      }
      if (selectedCategory) {
        conditions.push(`category == $category`);
        params.category = selectedCategory;
      }

      const query = `
        *[_type == "product" && ${conditions.join(' && ')}] | order(title asc) [${start}...${end}] {
          _id, title, sku, price, "imageUrl": mainImage.asset->url
        }`;
        
      const data = await client.fetch(query, params);
      setProducts(data);
      
      // Om vi fick tillbaka färre produkter än vi bad om, finns det inga fler sidor
      setHasMore(data.length === PRODUCTS_PER_PAGE);

    } catch (err) {
      setError(t("productList.loadError"));
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, selectedCategory, t]);

  useEffect(() => {
    // Använd en debounce för söktermen för att inte skicka för många anrop
    const handler = setTimeout(() => {
      fetchProducts();
    }, 300); // Väntar 300ms efter senaste knapptryckningen

    return () => {
      clearTimeout(handler);
    };
  }, [fetchProducts]);

  // Nollställ sidan när filter ändras
  useEffect(() => {
    setPage(0);
  }, [searchTerm, selectedCategory]);

  const getDisplayPrice = (productPrice) => {
    if (user && user.discountPercentage > 0) {
      const discountedPrice = productPrice * (1 - user.discountPercentage / 100);
      return {
        original: Math.round(productPrice),
        discounted: Math.round(discountedPrice),
      };
    }
    return { original: Math.round(productPrice) };
  };

  return (
    <div className="p-4">
      {/* --- NYA FILTRERINGS-KONTROLLER --- */}
      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">Sök på namn eller artikelnummer</label>
            <input
              id="search"
              type="text"
              placeholder="t.ex. Cat-back eller SSXVW..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Filtrera på kategori</label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">Alla kategorier</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>
      </div>
      
      <h1 className="text-4xl font-bold text-gray-800 mb-8">{t("productList.title")}</h1>

      {loading ? (
        <div className="text-center py-10">{t("common.loading")}</div>
      ) : error ? (
        <div className="text-red-500 text-center py-10">{error}</div>
      ) : products.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
            <h3 className="text-xl font-semibold">Inga produkter hittades</h3>
            <p>Försök att justera dina filter eller söktermer.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const displayPrice = getDisplayPrice(product.price);
              return (
                <div key={product._id} className="bg-white rounded-lg shadow-lg flex flex-col">
                  <Link to={`/products/${product._id}`} className="flex flex-col flex-grow">
                    <img
                      src={product.imageUrl || "https://placehold.co/400x300?text=BILD%20KOMMER%20INKOM%20KORT"}
                      alt={product.title}
                      className="w-full h-56 object-cover bg-gray-200"
                    />
                    <div className="p-4 flex flex-col flex-grow">
                      <h2 className="text-xl font-semibold text-gray-900 flex-grow">{product.title}</h2>
                      <p className="text-xs text-gray-500 mt-2">{t("common.skuLabel", { sku: product.sku })}</p>
                      <div className="mt-2">
                        {displayPrice.discounted ? (
                          <div>
                            <p className="text-gray-500 line-through">{t("common.priceFormatted", { price: displayPrice.original })}</p>
                            <p className="text-green-600 font-bold text-lg">{t("common.priceFormatted", { price: displayPrice.discounted })}</p>
                          </div>
                        ) : (
                          <p className="text-gray-700 font-bold text-lg">{t("common.priceFormatted", { price: displayPrice.original })}</p>
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

          {/* --- NYA PAGINERINGS-KNAPPAR --- */}
          <div className="flex justify-between items-center mt-12">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 0}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Föregående
            </button>
            <span className="text-gray-700">Sida {page + 1}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Nästa
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ProductList;
