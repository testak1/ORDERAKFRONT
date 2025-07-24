// ORDERAKFRONT/src/pages/ProductList.js
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { client } from "../sanityClient";
import { useCart } from "../context/CartContext"; // Används för applyDiscount
import { useAuth } from "../context/AuthContext"; // Används för att få användaren till applyDiscount
import { useTranslation } from "react-i18next";

const PRODUCTS_PER_PAGE = 20;

function ProductList() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();
  const { user } = useAuth(); // Hämta användaren
  const { applyDiscount } = useCart(); // Hämta applyDiscount från CartContext

  // --- STATE ---
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("_createdAt desc");

  // Fordonsfilter
  const [allMakes, setAllMakes] = useState([]); // Alla märken från Sanity
  const [allModels, setAllModels] = useState([]); // Alla modeller från Sanity
  const [allVersions, setAllVersions] = useState([]); // Alla versioner från Sanity

  const [selectedMakeId, setSelectedMakeId] = useState(""); // Vald Märke-ID
  const [selectedModelId, setSelectedModelId] = useState(""); // Vald Modell-ID
  const [selectedVersionId, setSelectedVersionId] = useState(""); // Vald Version-ID

  const [availableModelsForSelect, setAvailableModelsForSelect] = useState([]); // Modeller att visa i dropdown för vald märke
  const [availableVersionsForSelect, setAvailableVersionsForSelect] = useState([]); // Versioner att visa i dropdown för vald modell

  // Tillverkare-filter (produktens 'brand' fält)
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("");

  // Hämta alla filterdata (märken, modeller, versioner, tillverkare) vid laddning
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const makesResult = await client.fetch(`*[_type == "vehicleMake"] | order(name asc) {_id, name}`);
        const modelsResult = await client.fetch(`*[_type == "vehicleModel"] | order(name asc) {_id, name, "makeRef": make._ref}`);
        const versionsResult = await client.fetch(`*[_type == "vehicleVersion"] | order(name asc) {_id, name, "modelRef": model._ref}`);

        setAllMakes(makesResult);
        setAllModels(modelsResult);
        setAllVersions(versionsResult);

        // Sätt initiala tillgängliga modeller/versioner till alla
        setAvailableModelsForSelect(modelsResult);
        setAvailableVersionsForSelect(versionsResult);

        // Hämta alla unika produkttillverkare (brand)
        const brandsQuery = `*[_type == "product" && defined(brand)].brand`;
        const brandsResult = await client.fetch(brandsQuery);
        setBrands([...new Set(brandsResult)].filter(Boolean).sort()); // Unika, icke-tomma, sorterade
      } catch (err) {
        console.error("Failed to fetch filter data:", err);
        setError(t("productList.loadError"));
      }
    };
    fetchFilterData();
  }, [t]);

  // Funktion för att hämta produkter baserat på filter
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
        conditions.push(`brand == $selectedBrand`);
        params.selectedBrand = selectedBrand;
      }

      // Filter baserat på vehicleFitment (ID-baserade referenser)
      let currentFitmentFilter = '';
      if (selectedMakeId || selectedModelId || selectedVersionId) {
        currentFitmentFilter = `&& defined(vehicleFitment)`; // Se till att fältet finns

        if (selectedMakeId) {
          currentFitmentFilter += ` && $selectedMakeId in vehicleFitment[]->model->make._ref`;
          params.selectedMakeId = selectedMakeId;
        }
        if (selectedModelId) {
          currentFitmentFilter += ` && $selectedModelId in vehicleFitment[]->model._ref`;
          params.selectedModelId = selectedModelId;
        }
        if (selectedVersionId) {
          currentFitmentFilter += ` && $selectedVersionId in vehicleFitment[]._ref`;
          params.selectedVersionId = selectedVersionId;
        }
        conditions.push(currentFitmentFilter.substring(3)); // Lägg till utan första ' && '
      }


      const query = `
        *[_type == "product" && ${conditions.join(' && ')}] | order(${sortBy}) [${start}...${end}] {
          _id, title, sku, price, brand, // Hämta även brand här för rabattberäkning
          "imageUrl": galleryImages[0].asset->url, // Första bilden från galleryImages
          vehicleFitment[]->{_id, name, model->{_id, name, make->{_id, name}}} // Hämta passningsdetaljer för visning
        }`;

      const data = await client.fetch(query, params);
      setProducts(data);
      setHasMore(data.length === PRODUCTS_PER_PAGE);

    } catch (err) {
      setError(t("productList.loadError"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, sortBy, selectedMakeId, selectedModelId, selectedVersionId, selectedBrand, t]);

  // Hämta produkter när filter eller sökterm ändras
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProducts();
    }, 300); // Debounce för sökfält
    return () => clearTimeout(handler);
  }, [fetchProducts, searchTerm]); // Kör även när searchTerm ändras direkt

  useEffect(() => {
    // Återställ sidnummer vid filterändringar
    setPage(0);
  }, [searchTerm, sortBy, selectedMakeId, selectedModelId, selectedVersionId, selectedBrand]);


  // --- Handlers för Fordonsfilter ---
  const handleMakeChange = (e) => {
    const makeId = e.target.value;
    setSelectedMakeId(makeId);
    setSelectedModelId(""); // Återställ modell och version vid märkesbyte
    setSelectedVersionId("");

    if (makeId) {
      const modelsForSelectedMake = allModels.filter(model => model.makeRef === makeId);
      setAvailableModelsForSelect(modelsForSelectedMake);
      setAvailableVersionsForSelect([]); // Töm versioner tills modell väljs
    } else {
      // Om "Alla bilmärken" väljs, visa alla modeller och versioner igen
      setAvailableModelsForSelect(allModels);
      setAvailableVersionsForSelect(allVersions);
    }
  };

  const handleModelChange = (e) => {
    const modelId = e.target.value;
    setSelectedModelId(modelId);
    setSelectedVersionId(""); // Återställ version vid modellbyte

    if (modelId) {
      const versionsForSelectedModel = allVersions.filter(version => version.modelRef === modelId);
      setAvailableVersionsForSelect(versionsForSelectedModel);
    } else {
      // Om "Alla modeller" väljs (inom ett märke), visa alla versioner för det märket
      // Eller alla versioner om inget märke är valt
      if (selectedMakeId) {
        const modelsOfMake = allModels.filter(model => model.makeRef === selectedMakeId);
        const versionIdsForMake = allVersions.filter(version => modelsOfMake.some(m => m._id === version.modelRef));
        setAvailableVersionsForSelect(versionIdsForMake);
      } else {
        setAvailableVersionsForSelect(allVersions);
      }
    }
  };

  const handleVersionChange = (e) => {
    setSelectedVersionId(e.target.value);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedBrand("");
    setSelectedMakeId("");
    setSelectedModelId("");
    setSelectedVersionId("");
    setAvailableModelsForSelect(allModels); // Återställ till alla modeller
    setAvailableVersionsForSelect(allVersions); // Återställ till alla versioner
  };


  // Funktion för att visa pris med eventuell rabatt
  const getDisplayPrice = useCallback((productPrice, productBrand) => {
    // applyDiscount funktionen från CartContext hanterar redan användarens rabatter (generella & märkesspecifika)
    const finalPrice = applyDiscount(productPrice, productBrand);

    if (finalPrice < productPrice) {
      return { original: Math.round(productPrice), discounted: Math.round(finalPrice) };
    }
    return { original: Math.round(productPrice) };
  }, [applyDiscount]); // Beroende av applyDiscount

  const filteredProducts = products; // Produkter är redan filtrerade via Sanity-frågan

  if (loading)
    return <div className="text-center py-8">{t("common.loading")}</div>;
  if (error)
    return <div className="text-center text-red-500 py-8">{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">{t("productList.title")}</h1>

      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        {/* Nya filter layouten */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          {/* Sökfält */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">{t("productList.searchLabel")}</label>
            <input id="search" type="text" placeholder={t("productList.searchPlaceholder")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="mt-1 w-full px-4 py-2 border rounded-md" />
          </div>
          {/* Tillverkare-filter */}
          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700">{t("productList.filterBrand")}</label>
            <select id="brand" value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="mt-1 w-full px-4 py-2 border rounded-md bg-white">
              <option value="">{t("productList.allBrands")}</option>
              {brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
            </select>
          </div>
          {/* Bilmärke filter */}
          <div>
            <label htmlFor="make" className="block text-sm font-medium text-gray-700">{t("productList.filterMake")}</label>
            <select id="make" value={selectedMakeId} onChange={handleMakeChange} className="mt-1 w-full px-4 py-2 border rounded-md bg-white">
              <option value="">{t("productList.allMakes")}</option>
              {allMakes.map(make => <option key={make._id} value={make._id}>{make.name}</option>)}
            </select>
          </div>
          {/* Bilmodell filter */}
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700">{t("productList.filterModel")}</label>
            <select id="model" value={selectedModelId} onChange={handleModelChange} disabled={!selectedMakeId} className="mt-1 w-full px-4 py-2 border rounded-md bg-white disabled:bg-gray-200">
              <option value="">{t("productList.allModels")}</option>
              {availableModelsForSelect.map(model => (
                <option key={model._id} value={model._id}>{model.name}</option>
              ))}
            </select>
          </div>
          {/* Bilversion filter */}
          <div>
            <label htmlFor="version" className="block text-sm font-medium text-gray-700">{t("productList.filterVersion")}</label>
            <select id="version" value={selectedVersionId} onChange={handleVersionChange} disabled={!selectedModelId} className="mt-1 w-full px-4 py-2 border rounded-md bg-white disabled:bg-gray-200">
              <option value="">{t("productList.allVersions")}</option>
              {availableVersionsForSelect.map(version => (
                <option key={version._id} value={version._id}>{version.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 text-center">
          <button
            onClick={handleResetFilters}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            {t("productList.resetFilters")}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">{t("common.loading")}</div>
      ) : error ? (
        <div className="text-red-500 text-center py-10">{error}</div>
      ) : products.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <h3 className="text-xl font-semibold">{t("productList.noProductsFound")}</h3>
          <p>{t("productList.adjustFilters")}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              // Lägg till defensiva kontroller för produktdata
              if (!product || typeof product !== 'object' || !product._id) {
                console.warn("Skipping malformed product entry:", product);
                return null;
              }

              const imageUrl = typeof product.imageUrl === 'string' ? product.imageUrl : "https://placehold.co/400x300?text=BILD+SAKNAS";
              const title = typeof product.title === 'string' ? product.title : 'No Title';
              const sku = typeof product.sku === 'string' ? product.sku : 'N/A';
              const brand = typeof product.brand === 'string' ? product.brand : undefined; // Brand kan vara valfritt

              const displayPrice = getDisplayPrice(product.price, brand); // Passera produktens märke

              return (
                <div key={product._id} className="bg-white rounded-lg shadow-lg flex flex-col">
                  <Link to={`/products/${product._id}`} className="flex flex-col flex-grow">
                    <img
                      src={imageUrl}
                      alt={title}
                      className="w-full h-56 object-cover bg-gray-200"
                    />
                    <div className="p-4 flex flex-col flex-grow">
                      <h2 className="text-xl font-semibold text-gray-900 flex-grow">{title}</h2>
                      <p className="text-xs text-gray-500 mt-2">{t("common.skuLabel", { sku: sku })}</p>
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
              {t("common.previous")}
            </button>
            <span className="text-gray-700">{t("common.page", { page: page + 1 })}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("common.next")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ProductList;
