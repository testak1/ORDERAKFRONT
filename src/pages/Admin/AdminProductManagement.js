import React, { useState, useEffect } from "react";
import { client } from "../../sanityClient";
import CollapsibleSection from "../../components/CollapsibleSection";
import * as XLSX from "xlsx"; // For CSV import

function AdminProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterText, setFilterText] = useState("");

  // --- State for various features ---

  // For adding a single product
  const [newProduct, setNewProduct] = useState({
    title: "",
    sku: "",
    brand: "",
    description: "",
    price: "",
    category: "",
    mainImage: null,
  });

  // For bulk price adjustments
  const [priceAdjustmentValue, setPriceAdjustmentValue] = useState(0);
  const [priceAdjustmentType, setPriceAdjustmentType] = useState("percentage");
  const [priceAdjustmentBrand, setPriceAdjustmentBrand] = useState("");
  const [priceAdjustmentSearchTerm, setPriceAdjustmentSearchTerm] =
    useState("");

  // For CSV Upload and Field Mapping
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
  });
  const [showCsvMapping, setShowCsvMapping] = useState(false);
  const [csvUploadError, setCsvUploadError] = useState("");

  // --- Data Fetching ---

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // This query now fetches ONLY non-archived products for the main list
      const query = `*[_type == "product" && (!defined(isArchived) || isArchived == false)] | order(title asc){
        _id, title, price, category, brand, sku, "imageUrl": mainImage.asset->url
      }`;
      const data = await client.fetch(query);
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // --- Handlers for Product Actions ---

  const handleNewProductChange = (e) => {
    const { name, value, files } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: files ? files[0] : value }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const { title, price, mainImage, sku } = newProduct;
    if (!title || !price || !mainImage || !sku) {
      alert("Title, Price, SKU, and Image are required.");
      return;
    }
    try {
      const imageAsset = await client.assets.upload("image", mainImage, {
        contentType: mainImage.type,
        filename: mainImage.name,
      });
      const productDoc = {
        _type: "product",
        ...newProduct,
        price: parseFloat(newProduct.price),
        isArchived: false, // Ensure it's not archived on creation
        mainImage: {
          _type: "image",
          asset: { _type: "reference", _ref: imageAsset._id },
        },
      };
      // Remove mainImage from doc before creation to avoid sending file object
      delete productDoc.mainImageFile;

      await client.create(productDoc);
      alert("Product added successfully!");
      document.getElementById("newProductForm").reset();
      setNewProduct({
        title: "",
        sku: "",
        brand: "",
        description: "",
        price: "",
        category: "",
        mainImage: null,
      });
      fetchProducts();
    } catch (error) {
      console.error("Failed to add product:", error);
      alert("Failed to add product. Check if SKU is unique.");
    }
  };

  const handleArchiveProduct = async (productId) => {
    if (
      window.confirm(
        "Are you sure you want to archive this product? It will be hidden from the store."
      )
    ) {
      try {
        await client.patch(productId).set({ isArchived: true }).commit();
        alert("Product archived successfully!");
        fetchProducts(); // Refresh list
      } catch (err) {
        console.error("Failed to archive product:", err);
        alert("Failed to archive product.");
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
          throw new Error("CSV file is empty or has no data rows.");
        }
        setCsvHeaders(json[0]);
        setCsvData(json.slice(1));
        setShowCsvMapping(true);
      } catch (err) {
        setCsvUploadError(err.message);
        setCsvFile(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleMappingChange = (field, csvHeader) => {
    setFieldMapping((prev) => ({ ...prev, [field]: csvHeader }));
  };

  const handleConfirmBulkUpload = async () => {
    if (!fieldMapping.sku || !fieldMapping.title || !fieldMapping.price) {
      setCsvUploadError("SKU, Title, and Price fields must be mapped.");
      return;
    }

    setCsvUploadError("");
    const transaction = client.transaction();

    csvData.forEach((row) => {
      const product = { _type: "product", isArchived: false };
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
      // Skip rows without essential data
      if (product.sku && product.title && !isNaN(product.price)) {
        transaction.createOrReplace(product); // Use createOrReplace to update existing SKUs
      }
    });

    try {
      await transaction.commit();
      alert("Bulk upload completed successfully!");
      setShowCsvMapping(false);
      setCsvFile(null);
      fetchProducts();
    } catch (error) {
      console.error("Bulk upload failed:", error);
      setCsvUploadError(
        "Bulk upload failed. Please check console for details. SKUs might not be unique."
      );
    }
  };

  const handleBulkPriceAdjustment = async () => {
    if (!priceAdjustmentValue) {
      alert("Please enter a value for price adjustment.");
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
        alert("No products found matching your criteria.");
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
      alert(`${productsToAdjust.length} products have been updated.`);
      fetchProducts();
    } catch (error) {
      console.error("Bulk price adjustment failed:", error);
      alert("Failed to apply bulk price adjustment.");
    }
  };

  const handleDeleteAllUnreferencedProducts = async () => {
    if (
      window.confirm(
        "DANGER: This will delete ALL products that are NOT part of an order. This cannot be undone. Continue?"
      )
    ) {
      try {
        const query = `*[_type == "product" && !(_id in *[_type == "order"].items[].product._ref)]`;
        const unreferencedProducts = await client.fetch(query + "{_id}");
        if (unreferencedProducts.length === 0) {
          alert(
            "No products to delete. All products are referenced in existing orders."
          );
          return;
        }
        await client.delete({
          query: `*[_id in $ids]`,
          params: { ids: unreferencedProducts.map((p) => p._id) },
        });
        alert(`${unreferencedProducts.length} unreferenced products deleted.`);
        fetchProducts();
      } catch (error) {
        console.error("Failed to delete products:", error);
        alert("An error occurred during deletion.");
      }
    }
  };

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(filterText.toLowerCase())
  );

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error)
    return <div className="text-center text-red-500 py-8">{error}</div>;

  return (
    <div className="p-4 bg-white rounded-lg shadow-xl">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center border-b-2 border-red-200 pb-4">
        Product Management
      </h2>

      {/* --- UI Sections --- */}

      <CollapsibleSection title="Add New Product">
        <form
          id="newProductForm"
          onSubmit={handleAddProduct}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title:<span className="text-red-500">*</span>
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
                SKU:<span className="text-red-500">*</span>
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
                Brand:
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
              Description:
            </label>
            <textarea
              name="description"
              onChange={handleNewProductChange}
              rows="3"
              className="mt-1 block w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Price (SEK):<span className="text-red-500">*</span>
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
                Category:
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
              Product Image:<span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              name="mainImage"
              accept="image/*"
              onChange={handleNewProductChange}
              required
              className="mt-1 block w-full text-sm text-red-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-100 file:text-red-700 hover:file:bg-red-200"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
          >
            <i className="fas fa-plus-circle mr-2"></i>Add Product
          </button>
        </form>
      </CollapsibleSection>

      <CollapsibleSection title="Bulk Upload (CSV)">
        {!showCsvMapping ? (
          <div>
            <label
              htmlFor="csv-upload"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select CSV File:
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
              Map CSV Columns to Product Fields:
            </h4>
            {csvUploadError && (
              <p className="text-red-500 text-sm mb-4">{csvUploadError}</p>
            )}
            <div className="space-y-4 mb-6">
              {Object.keys(fieldMapping).map((field) => (
                <div key={field} className="flex items-center gap-4">
                  <label className="w-32 text-gray-700 font-medium capitalize">
                    {field}{" "}
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
                    <option value="">-- Select CSV Column --</option>
                    {csvHeaders.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowCsvMapping(false)}
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBulkUpload}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md"
              >
                <i className="fas fa-check-circle mr-2"></i>Confirm Upload
              </button>
            </div>
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Bulk Price Adjustment">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adjustment Value:
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
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (SEK)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Brand:
            </label>
            <input
              type="text"
              value={priceAdjustmentBrand}
              onChange={(e) => setPriceAdjustmentBrand(e.target.value)}
              placeholder="(Optional)"
              className="mt-1 block w-full px-4 py-2 border border-red-300 rounded-md"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Search Term (Title/SKU):
            </label>
            <input
              type="text"
              value={priceAdjustmentSearchTerm}
              onChange={(e) => setPriceAdjustmentSearchTerm(e.target.value)}
              placeholder="(Optional)"
              className="mt-1 block w-full px-4 py-2 border border-red-300 rounded-md"
            />
          </div>
          <div className="md:col-span-2 text-center">
            <button
              onClick={handleBulkPriceAdjustment}
              className="w-full md:w-1/2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg text-lg"
            >
              <i className="fas fa-percent mr-2"></i>Apply Adjustment
            </button>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Danger Zone">
        <div className="text-center p-4 bg-red-100 border border-red-300 rounded-lg">
          <p className="text-gray-600 mb-4">
            This will permanently delete all products that are NOT part of any
            existing order. Use with caution.
          </p>
          <button
            onClick={handleDeleteAllUnreferencedProducts}
            className="bg-red-800 hover:bg-red-900 text-white font-bold py-2 px-6 rounded-md"
          >
            Delete Unreferenced Products
          </button>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title={`Active Products (${filteredProducts.length})`}
        startOpen={true}
      >
        <input
          type="text"
          placeholder="Filter products by title..."
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
                    product.imageUrl ||
                    "https://via.placeholder.com/300?text=No+Image"
                  }
                  alt={product.title}
                  className="w-full h-48 object-cover rounded-md mb-4 bg-gray-200"
                />
                <div className="flex-grow">
                  <h4 className="text-lg font-bold text-gray-800">
                    {product.title}
                  </h4>
                  <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  <p className="text-gray-600 font-semibold">
                    SEK {product.price.toFixed(2)}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={() => handleArchiveProduct(product._id)}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-md"
                  >
                    <i className="fas fa-archive mr-2"></i>Archive
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
