import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { client } from "../sanityClient";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";


function ProductList() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterText, setFilterText] = useState("");

  // Nya states för fordonsfilter
  const [allMakes, setAllMakes] = useState([]);
  const [allModels, setAllModels] = useState([]);
  const [allVersions, setAllVersions] = useState([]);

  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedVersion, setSelectedVersion] = useState("");

  const [availableModels, setAvailableModels] = useState([]);
  const [availableVersions, setAvailableVersions] = useState([]);

  // Funktion för att hämta produkter baserat på filter
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let productQuery = `*[_type == "product" && (!defined(isArchived) || isArchived == false)]`;
      let params = {};

      // Filtrera baserat på Märke, Modell, Version
      // Kontrollera om vehicleFitment innehåller en referens som matchar filtret
      if (selectedMake) {
        // Hämta alla modeller som hör till valt märke
        const modelsOfMake = allModels.filter(model => model.makeRef === selectedMake);
        const modelIdsOfMake = modelsOfMake.map(model => model._id);

        if (modelIdsOfMake.length > 0) {
            // Hämta alla versioner som hör till dessa modeller
            const versionsOfModels = allVersions.filter(version => modelIdsOfMake.includes(version.modelRef));
            const versionIdsOfModels = versionsOfModels.map(version => version._id);

            if (versionIdsOfModels.length > 0) {
                productQuery += ` && count(vehicleFitment[]->._id[@ in $versionIds]) > 0`;
                params.versionIds = versionIdsOfModels;
            } else {
                productQuery += ` && false`; // No versions for this make, show no products
            }
        } else {
            productQuery += ` && false`; // No models for this make, show no products
        }
      }

      if (selectedModel) {
        // Hämta alla versioner som hör till vald modell
        const versionsOfModel = allVersions.filter(version => version.modelRef === selectedModel);
        const versionIdsOfModel = versionsOfModel.map(version => version._id);

        if (versionIdsOfModel.length > 0) {
            productQuery += ` && count(vehicleFitment[]->._id[@ in $selectedModelVersionIds]) > 0`;
            params.selectedModelVersionIds = versionIdsOfModel;
        } else {
            productQuery += ` && false`; // No versions for this model, show no products
        }
      }

      if (selectedVersion) {
        productQuery += ` && $selectedVersionId in vehicleFitment[]._ref`;
        params.selectedVersionId = selectedVersion;
      }

      productQuery += ` | order(title asc){
        _id, title, price, "imageUrl": galleryImages[0].asset->url, sku, brand,
        vehicleFitment[]->{_id, name, model->{_id, name, make->{_id, name}}}
      }`;

      const data = await client.fetch(productQuery, params);
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError(t("productList.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t, selectedMake, selectedModel, selectedVersion, allModels, allVersions]); // Inkludera fordonsdata i beroenden

  // Funktion för att hämta alla fordonsfilterdata
  const fetchVehicleFilterData = useCallback(async () => {
    try {
      const makes = await client.fetch(`*[_type == "vehicleMake"]{_id, name}`);
      const models = await client.fetch(`*[_type == "vehicleModel"]{_id, name, make._ref}`);
      const versions = await client.fetch(`*[_type == "vehicleVersion"]{_id, name, model._ref}`);

      setAllMakes(makes);
      // Lagra modellerna med en referens till make för enklare filtrering
      setAllModels(models.map(m => ({ ...m, makeRef: m.make._ref })));
      // Lagra versionerna med en referens till modell för enklare filtrering
      setAllVersions(versions.map(v => ({ ...v, modelRef: v.model._ref })));
    } catch (err) {
      console.error("Failed to fetch vehicle filter data:", err);
    }
  }, []);

  useEffect(() => {
    fetchVehicleFilterData();
  }, [fetchVehicleFilterData]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]); // Körs när filterval ändras

  // Handlers för filterändringar
  const handleMakeChange = (e) => {
    const makeId = e.target.value;
    setSelectedMake(makeId);
    setSelectedModel(""); // Återställ modell och version
    setSelectedVersion("");

    if (makeId) {
      const modelsForSelectedMake = allModels.filter(model => model.makeRef === makeId);
      setAvailableModels(modelsForSelectedMake);
      setAvailableVersions([]); // Töm versioner tills modell väljs
    } else {
      setAvailableModels(allModels); // Visa alla modeller om inget märke valts
      setAvailableVersions(allVersions); // Visa alla versioner om inget märke valts
    }
  };

  const handleModelChange = (e) => {
    const modelId = e.target.value;
    setSelectedModel(modelId);
    setSelectedVersion(""); // Återställ version

    if (modelId) {
      const versionsForSelectedModel = allVersions.filter(version => version.modelRef === modelId);
      setAvailableVersions(versionsForSelectedModel);
    } else {
      setAvailableVersions(allVersions); // Visa alla versioner om ingen modell valts (inom valt märke)
    }
  };

  const handleVersionChange = (e) => {
    setSelectedVersion(e.target.value);
  };

  const handleResetFilters = () => {
    setSelectedMake("");
    setSelectedModel("");
    setSelectedVersion("");
    setAvailableModels(allModels); // Återställ till alla modeller
    setAvailableVersions(allVersions); // Återställ till alla versioner
  };


  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(filterText.toLowerCase())
  );

  if (loading)
    return <div className="text-center py-8">{t("common.loading")}</div>;
  if (error)
    return <div className="text-center text-red-500 py-8">{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">{t("productList.title")}</h1>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Sökfält */}
        <div className="md:col-span-1">
          <input
            type="text"
            placeholder={t("productList.searchPlaceholder")}
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
          />
        </div>

        {/* Märke filter */}
        <div className="md:col-span-1">
          <select
            value={selectedMake}
            onChange={handleMakeChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-red-500 focus:border-red-500"
          >
            <option value="">{t("productList.filterMake")}</option>
            {allMakes.map((make) => (
              <option key={make._id} value={make._id}>
                {make.name}
              </option>
            ))}
          </select>
        </div>

        {/* Modell filter */}
        <div className="md:col-span-1">
          <select
            value={selectedModel}
            onChange={handleModelChange}
            disabled={!selectedMake && allMakes.length > 0} // Inaktivera om inget märke valts och det finns märken
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-red-500 focus:border-red-500"
          >
            <option value="">{t("productList.filterModel")}</option>
            {availableModels.map((model) => (
              <option key={model._id} value={model._id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>

        {/* Version filter */}
        <div className="md:col-span-1">
          <select
            value={selectedVersion}
            onChange={handleVersionChange}
            disabled={!selectedModel && allModels.length > 0} // Inaktivera om ingen modell valts och det finns modeller
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-red-500 focus:border-red-500"
          >
            <option value="">{t("productList.filterVersion")}</option>
            {availableVersions.map((version) => (
              <option key={version._id} value={version._id}>
                {version.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mb-6 text-center">
        <button
          onClick={handleResetFilters}
          className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          {t("productList.resetFilters")}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.length === 0 ? (
          <p className="col-span-full text-center text-gray-500 py-8">
            {t("productList.noProductsFound")}
          </p>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product._id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col"
            >
              <img
                src={product.imageUrl || "https://placehold.co/600x400?text=Bild+saknas"}
                alt={product.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4 flex-grow">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  {product.title}
                </h2>
                <p className="text-gray-600 text-sm mb-1">
                  {t("common.skuLabel", { sku: product.sku })}
                </p>
                <p className="text-green-700 font-bold text-xl mb-3">
                  {t("common.priceFormatted", { price: product.price })}
                </p>
                {product.brand && (
                  <p className="text-sm text-gray-600">
                    {t("productList.brand")}: {product.brand}
                  </p>
                )}
                {product.vehicleFitment && product.vehicleFitment.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    <p className="font-semibold">{t("productList.fitsVehicles")}:</p>
                    <ul className="list-disc list-inside ml-2">
                      {product.vehicleFitment.map(fitment => (
                        <li key={fitment._id}>
                          {fitment.model?.make?.name} {fitment.model?.name} {fitment.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="p-4 bg-gray-50 border-t flex justify-end">
                <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors duration-200">
                  {t("productList.addToCart")}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ProductList;
