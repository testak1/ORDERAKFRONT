import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { client } from "../sanityClient";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

const PRODUCTS_PER_PAGE = 20;

function ProductList() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();
  const { user } = useAuth();

  // --- STATE ---
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("_createdAt desc");
  
  // Fordonsfilter
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [versions, setVersions] = useState([]); // NYTT: State för versioner
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedVersion, setSelectedVersion] = useState(""); // NYTT: State för vald version

  // Tillverkar-filter
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("");

  // Hämta listor för alla filter-menyer
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const makesQuery = `*[_type == "vehicleMake"] | order(name asc)`;
        const brandsQuery = `*[_type == "product" && defined(brand)].brand`;
        
        const [makesResult, brandsResult] = await Promise.all([
          client.fetch(makesQuery),
          client.fetch(brandsQuery)
        ]);
        
        setMakes(makesResult);
        setBrands([...new Set(brandsResult)].sort());

      } catch (err) {
        console.error("Failed to fetch filter data:", err);
      }
    };
    fetchFilterData();
  }, []);

  // Hämta modeller baserat på valt bilmärke
  useEffect(() => {
    if (!selectedMake) {
      setModels([]);
      setVersions([]);
      setSelectedModel("");
      setSelectedVersion("");
      return;
    }
    const fetchModels = async () => {
      try {
        const query = `*[_type == "vehicleModel" && make._ref == $makeId] | order(name asc)`;
        const result = await client.fetch(query, { makeId: selectedMake });
        setModels(result);
      } catch (err) {
        console.error("Failed to fetch vehicle models:", err);
      }
    };
    fetchModels();
  }, [selectedMake]);

  // NYTT: Hämta versioner baserat på vald modell
  useEffect(() => {
    if (!selectedModel) {
      setVersions([]);
      setSelectedVersion("");
      return;
    }
    const fetchVersions = async () => {
      try {
        const query = `*[_type == "vehicleVersion" && model._ref == $modelId] | order(name asc)`;
        const result = await client.fetch(query, { modelId: selectedModel });
        setVersions(result);
      } catch (err) {
        console.error("Failed to fetch vehicle versions:", err);
      }
    };
    fetchVersions();
  }, [selectedModel]);


  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const start = page * PRODUCTS_PER_PAGE;
      const end = start + PRODUCTS_PER_PAGE;
      
      const conditions = [`!defined(isArchived) || isArchived == false`];
      const params = {};

      if (searchTerm) {
        conditions.push(`(title match $searchTerm + "*" || sku match $searchTerm + "*")`);
        params.searchTerm = searchTerm;
      }
      
      if (selectedBrand) {
        conditions.push(`brand == $brand`);
        params.brand = selectedBrand;
      }
      
      // --- KORRIGERAD: Hierarkisk filtrering för fordon ---
      // Denna logik säkerställer att produkter visas på varje nivå (make, model, version)
      if (selectedVersion) {
        conditions.push(`references($versionId)`);
        params.versionId = selectedVersion;
      } else if (selectedModel) {
        conditions.push(`vehicleFitment[]._ref in *[_type=="vehicleVersion" && model._ref == $modelId]._id`);
        params.modelId = selectedModel;
      } else if (selectedMake) {
        conditions.push(`vehicleFitment[]._ref in *[_type=="vehicleVersion" && model.make._ref == $makeId]._id`);
        params.makeId = selectedMake;
      }
      
      const query = `
        *[_type == "product" && ${conditions.join(' && ')}] | order(${sortBy}) [${start}...${end}] {
          _id, title, sku, price, "imageUrl": mainImage.asset->url
        }`;
        
      const data = await client.fetch(query, params);
      
      // Ersätt produkterna vid ny sökning/filtrering
      setProducts(data);
      setHasMore(data.length === PRODUCTS_PER_PAGE);

    } catch (err) {
      setError(t("productList.loadError"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, sortBy, selectedMake, selectedModel, selectedVersion, selectedBrand, t]);

  // Anropa fetchProducts när något filter ändras
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Återställ till första sidan när ett filter ändras
  useEffect(() => {
    setPage(0);
  }, [searchTerm, sortBy, selectedMake, selectedModel, selectedVersion, selectedBrand]);

  const getDisplayPrice = (productPrice) => {
    if (user && user.discountPercentage > 0) {
      const discountedPrice = productPrice * (1 - user.discountPercentage / 100);
      return { original: Math.round(productPrice), discounted: Math.round(discountedPrice) };
    }
    return { original: Math.round(productPrice) };
  };

  return (
    <div className="p-4">
      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        {/* Gridden har nu 6 kolumner för att få plats med det nya filtret */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          {/* Sökfält */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">Fritextsök</label>
            <input id="search" type="text" placeholder="Namn eller art.nr..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="mt-1 w-full px-4 py-2 border rounded-md" />
          </div>
          {/* Tillverkare-filter */}
          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700">Tillverkare</label>
            <select id="brand" value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="mt-1 w-full px-4 py-2 border rounded-md bg-white">
              <option value="">Alla tillverkare</option>
              {brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
            </select>
          </div>
          {/* Bilmärke */}
          <div>
            <label htmlFor="make" className="block text-sm font-medium text-gray-700">Välj bilmärke</label>
            <select id="make" value={selectedMake} onChange={(e) => setSelectedMake(e.target.value)} className="mt-1 w-full px-4 py-2 border rounded-md bg-white">
              <option value="">Alla bilmärken</option>
              {makes.map(make => <option key={make._id} value={make._id}>{make.name}</option>)}
            </select>
          </div>
          {/* Bilmodell */}
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700">Välj modell</label>
            <select id="model" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} disabled={!selectedMake} className="mt-1 w-full px-4 py-2 border rounded-md bg-white disabled:bg-gray-200">
              <option value="">Alla modeller</option>
              {models.map(model => <option key={model._id} value={model._id}>{model.name}</option>)}
            </select>
          </div>
          {/* NYTT: Version-filter */}
          <div>
            <label htmlFor="version" className="block text-sm font-medium text-gray-700">Välj version</label>
            <select id="version" value={selectedVersion} onChange={(e) => setSelectedVersion(e.target.value)} disabled={!selectedModel} className="mt-1 w-full px-4 py-2 border rounded-md bg-white disabled:bg-gray-200">
              <option value="">Alla versioner</option>
              {versions.map(version => <option key={version._id} value={version._id}>{version.name}</option>)}
            </select>
          </div>
          {/* Sortering */}
          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700">Sortera efter</label>
            <select id="sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="mt-1 w-full px-4 py-2 border rounded-md bg-white">
              <option value="_createdAt desc">Nyast</option>
              <option value="title asc">Namn (A-Ö)</option>
              <option value="title desc">Namn (Ö-A)</option>
              <option value="price asc">Pris (Lågt till Högt)</option>
              <option value="price desc">Pris (Högt till Lågt)</option>
            </select>
          </div>
        </div>
      </div>
      
      <h1 className="text-4xl font-bold text-gray-800 mb-8">{t("productList.title")}</h1>

      {/* Din befintliga kod för att rendera produkter, laddningsstatus och paginering */}
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
