// ORDERAKFRONT/src/pages/Admin/AdminProductManagement.js
import React, { useState, useEffect, useCallback } from "react";
import { client } from "../../sanityClient";
import CollapsibleSection from "../../components/CollapsibleSection";
import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

// Helper to generate unique keys for pricing tiers
const generateKey = () =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);

// Initial state for pricing tiers when adding/editing supplier config
const initialPricingTiers = [
  { _key: generateKey(), priceFrom: 0, priceTo: 999, margin: 1.5 },
];

function AdminProductManagement() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterText, setFilterText] = useState("");
  const [existingBrands, setExistingBrands] = useState([]); // State for existing brands

  // --- State for various features ---

  // For adding a single product - Updated for multiple images and costPrice
  const [newProduct, setNewProduct] = useState({
    title: "",
    sku: "",
    brand: "", // Will be handled by custom brand selection logic
    description: "",
    price: "", // Selling price (if not calculated from costPrice)
    costPrice: "", // Cost price input
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

  // For CSV Upload and Field Mapping - Updated for custom fields and combined fields
  const [csvFile, setCsvFile] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [fieldMapping, setFieldMapping] = useState({
    // Each field now stores a template string (e.g., "{col1} {col2}")
    // The UI handles selecting single or combined columns via this string.
    title: "",
    description: "",
    sku: "",
    brand: "",
    price: "", // This will be the supplier's base price from CSV or final price if no costPrice
    costPrice: "", // Mappable cost price from CSV
    category: "",
    additionalDescription: "", // Custom field example
  });
  const [showCsvMapping, setShowCsvMapping] = useState(false);
  const [csvUploadError, setCsvUploadError] = useState("");
  const [customCsvFields, setCustomCsvFields] = useState({}); // Dynamically added custom fields from CSV

  // NEW: State for pricing tiers for CSV imports (similar to AdminSupplierManagement)
  const [csvPricingTiers, setCsvPricingTiers] = useState(initialPricingTiers);

  // --- Data Fetching ---

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      // Updated query to fetch all image URLs from galleryImages, and costPrice
      const query = `*[_type == "product" && (!defined(isArchived) || isArchived == false)] | order(title asc){
        _id, title, price, costPrice, category, brand, sku, description, additionalDescription,
        "galleryImageUrls": galleryImages[].asset->url // Fetch URLs for all images in galleryImages
      }`;
      const data = await client.fetch(query);
      setProducts(data);

      // Fetch existing brands for the dropdown (assuming 'brand' is a simple string field on products)
      const brandsQuery = `*[_type == "product" && defined(brand)].brand`;
      const brands = await client.fetch(brandsQuery);
      setExistingBrands([...new Set(brands)].filter(Boolean).sort()); // Get unique, non-empty brands
    } catch (err) {
      console.error("Failed to fetch products or brands:", err);
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
      setNewProduct((prev) => ({ ...prev, galleryImages: Array.from(files) }));
    } else {
      // Handle custom brand input
      if (
        name === "brand" &&
        e.target.type === "select-one" &&
        value === "custom"
      ) {
        // Do nothing, let the custom input field handle the actual value
        setNewProduct((prev) => ({ ...prev, brand: "custom" })); // Set flag for UI
      } else if (
        name === "brand" &&
        newProduct.brand === "custom" &&
        e.target.type === "text"
      ) {
        // If in custom mode, update the actual brand value
        setNewProduct((prev) => ({ ...prev, brand: value }));
      } else {
        setNewProduct((prev) => ({ ...prev, [name]: value }));
      }
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const { title, price, costPrice, sku, galleryImages, ...otherFields } =
      newProduct;
    if (!title || !price || !sku || galleryImages.length === 0) {
      toast.error(t("adminProductManagement.form.required"));
      return;
    }

    try {
      const imageAssets = await Promise.all(
        galleryImages.map((imageFile) =>
          client.assets.upload("image", imageFile, {
            contentType: imageFile.type,
            filename: imageFile.name,
          })
        )
      );

      const imageReferences = imageAssets.map((asset) => ({
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
      }));

      const productDoc = {
        _type: "product",
        ...otherFields,
        title: title,
        sku: sku,
        price: parseFloat(price),
        costPrice: parseFloat(costPrice) || null, // Include costPrice, set to null if not provided or invalid
        isArchived: false,
        galleryImages: imageReferences,
      };

      await client.create(productDoc);
      toast.success(t("adminProductManagement.form.addSuccess"));
      document.getElementById("newProductForm").reset(); // Clear form
      setNewProduct({
        // Reset state
        title: "",
        sku: "",
        brand: "",
        description: "",
        price: "",
        costPrice: "",
        category: "",
        galleryImages: [],
        additionalDescription: "",
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
        fetchProducts();
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

        // Reset fieldMapping to initial empty templates
        setFieldMapping({
          title: "",
          description: "",
          sku: "",
          brand: "",
          price: "",
          costPrice: "",
          category: "",
          additionalDescription: "",
        });
        setCustomCsvFields({}); // Reset custom fields
        setCsvPricingTiers(initialPricingTiers); // Reset pricing tiers
        setCsvUploadError("");
      } catch (err) {
        setCsvUploadError(err.message);
        setCsvFile(null);
        setShowCsvMapping(false); // Hide mapping section on error
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Generic handler for all field mapping (now uses template strings)
  const handleFieldMappingChange = (field, value) => {
    setFieldMapping((prev) => ({ ...prev, [field]: value }));
  };

  const handleCustomFieldMappingChange = (fieldKey, csvHeader) => {
    setCustomCsvFields((prev) => ({ ...prev, [fieldKey]: csvHeader }));
  };

  const handleAddCustomFieldForMapping = () => {
    const fieldName = prompt(
      t("adminProductManagement.bulkUpload.promptCustomFieldName")
    );
    if (fieldName) {
      const normalizedFieldName = fieldName
        .toLowerCase()
        .replace(/\s(.)/g, (match, group) => group.toUpperCase());
      if (
        Object.keys(fieldMapping).includes(normalizedFieldName) ||
        Object.keys(customCsvFields).includes(normalizedFieldName)
      ) {
        alert(t("adminProductManagement.bulkUpload.fieldNameExists"));
        return;
      }
      setCustomCsvFields((prev) => ({ ...prev, [normalizedFieldName]: "" })); // Store as empty string for template input
      toast.info(
        t("adminProductManagement.bulkUpload.customFieldSchemaReminder", {
          fieldName: normalizedFieldName,
        })
      );
    }
  };

  // Handlers for CSV Pricing Tiers
  const handleCsvTierChange = (index, field, value) => {
    const updatedTiers = [...csvPricingTiers];
    updatedTiers[index][field] = value === "" ? null : parseFloat(value) || 0;
    setCsvPricingTiers(updatedTiers);
  };

  const addCsvTier = () => {
    setCsvPricingTiers((prev) => [
      ...prev,
      { _key: generateKey(), priceFrom: null, priceTo: null, margin: 1.0 },
    ]);
  };

  const removeCsvTier = (index) => {
    setCsvPricingTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const parseTemplate = (templateString, row, headers) => {
    if (!templateString) return "";
    return templateString.replace(/{([^{}]+)}/g, (match, placeholder) => {
      const key = placeholder.trim();
      const index = headers.indexOf(key);
      return index !== -1 && row[index] !== undefined ? String(row[index]) : "";
    });
  };

  const handleConfirmBulkUpload = async () => {
    // Validate required fields (title, sku, price, or costPrice for price calc)
    let validationError = false;
    // Check if title and sku are mapped via template string
    if (!fieldMapping.title || !fieldMapping.sku) {
      validationError = true;
    }

    // Check if price OR costPrice is mapped for price validation
    if (!fieldMapping.price && !fieldMapping.costPrice) {
      validationError = true; // Neither price nor costPrice is mapped
    }

    if (validationError) {
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

        // Process all mapped fields using the template parser
        for (const field in fieldMapping) {
          if (fieldMapping[field]) {
            // Only process if a template is provided
            let value = parseTemplate(fieldMapping[field], row, csvHeaders);

            // Special handling for numbers (price, costPrice)
            if (["price", "costPrice"].includes(field)) {
              value = parseFloat(value);
              if (isNaN(value)) value = null; // Set to null if not a valid number
            }
            product[field] = value;
          }
        }

        // Process custom mapped fields
        for (const customFieldKey in customCsvFields) {
          if (customCsvFields[customFieldKey]) {
            product[customFieldKey] = parseTemplate(
              customCsvFields[customFieldKey],
              row,
              csvHeaders
            );
          }
        }

        let finalSellingPrice = product.price; // Start with mapped price or null

        // Apply tiered margin rule if costPrice is available and tiers are defined
        if (
          product.costPrice !== undefined &&
          product.costPrice !== null &&
          !isNaN(product.costPrice) &&
          csvPricingTiers.length > 0
        ) {
          const applicableTier = csvPricingTiers.find((tier) => {
            const priceFrom = tier.priceFrom ?? -Infinity; // Use -Infinity for null priceFrom
            const priceTo = tier.priceTo ?? Infinity; // Use Infinity for null priceTo
            return (
              product.costPrice >= priceFrom && product.costPrice < priceTo
            );
          });
          if (applicableTier) {
            finalSellingPrice = product.costPrice * applicableTier.margin;
          } else {
            // If no tier matches, use costPrice directly as selling price, or fall back to mapped price if that makes sense
            finalSellingPrice = product.costPrice;
            toast.warn(
              `No pricing tier matched for costPrice ${product.costPrice}. Using costPrice as selling price.`,
              { toastId: "noTierMatch" }
            );
          }
        } else if (
          product.costPrice === null ||
          (isNaN(product.costPrice) && fieldMapping.price === "")
        ) {
          // If costPrice is not valid and price is not mapped, product is invalid
          console.warn(
            `Product SKU ${product.sku} has invalid costPrice and price is not mapped. Skipping.`
          );
          return; // Skip product if no valid price source
        }

        product.price = Math.round(finalSellingPrice || 0); // Ensure final price is rounded and not null/NaN

        // ❌ Final validation check before transaction
        if (
          !product.sku ||
          !product.title ||
          isNaN(product.price) ||
          product.price < 0
        ) {
          console.warn(
            `Skipping product due to missing/invalid required fields: SKU=${product.sku}, Title=${product.title}, Price=${product.price}`
          );
          return;
        }

        // ✅ Create unique ID (UUID) for each product to allow duplicate SKUs in Sanity
        // This is only if you have removed options: {isUnique: true} from your SKU in Sanity schema.
        // If SKU should remain unique in Sanity, keep the previous product._id = `product-${safeSku}` logic
        // and Sanity's constraint will handle uniqueness.
        product._id = uuidv4(); // Generate a new unique ID for each product

        // Skapa eller ersätt
        transaction.createOrReplace(product);
      });

      await transaction.commit();
      toast.success(t("adminProductManagement.bulkUpload.uploadSuccess"));
      setShowCsvMapping(false);
      setCsvFile(null);
      setCsvHeaders([]);
      setCsvData([]);
      setFieldMapping({
        // Reset mapping
        title: "",
        description: "",
        sku: "",
        brand: "",
        price: "",
        costPrice: "",
        category: "",
        additionalDescription: "",
      });
      setCustomCsvFields({}); // Reset custom fields
      setCsvPricingTiers(initialPricingTiers); // Reset pricing tiers
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

  // Configuration for mappable fields (used in CSV mapping UI)
  const mappableFieldsConfig = [
    {
      key: "title",
      label: t("adminProductManagement.form.title"),
      required: true,
    },
    {
      key: "description",
      label: t("adminProductManagement.form.description"),
      required: false,
    },
    { key: "sku", label: t("adminProductManagement.form.sku"), required: true },
    {
      key: "brand",
      label: t("adminProductManagement.form.brand"),
      required: false,
    },
    {
      key: "costPrice",
      label: t("adminProductManagement.form.costPrice"),
      required: false,
      notes: t("adminProductManagement.bulkUpload.costPriceNotes"),
    },
    {
      key: "price",
      label: t("adminProductManagement.form.price"),
      required: true,
      notes: t("adminProductManagement.bulkUpload.priceNotes"),
    },
    {
      key: "category",
      label: t("adminProductManagement.form.category"),
      required: false,
    },
    {
      key: "additionalDescription",
      label: t("adminProductManagement.form.additionalDescription"),
      required: false,
    },
  ];

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
              value={newProduct.title} // Controlled input
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
                value={newProduct.sku} // Controlled input
                onChange={handleNewProductChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("adminProductManagement.form.brand")}:
              </label>
              <select
                name="brand"
                value={newProduct.brand}
                onChange={handleNewProductChange}
                className="mt-1 block w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              >
                <option value="">
                  {t("adminProductManagement.form.selectBrand")}
                </option>
                {existingBrands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
                <option value="custom">
                  {t("adminProductManagement.form.customBrand")}
                </option>
              </select>
              {newProduct.brand === "custom" && (
                <input
                  type="text"
                  name="brand"
                  value={newProduct.brand !== "custom" ? newProduct.brand : ""} // Clear if switched to custom
                  onChange={handleNewProductChange}
                  placeholder={t(
                    "adminProductManagement.form.enterCustomBrand"
                  )}
                  className="mt-1 block w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("adminProductManagement.form.description")}:
            </label>
            <textarea
              name="description"
              value={newProduct.description} // Controlled input
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
              value={newProduct.additionalDescription} // Controlled input
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
                value={newProduct.price} // Controlled input
                onChange={handleNewProductChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
            </div>
            {/* NEW: Cost Price input */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("adminProductManagement.form.costPrice")}:
              </label>
              <input
                type="number"
                name="costPrice"
                step="0.01"
                value={newProduct.costPrice} // Controlled input
                onChange={handleNewProductChange}
                className="mt-1 block w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
            </div>
            {/* End NEW: Cost Price input */}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("adminProductManagement.form.category")}:
            </label>
            <input
              type="text"
              name="category"
              value={newProduct.category} // Controlled input
              onChange={handleNewProductChange}
              className="mt-1 block w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>
          {/* Updated image input for multiple files to match galleryImages */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("adminProductManagement.form.images")}:{" "}
              {/* Changed text to plural */}
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
              {/* Price Tiers & Margins Section */}
              <fieldset className="border p-4 rounded-md bg-green-50">
                <legend className="text-lg font-semibold px-2 text-green-800">
                  {t("adminProductManagement.bulkUpload.pricingTiersTitle")}
                </legend>
                <div className="space-y-2">
                  {(csvPricingTiers || []).map((tier, index) => (
                    <div
                      key={tier._key}
                      className="flex flex-wrap items-center gap-2 p-2 bg-white rounded-md shadow-sm"
                    >
                      <span className="font-medium text-gray-700">
                        {t("adminProductManagement.bulkUpload.priceFrom")}:
                      </span>
                      <input
                        type="number"
                        value={tier.priceFrom ?? ""}
                        onChange={(e) =>
                          handleCsvTierChange(
                            index,
                            "priceFrom",
                            e.target.value
                          )
                        }
                        className="w-24 px-2 py-1 border rounded-md"
                      />
                      <span className="font-medium text-gray-700">
                        {t("adminProductManagement.bulkUpload.priceTo")}:
                      </span>
                      <input
                        type="number"
                        placeholder={t(
                          "adminProductManagement.bulkUpload.priceToPlaceholder"
                        )}
                        value={tier.priceTo ?? ""}
                        onChange={(e) =>
                          handleCsvTierChange(index, "priceTo", e.target.value)
                        }
                        className="w-24 px-2 py-1 border rounded-md"
                      />
                      <span className="font-medium text-gray-700">
                        {t("adminProductManagement.bulkUpload.margin")}:
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={tier.margin ?? ""}
                        onChange={(e) =>
                          handleCsvTierChange(index, "margin", e.target.value)
                        }
                        className="w-24 px-2 py-1 border rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeCsvTier(index)}
                        className="px-2 py-1 bg-red-500 text-white rounded-md text-xs ml-auto"
                      >
                        {t("common.remove")}
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addCsvTier}
                  className="mt-4 px-3 py-1 bg-green-600 text-white rounded-md text-sm"
                >
                  {t("adminProductManagement.bulkUpload.addTier")}
                </button>
                <p className="text-sm text-gray-600 mt-2">
                  {t("adminProductManagement.bulkUpload.tierNotes")}
                </p>
              </fieldset>
              {/* End Price Tiers & Margins Section */}

              {/* Mappable Fields Loop (now with template string inputs) */}
              {mappableFieldsConfig.map((fieldConfig) => (
                <div key={fieldConfig.key} className="flex items-start gap-4">
                  <label className="w-32 text-gray-700 font-medium capitalize pt-2">
                    {fieldConfig.label}
                    {fieldConfig.required && (
                      <span className="text-red-500">*</span>
                    )}{" "}
                    :
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder={t(
                        "adminProductManagement.bulkUpload.templatePlaceholder"
                      )}
                      value={fieldMapping[fieldConfig.key]}
                      onChange={(e) =>
                        handleFieldMappingChange(
                          fieldConfig.key,
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    />
                    {fieldConfig.notes && (
                      <p className="text-sm text-gray-500 italic mt-1">
                        {fieldConfig.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Custom fields mapping section (uses template strings too) */}
              {Object.keys(customCsvFields).length > 0 && (
                <h5 className="text-lg font-semibold text-gray-800 mt-6 mb-2">
                  {t("adminProductManagement.bulkUpload.customFieldsTitle")}
                </h5>
              )}
              {Object.keys(customCsvFields).map((field) => (
                <div
                  key={`custom-${field}`}
                  className="flex items-center gap-4"
                >
                  <label className="w-32 text-gray-700 font-medium">
                    {field} : {/* Display normalized field name */}
                  </label>
                  <input
                    type="text"
                    placeholder={t(
                      "adminProductManagement.bulkUpload.templatePlaceholder"
                    )}
                    value={customCsvFields[field]}
                    onChange={(e) =>
                      handleCustomFieldMappingChange(field, e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  />
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
                  {t(
                    "adminProductManagement.bulkUpload.previewTitle",
                    "Förhandsgranskning"
                  )}
                </h5>
                <table className="min-w-full table-auto text-sm text-left text-gray-700 border-t border-gray-200">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      {mappableFieldsConfig.map((fieldConfig) => (
                        <th
                          key={fieldConfig.key}
                          className="px-4 py-2 font-medium"
                        >
                          {fieldConfig.label}
                        </th>
                      ))}
                      {Object.keys(customCsvFields).map((field) => (
                        <th
                          key={`custom-header-${field}`}
                          className="px-4 py-2 font-medium"
                        >
                          {field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 5).map((row, rowIndex) => {
                      const rowData = {};
                      mappableFieldsConfig.forEach((fieldConfig) => {
                        rowData[fieldConfig.key] = parseTemplate(
                          fieldMapping[fieldConfig.key],
                          row,
                          csvHeaders
                        );
                        // Convert price/costPrice to number for preview
                        if (["price", "costPrice"].includes(fieldConfig.key)) {
                          rowData[fieldConfig.key] = parseFloat(
                            rowData[fieldConfig.key]
                          );
                          if (isNaN(rowData[fieldConfig.key]))
                            rowData[fieldConfig.key] = "";
                        }
                      });
                      Object.keys(customCsvFields).forEach((customFieldKey) => {
                        rowData[customFieldKey] = parseTemplate(
                          customCsvFields[customFieldKey],
                          row,
                          csvHeaders
                        );
                      });

                      // Calculate preview selling price if costPrice is available
                      let previewSellingPrice = rowData.price; // Default to mapped price
                      if (
                        rowData.costPrice !== "" &&
                        rowData.costPrice !== null &&
                        !isNaN(rowData.costPrice) &&
                        csvPricingTiers.length > 0
                      ) {
                        const applicableTier = csvPricingTiers.find((tier) => {
                          const priceFrom = tier.priceFrom ?? -Infinity;
                          const priceTo = tier.priceTo ?? Infinity;
                          return (
                            rowData.costPrice >= priceFrom &&
                            rowData.costPrice < priceTo
                          );
                        });
                        if (applicableTier) {
                          previewSellingPrice =
                            rowData.costPrice * applicableTier.margin;
                        } else {
                          previewSellingPrice = rowData.costPrice; // Fallback if no tier matches
                        }
                      }
                      rowData.price = Math.round(previewSellingPrice || 0);

                      return (
                        <tr key={rowIndex} className="border-b">
                          {mappableFieldsConfig.map((fieldConfig) => (
                            <td key={fieldConfig.key} className="px-4 py-2">
                              {rowData[fieldConfig.key] ?? ""}
                            </td>
                          ))}
                          {Object.keys(customCsvFields).map(
                            (customFieldKey) => (
                              <td
                                key={`custom-data-${customFieldKey}`}
                                className="px-4 py-2"
                              >
                                {rowData[customFieldKey] ?? ""}
                              </td>
                            )
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="text-xs text-gray-500 italic px-4 pb-4">
                  {t(
                    "adminProductManagement.bulkUpload.previewNote",
                    "Visar max 5 rader"
                  )}
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
                    // Reset mapping
                    title: "",
                    description: "",
                    sku: "",
                    brand: "",
                    price: "",
                    costPrice: "",
                    category: "",
                    additionalDescription: "",
                  });
                  setCustomCsvFields({}); // Reset custom fields
                  setCsvPricingTiers(initialPricingTiers); // Reset pricing tiers
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
                {/* Display the first image from galleryImages if available, or a placeholder */}
                <img
                  src={
                    product.galleryImageUrls &&
                    product.galleryImageUrls.length > 0
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
                    {product.costPrice !== null &&
                      product.costPrice !== undefined && (
                        <span className="text-gray-500 text-xs ml-2">
                          ({t("adminProductManagement.form.costPrice")}:{" "}
                          {product.costPrice} kr)
                        </span>
                      )}
                  </p>
                  {/* Display brand */}
                  {product.brand && (
                    <p className="text-sm text-gray-600 mt-1">
                      {t("adminProductManagement.form.brand")}: {product.brand}
                    </p>
                  )}
                  {/* Display additionalDescription if it exists */}
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
