// ORDERAKFRONT/src/pages/Admin/AdminProductManagement.js
import React, { useState, useEffect, useCallback } from "react";
import { client } from "../../sanityClient";
import CollapsibleSection from "../../components/CollapsibleSection";
import * as XLSX from "xlsx"; 
import { useTranslation } from "react-i18next";
import { toast } from 'react-toastify'; 

function AdminProductManagement() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterText, setFilterText] = useState("");

  // --- State for various features ---

  // For adding a single product - Updated for multiple images
  const [newProduct, setNewProduct] = useState({
    title: "",
    sku: "",
    brand: "",
    description: "",
    price: "",
    category: "",
    galleryImages: [], // Using galleryImages to match Sanity schema
    additionalDescription: "", // New custom field example (ensure this is in Sanity schema if used)
  });

  // For bulk price adjustments
  const [priceAdjustmentValue, setPriceAdjustmentValue] = useState(0);
  const [priceAdjustmentType, setPriceAdjustmentType] = useState("percentage");
  const [priceAdjustmentBrand, setPriceAdjustmentBrand] = useState("");
  const [priceAdjustmentSearchTerm, setPriceAdjustmentSearchTerm] =
    useState("");

  // For CSV Upload and Field Mapping - Updated for custom fields
  const [csvFile, setCsvFile] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [fieldMapping, setFieldMapping] = useState({
    title: "",
    description: "",
    sku: "",
    brand: "",
    price: "",
    category: "",
    additionalDescription: "", // Added new custom field to mapping (example)
    // Add other standard fields you expect from CSV here and in your Sanity schema
  });
  const [showCsvMapping, setShowCsvMapping] = useState(false);
  const [csvUploadError, setCsvUploadError] = useState("");
  const [customCsvFields, setCustomCsvFields] = useState({}); // State to hold dynamically added custom fields from CSV

  // --- Data Fetching ---

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      // Updated query to fetch all image URLs from galleryImages
      const query = `*[_type == "product" && (!defined(isArchived) || isArchived == false)] | order(title asc){
        _id, title, price, category, brand, sku, description, additionalDescription,
        "galleryImageUrls": galleryImages[].asset->url // Fetch URLs for all images in galleryImages
      }`;
      const data = await client.fetch(query);
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError(t("productList.loadError"));
      toast.error(t("productList.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // --- Handlers for Product Actions ---

  const handleNewProductChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "galleryImages" && files) {
      // Handle multiple files for image upload
      setNewProduct((prev) => ({ ...prev, galleryImages: Array.from(files) }));
    } else {
      setNewProduct((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const { title, price, sku, galleryImages, ...otherFields } = newProduct; // Destructure galleryImages and other fields
    if (!title || !price || !sku || galleryImages.length === 0) { // Check if at least one image is selected
      toast.error(t("adminProductManagement.form.required"));
      return;
    }
    try {
      // Upload all selected images
      const imageAssets = await Promise.all(
        galleryImages.map(imageFile =>
          client.assets.upload("image", imageFile, {
            contentType: imageFile.type,
            filename: imageFile.name,
          })
        )
      );

      // Create references to the uploaded image assets for Sanity's galleryImages array
      const imageReferences = imageAssets.map(asset => ({
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
      }));

      const productDoc = {
        _type: "product",
        ...otherFields, // Includes brand, description, category, additionalDescription, etc.
        title: title,
        sku: sku,
        price: parseFloat(price),
        isArchived: false,
        galleryImages: imageReferences, // Store array of image references in galleryImages
      };

      await client.create(productDoc);
      toast.success(t("adminProductManagement.form.addSuccess"));
      document.getElementById("newProductForm").reset(); // Clear form
      setNewProduct({ // Reset state
        title: "",
        sku: "",
        brand: "",
        description: "",
        price: "",
        category: "",
        galleryImages: [], // Reset galleryImages array
        additionalDescription: "", // Reset new custom field
      });
      fetchProducts();
    } catch (error) {
      console.error("Failed to add product:", error);
      toast.error(t("adminProductManagement.form.addError"));
    }
  };

  const handleArchiveProduct = async (productId) => {
    if (window.confirm(t("adminProductManagement.form.archiveConfirm"))) {
      try {
        await client.patch(productId).set({ isArchived: true }).commit();
        toast.success(t("adminProductManagement.form.archiveSuccess"));
        fetchProducts(); // Refresh list
      } catch (err) {
        console.error("Failed to archive product:", err);
        toast.error(t("adminProductManagement.form.archiveError"));
      }
    }
  };

  // --- Handlers for Bulk Actions ---

  const handleCsvFileSelect = (event) => {
    setCsvUploadError("");
    const file = event.target.files[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
          header: 1,
        });

        if (json.length < 2) {
          throw new Error(
            t("adminProductManagement.bulkUpload.errorEmptyFile")
          );
        }
        const headers = json[0];
        setCsvHeaders(headers);
        setCsvData(json.slice(1));
        setShowCsvMapping(true);

        // Initialize customCsvFields based on headers that are not in default mapping
        // This is a basic guess; user will manually map
        const defaultMappedFields = Object.keys(fieldMapping);
        const newCustomFields = {};
        headers.forEach(header => {
          // Normalize header to be compared with fieldMapping keys
          const normalizedHeader = header.toLowerCase().replace(/\s/g, '');
          if (!defaultMappedFields.includes(normalizedHeader)) {
            newCustomFields[normalizedHeader] = ''; // Initially unmapped, use normalized as key
          }
        });
        setCustomCsvFields(newCustomFields);


      } catch (err) {
        setCsvUploadError(err.message);
        setCsvFile(null);
        setShowCsvMapping(false); // Hide mapping section on error
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleMappingChange = (field, csvHeader) => {
    setFieldMapping((prev) => ({ ...prev, [field]: csvHeader }));
  };

  // Handler for custom field mapping
  const handleCustomFieldMappingChange = (fieldKey, csvHeader) => {
    setCustomCsvFields((prev) => ({ ...prev, [fieldKey]: csvHeader }));
  };

  const handleAddCustomFieldForMapping = () => {
    const fieldName = prompt(t("adminProductManagement.bulkUpload.promptCustomFieldName"));
    if (fieldName) {
      // Normalize field name to be used as a Sanity field key (camelCase, no spaces)
      const normalizedFieldName = fieldName.toLowerCase().replace(/\s(.)/g, (match, group) => group.toUpperCase());
      if (Object.keys(fieldMapping).includes(normalizedFieldName) || Object.keys(customCsvFields).includes(normalizedFieldName)) {
        alert(t("adminProductManagement.bulkUpload.fieldNameExists"));
        return;
      }
      setCustomCsvFields((prev) => ({ ...prev, [normalizedFieldName]: "" }));
      // Remind user to update Sanity schema for this new field
      toast.info(t("adminProductManagement.bulkUpload.customFieldSchemaReminder", { fieldName: normalizedFieldName }));
    }
  };


  const handleConfirmBulkUpload = async () => {
    if (!fieldMapping.sku || !fieldMapping.title || !fieldMapping.price) {
      setCsvUploadError(
        t("adminProductManagement.bulkUpload.errorMappingRequired")
      );
      return;
    }

    setCsvUploadError("");

    try {
      const transaction = client.transaction();

      csvData.forEach((row) => {
        const product = { _type: "product", isArchived: false };

        // Map standard fields
        for (const field in fieldMapping) {
          const header = fieldMapping[field];
          if (header) {
            const index = csvHeaders.indexOf(header);
            if (index !== -1) {
              let value = row[index];
              if (field === "price") value = parseFloat(value);
              product[field] = value;
            }
          }
        }

        // Map custom fields
        for (const customFieldKey in customCsvFields) {
          const header = customCsvFields[customFieldKey];
          if (header) {
            const index = csvHeaders.indexOf(header);
            if (index !== -1) {
              product[customFieldKey] = row[index];
            }
          }
        }

        // ❌ Om SKU eller pris eller titel saknas – hoppa över raden
        if (!product.sku || !product.title || isNaN(product.price)) return;

        // ✅ Skapa ID från SKU
        const safeSku = String(product.sku).trim().replace(/\s+/g, "-"); // tar bort mellanslag
        product._id = `product-${safeSku}`;

        // Skapa eller ersätt
        transaction.createOrReplace(product);
      });

      await transaction.commit();
      toast.success(t("adminProductManagement.bulkUpload.uploadSuccess"));
      setShowCsvMapping(false);
      setCsvFile(null);
      setCsvHeaders([]);
      setCsvData([]);
      setFieldMapping({ // Reset mapping
        title: "",
        description: "",
        sku: "",
        brand: "",
        price: "",
        category: "",
        additionalDescription: "",
      });
      setCustomCsvFields({}); // Reset custom fields
      fetchProducts();
    } catch (error) {
      console.error("Bulk upload failed:", error);
      setCsvUploadError(t("adminProductManagement.bulkUpload.uploadError"));
      toast.error(t("adminProductManagement.bulkUpload.uploadError"));
    }
  };

  const handleBulkPriceAdjustment = async () => {
    if (!priceAdjustmentValue) {
      toast.warn(t("adminProductManagement.bulkPrice.alertValueMissing"));
      return;
    }
    const query = `*[_type == "product" && (!defined(isArchived) || isArchived == false)
      ${priceAdjustmentBrand ? `&& brand match "${priceAdjustmentBrand}*"` : ""}
      ${
        priceAdjustmentSearchTerm
          ? `&& (title match "${priceAdjustmentSearchTerm}*" || sku match "${priceAdjustmentSearchTerm}*")`
          : ""
      }
    ]`;
    try {
      const productsToAdjust = await client.fetch(query + "{_id, price}");
      if (productsToAdjust.length === 0) {
        toast.info(t("adminProductManagement.bulkPrice.alertNoMatch"));
        return;
      }
      const transaction = client.transaction();
      productsToAdjust.forEach((product) => {
        let newPrice =
          priceAdjustmentType === "percentage"
            ? product.price * (1 + priceAdjustmentValue / 100)
            : product.price + priceAdjustmentValue;
        transaction.patch(product._id).set({ price: Math.max(0, newPrice) }); // Ensure price doesn't go below 0
      });
      await transaction.commit();
      toast.success(
        t("adminProductManagement.bulkPrice.alertSuccess", {
          count: productsToAdjust.length,
        })
      );
      fetchProducts();
    } catch (error) {
      console.error("Bulk price adjustment failed:", error);
      toast.error(t("adminProductManagement.bulkPrice.alertError"));
    }
  };

  const handleDeleteAllUnreferencedProducts = async () => {
    if (window.confirm(t("adminProductManagement.dangerZone.confirm"))) {
      try {
        const query = `*[_type == "product" && !(_id in *[_type == "order"].items[].product._ref)]`;
        const unreferencedProducts = await client.fetch(query + "{_id}");
        if (unreferencedProducts.length === 0) {
          toast.info(t("adminProductManagement.dangerZone.noProductsToDelete"));
          return;
        }
        await client.delete({
          query: `*[_id in $ids]`,
          params: { ids: unreferencedProducts.map((p) => p._id) },
        });
        toast.success(
          t("adminProductManagement.dangerZone.deleteSuccess", {
            count: unreferencedProducts.length,
          })
        );
        fetchProducts();
      } catch (error) {
        console.error("Failed to delete products:", error);
        toast.error(t("adminProductManagement.dangerZone.deleteError"));
      }
    }
  };

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(filterText.toLowerCase())
  );

  if (loading)
    return <div className="text-center py-8">{t("common.loading")}</div>;
  if (error)
    return <div className="text-center text-red-500 py-8">{error}</div>;

  return (
    <div className="p-4 bg-white rounded-lg shadow-xl">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center border-b-2 border-red-200 pb-4">
        {t("adminProductManagement.title")}
      </h2>

      {/* --- UI Sections --- */}

      <CollapsibleSection title={t("adminProductManagement.addProductTitle")}>
        <form
          id="newProductForm"
          onSubmit={handleAddProduct}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("adminProductManagement.form.title")}:
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              onChange={handleNewProductChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("adminProductManagement.form.sku")}:
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sku"
                onChange={handleNewProductChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("adminProductManagement.form.brand")}:
              </label>
              <input
                type="text"
                name="brand"
                onChange={handleNewProductChange}
                className="mt-1 block w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("adminProductManagement.form.description")}:
            </label>
            <textarea
              name="description"
              onChange={handleNewProductChange}
              rows="3"
              className="mt-1 block w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>
          {/* New custom field input for `additionalDescription` */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("adminProductManagement.form.additionalDescription")}:
            </label>
            <textarea
              name="additionalDescription"
              onChange={handleNewProductChange}
              rows="3"
              className="mt-1 block w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("adminProductManagement.form.price")}:
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                step="0.01"
                onChange={handleNewProductChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("adminProductManagement.form.category")}:
              </label>
              <input
                type="text"
                name="category"
                onChange={handleNewProductChange}
                className="mt-1 block w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
         
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("adminProductManagement.form.images")}:
              <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              name="galleryImages" // Changed name to galleryImages to match Sanity schema
              accept="image/*"
              multiple // Allow multiple file selection
              onChange={handleNewProductChange}
              required
              className="mt-1 block w-full text-sm text-red-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-100 file:text-red-700 hover:file:bg-red-200"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
          >
            <i className="fas fa-plus-circle mr-2"></i>
            {t("adminProductManagement.addProductTitle")}
          </button>
        </form>
      </CollapsibleSection>

      <CollapsibleSection title={t("adminProductManagement.bulkUploadTitle")}>
        {!showCsvMapping ? (
          <div>
            <label
              htmlFor="csv-upload"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t("adminProductManagement.bulkUpload.selectFile")}
            </label>
            <input
              type="file"
              id="csv-upload"
              accept=".csv"
              onChange={handleCsvFileSelect}
              className="block w-full text-sm text-gray-600 file:mr-4 file:py-2.5 file:px-5 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-100 file:text-red-700 hover:file:bg-red-200"
            />
            {csvUploadError && (
              <p className="text-red-500 text-sm mt-3">{csvUploadError}</p>
            )}
          </div>
        ) : (
          <div className="mt-4">
            <h4 className="text-xl font-semibold text-gray-800 mb-4">
              {t("adminProductManagement.bulkUpload.mapTitle")}
            </h4>
            {csvUploadError && (
              <p className="text-red-500 text-sm mb-4">{csvUploadError}</p>
            )}
            <div className="space-y-4 mb-6">
              {/* Standard fields mapping */}
              {Object.keys(fieldMapping).map((field) => (
                <div key={field} className="flex items-center gap-4">
                  <label className="w-32 text-gray-700 font-medium capitalize">
                    {t(`adminProductManagement.form.${field}`)}{" "}
                    {["title", "sku", "price"].includes(field) && (
                      <span className="text-red-500">*</span>
                    )}{" "}
                    :
                  </label>
                  <select
                    value={fieldMapping[field]}
                    onChange={(e) => handleMappingChange(field, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white"
                  >
                    <option value="">
                      {t("adminProductManagement.bulkUpload.selectColumn")}
                    </option>
                    {csvHeaders.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              {/* Custom fields mapping */}
              {Object.keys(customCsvFields).length > 0 && (
                <h5 className="text-lg font-semibold text-gray-800 mt-6 mb-2">
                  {t("adminProductManagement.bulkUpload.customFieldsTitle")}
                </h5>
              )}
              {Object.keys(customCsvFields).map((field) => (
                <div key={`custom-${field}`} className="flex items-center gap-4">
                  <label className="w-32 text-gray-700 font-medium">
                    {field} : {/* Display normalized field name */}
                  </label>
                  <select
                    value={customCsvFields[field]}
                    onChange={(e) => handleCustomFieldMappingChange(field, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white"
                  >
                    <option value="">
                      {t("adminProductManagement.bulkUpload.selectColumn")}
                    </option>
                    {csvHeaders.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddCustomFieldForMapping}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {t("adminProductManagement.bulkUpload.addCustomFieldButton")}
              </button>
            </div>

            {csvData.length > 0 && (
              <div className="overflow-x-auto mt-6 border rounded-lg">
                <h5 className="text-lg font-semibold text-gray-800 mb-2 px-4 pt-4">
                  {t("adminProductManagement.bulkUpload.previewTitle", "Förhandsgranskning")}
                </h5>
                <table className="min-w-full table-auto text-sm text-left text-gray-700 border-t border-gray-200">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      {Object.keys(fieldMapping).map((field) => (
                        <th key={field} className="px-4 py-2 font-medium">
                          {t(`adminProductManagement.form.${field}`)}
                        </th>
                      ))}
                  
                      {Object.keys(customCsvFields).map((field) => (
                        <th key={`custom-header-${field}`} className="px-4 py-2 font-medium">
                          {field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 5).map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b">
                        {Object.keys(fieldMapping).map((field) => {
                          const header = fieldMapping[field];
                          const index = csvHeaders.indexOf(header);
                          return (
                            <td key={field} className="px-4 py-2">
                              {row[index] ?? ""}
                            </td>
                          );
                        })}
                     
                        {Object.keys(customCsvFields).map((field) => {
                          const header = customCsvFields[field];
                          const index = csvHeaders.indexOf(header);
                          return (
                            <td key={`custom-data-${field}`} className="px-4 py-2">
                              {row[index] ?? ""}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-gray-500 italic px-4 pb-4">
                  {t("adminProductManagement.bulkUpload.previewNote", "Visar max 5 rader")}
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button" 
                onClick={() => {
                  setShowCsvMapping(false);
                  setCsvFile(null);
                  setCsvHeaders([]);
                  setCsvData([]);
                  setFieldMapping({ 
                    title: "",
                    description: "",
                    sku: "",
                    brand: "",
                    price: "",
                    category: "",
                    additionalDescription: "",
                  });
                  setCustomCsvFields({}); 
                  setCsvUploadError("");
                }}
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button" 
                onClick={handleConfirmBulkUpload}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md"
              >
                <i className="fas fa-check-circle mr-2"></i>
                {t("adminProductManagement.bulkUpload.confirmButton")}
              </button>
            </div>
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title={t("adminProductManagement.bulkPriceAdjustTitle")}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("adminProductManagement.bulkPrice.adjustValue")}
            </label>
            <div className="flex items-center">
              <input
                type="number"
                value={priceAdjustmentValue}
                onChange={(e) =>
                  setPriceAdjustmentValue(parseFloat(e.target.value) || 0)
                }
                className="flex-1 px-4 py-2 border border-red-300 rounded-l-md focus:ring-red-500"
              />
              <select
                value={priceAdjustmentType}
                onChange={(e) => setPriceAdjustmentType(e.target.value)}
                className="px-4 py-2 border border-red-300 rounded-r-md bg-white border-l-0"
              >
                <option value="percentage">
                  {t("adminProductManagement.bulkPrice.percentage")}
                </option>
                <option value="fixed">
                  {t("adminProductManagement.bulkPrice.fixedAmount")}
                </option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("adminProductManagement.bulkPrice.filterBrand")}
            </label>
            <input
              type="text"
              value={priceAdjustmentBrand}
              onChange={(e) => setPriceAdjustmentBrand(e.target.value)}
              placeholder={t("common.optional")}
              className="mt-1 block w-full px-4 py-2 border border-red-300 rounded-md"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("adminProductManagement.bulkPrice.filterTerm")}
            </label>
            <input
              type="text"
              value={priceAdjustmentSearchTerm}
              onChange={(e) => setPriceAdjustmentSearchTerm(e.target.value)}
              placeholder={t("common.optional")}
              className="mt-1 block w-full px-4 py-2 border border-red-300 rounded-md"
            />
          </div>
          <div className="md:col-span-2 text-center">
            <button
              onClick={handleBulkPriceAdjustment}
              className="w-full md:w-1/2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg text-lg"
            >
              <i className="fas fa-percent mr-2"></i>
              {t("adminProductManagement.bulkPrice.applyButton")}
            </button>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title={t("adminProductManagement.dangerZoneTitle")}>
        <div className="text-center p-4 bg-red-100 border border-red-300 rounded-lg">
          <p className="text-gray-600 mb-4">
            {t("adminProductManagement.dangerZone.description")}
          </p>
          <button
            onClick={handleDeleteAllUnreferencedProducts}
            className="bg-red-800 hover:bg-red-900 text-white font-bold py-2 px-6 rounded-md"
          >
            {t("adminProductManagement.dangerZone.button")}
          </button>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title={t("adminProductManagement.activeProductsTitle", {
          count: filteredProducts.length,
        })}
      >
        <input
          type="text"
          placeholder={t("adminProductManagement.filterPlaceholder")}
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full px-3 py-2 mb-4 border border-red-300 rounded-md"
        />
        <div className="max-h-[600px] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-white p-4 rounded-md shadow-sm border border-red-100 flex flex-col"
              >
             
                <img
                  src={
                    product.galleryImageUrls && product.galleryImageUrls.length > 0
                      ? product.galleryImageUrls[0]
                      : "https://placehold.co/400x300?text=BILD%20KOMMER%20INKOM%20KORT"
                  }
                  alt={product.title}
                  className="w-full h-48 object-cover rounded-md mb-4 bg-gray-200"
                />
                <div className="flex-grow">
                  <h4 className="text-lg font-bold text-gray-800">
                    {product.title}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {t("common.skuLabel", { sku: product.sku })}
                  </p>
                  <p className="text-gray-600 font-semibold">
                    {t("common.priceFormatted", { price: product.price })}
                  </p>
                
                  {product.additionalDescription && (
                    <p className="text-sm text-gray-600 mt-2">
                      {product.additionalDescription}
                    </p>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={() => handleArchiveProduct(product._id)}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-md"
                  >
                    <i className="fas fa-archive mr-2"></i>
                    {t("adminProductManagement.productCard.archive")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}

export default AdminProductManagement;
