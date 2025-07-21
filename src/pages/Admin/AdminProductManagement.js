// src/pages/Admin/AdminProductManagement.js
import React, { useState, useEffect } from "react";
import { client } from "../../sanityClient";
import * as XLSX from "xlsx"; // For CSV import

function AdminProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State for adding a single product
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    sku: "",
    brand: "",
    price: 0,
    image: null,
  });
  const [imageFile, setImageFile] = useState(null);

  // State for bulk price adjustments
  const [priceAdjustmentValue, setPriceAdjustmentValue] = useState(0);
  const [priceAdjustmentType, setPriceAdjustmentType] = useState("percentage");
  const [priceAdjustmentBrand, setPriceAdjustmentBrand] = useState("");
  const [priceAdjustmentSearchTerm, setPriceAdjustmentSearchTerm] =
    useState("");

  // State for CSV Upload and Field Mapping
  const [csvFile, setCsvFile] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [fieldMapping, setFieldMapping] = useState({
    title: "",
    description: "",
    sku: "",
    brand: "",
    price: "",
  });
  const [showCsvMapping, setShowCsvMapping] = useState(false);
  const [csvUploadError, setCsvUploadError] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const query =
        '*[_type == "product"]{_id, title, description, sku, brand, price, "imageUrl": image.asset->url}';
      const fetchedProducts = await client.fetch(query);
      setProducts(fetchedProducts);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewProductChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setImageFile(files[0]);
      setNewProduct((prev) => ({ ...prev, image: files[0] }));
    } else {
      setNewProduct((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = null;
      if (imageFile) {
        const asset = await client.assets.upload("image", imageFile);
        imageUrl = asset._id;
      }

      const productDoc = {
        _type: "product",
        title: newProduct.title,
        description: newProduct.description,
        sku: newProduct.sku,
        brand: newProduct.brand,
        price: parseFloat(newProduct.price),
        ...(imageUrl && {
          image: { _type: "image", asset: { _ref: imageUrl } },
        }),
      };

      await client.create(productDoc);
      alert("Product added successfully!");
      setNewProduct({
        title: "",
        description: "",
        sku: "",
        brand: "",
        price: 0,
        image: null,
      });
      setImageFile(null);
      fetchProducts(); // Re-fetch products
    } catch (error) {
      console.error("Failed to add product:", error);
      alert("Failed to add product. SKU might already exist or other error.");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await client.delete(productId);
        alert("Product deleted successfully!");
        fetchProducts(); // Re-fetch products
      } catch (error) {
        console.error("Failed to delete product:", error);
        alert("Failed to delete product.");
      }
    }
  };

  const handleDeleteAllProducts = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete ALL products? This action cannot be undone."
      )
    ) {
      try {
        await client.delete({ query: '*[_type == "product"]' });
        alert("All products have been deleted successfully!");
        fetchProducts(); // Refresh the product list
      } catch (error) {
        console.error("Failed to delete all products:", error);
        alert("Failed to delete all products.");
      }
    }
  };

  const handleCsvFileSelect = (event) => {
    setCsvUploadError("");
    const file = event.target.files[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
        header: 1,
      });

      if (json.length === 0) {
        setCsvUploadError("CSV file is empty.");
        setCsvFile(null);
        return;
      }

      const headers = json[0];
      setCsvHeaders(headers);
      setCsvData(json.slice(1));

      setFieldMapping({
        title: "",
        description: "",
        sku: "",
        brand: "",
        price: "",
      });
      setShowCsvMapping(true);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleMappingChange = (field, csvHeader) => {
    setFieldMapping((prev) => ({ ...prev, [field]: csvHeader }));
  };

  const handleConfirmBulkUpload = async () => {
    // Validate mapping
    for (const key of ["title", "sku", "price"]) {
      if (!fieldMapping[key]) {
        setCsvUploadError(`Please map the '${key}' field.`);
        return;
      }
    }

    setCsvUploadError("");
    const productsToCreate = csvData
      .map((row, rowIndex) => {
        const product = { _type: "product" };
        for (const sanityField in fieldMapping) {
          const csvHeader = fieldMapping[sanityField];
          if (csvHeader) {
            const columnIndex = csvHeaders.indexOf(csvHeader);
            if (columnIndex !== -1) {
              let value = row[columnIndex];
              if (sanityField === "price") {
                value = parseFloat(value || 0);
                if (isNaN(value)) {
                  console.warn(
                    `Invalid price for product on row ${
                      rowIndex + 2
                    }: ${row}`
                  );
                  setCsvUploadError(
                    `Invalid price found in row ${
                      rowIndex + 2
                    }. Please check your CSV data.`
                  );
                  return null;
                }
              } else if (sanityField === "sku") {
                value = String(value);
              }
              product[sanityField] = value;
            }
          }
        }
        return product;
      })
      .filter((product) => product !== null);

    if (productsToCreate.length === 0) {
      setCsvUploadError(
        "No valid products to upload after mapping. Please check your CSV and mapping."
      );
      return;
    }

    const transaction = client.transaction();
    productsToCreate.forEach((product) => {
      transaction.create(product);
    });

    try {
      await transaction.commit();
      alert("Products uploaded successfully!");
      setCsvFile(null);
      setCsvHeaders([]);
      setCsvData([]);
      setFieldMapping({
        title: "",
        description: "",
        sku: "",
        brand: "",
        price: "",
      });
      setShowCsvMapping(false);
      fetchProducts();
    } catch (error) {
      console.error("Bulk upload failed:", error);
      setCsvUploadError(
        "Failed to upload products. Check console for details."
      );
    }
  };

  const handleBulkPriceAdjustment = async () => {
    if (!priceAdjustmentValue) {
      alert("Please enter a value for price adjustment.");
      return;
    }

    const query = `*[_type == "product" 
      ${priceAdjustmentBrand ? `&& brand == "${priceAdjustmentBrand}"` : ""}
      ${
        priceAdjustmentSearchTerm
          ? `&& (title match "*${priceAdjustmentSearchTerm}*" || description match "*${priceAdjustmentSearchTerm}*" || sku match "*${priceAdjustmentSearchTerm}*")`
          : ""
      }
    ]{_id, price}`;
    try {
      const productsToAdjust = await client.fetch(query);
      if (productsToAdjust.length === 0) {
        alert("No products found matching your criteria for adjustment.");
        return;
      }

      const transaction = client.transaction();
      productsToAdjust.forEach((product) => {
        let newPrice;
        if (priceAdjustmentType === "percentage") {
          newPrice = product.price * (1 + priceAdjustmentValue / 100);
        } else {
          newPrice = product.price + priceAdjustmentValue;
        }
        transaction.patch(product._id).set({ price: newPrice });
      });
      await transaction.commit();
      alert("Bulk price adjustment applied!");
      fetchProducts();
    } catch (error) {
      console.error("Bulk price adjustment failed:", error);
      alert("Failed to apply bulk price adjustment.");
    }
  };

  if (loading)
    return (
      <div className="text-center py-8 text-lg font-semibold text-gray-700">
        Loading products...
      </div>
    );
  if (error)
    return (
      <div className="text-center text-red-600 py-8 text-lg font-semibold">
        Error: {error}
      </div>
    );

  return (
    <div className="p-4 bg-white rounded-lg shadow-xl">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center border-b-2 border-red-200 pb-4">
        Admin Product Management
      </h2>

      {/* Add Single Product */}
      <div className="mb-10 p-8 border border-red-200 rounded-xl bg-red-50/20 shadow-lg">
        <h3 className="text-2xl font-bold text-red-800 mb-6 border-b border-red-300 pb-3">
          <i className="fas fa-plus-circle mr-2 text-red-600"></i>Add New
          Product
        </h3>
        <form
          onSubmit={handleAddProduct}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Title:<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={newProduct.title}
              onChange={handleNewProductChange}
              required
              className="mt-1 block w-full px-4 py-2 border border-red-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-base bg-white transition duration-200"
            />
          </div>
          <div>
            <label
              htmlFor="sku"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              SKU:<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="sku"
              name="sku"
              value={newProduct.sku}
              onChange={handleNewProductChange}
              required
              className="mt-1 block w-full px-4 py-2 border border-red-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-base bg-white transition duration-200"
            />
          </div>
          <div className="md:col-span-2">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description:
            </label>
            <textarea
              id="description"
              name="description"
              value={newProduct.description}
              onChange={handleNewProductChange}
              rows="3"
              className="mt-1 block w-full px-4 py-2 border border-red-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-base bg-white transition duration-200"
            ></textarea>
          </div>
          <div>
            <label
              htmlFor="brand"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Brand:
            </label>
            <input
              type="text"
              id="brand"
              name="brand"
              value={newProduct.brand}
              onChange={handleNewProductChange}
              className="mt-1 block w-full px-4 py-2 border border-red-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-base bg-white transition duration-200"
            />
          </div>
          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Base Price (SEK):<span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={newProduct.price}
              onChange={handleNewProductChange}
              required
              min="0"
              step="0.01"
              className="mt-1 block w-full px-4 py-2 border border-red-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-base bg-white transition duration-200"
            />
          </div>
          <div className="md:col-span-2">
            <label
              htmlFor="image"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Product Image:
            </label>
            <input
              type="file"
              id="image"
              name="image"
              onChange={handleNewProductChange}
              accept="image/*"
              className="mt-1 block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-100 file:text-red-700 hover:file:bg-red-200 cursor-pointer transition duration-200"
            />
          </div>
          <div className="md:col-span-2 text-center">
            <button
              type="submit"
              className="w-full md:w-1/2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg text-lg transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <i className="fas fa-save mr-2"></i>Add Product
            </button>
          </div>
        </form>
      </div>

      {/* Bulk Product Upload */}
      <div className="mb-10 p-8 border border-red-200 rounded-xl bg-red-50/20 shadow-lg">
        <h3 className="text-2xl font-bold text-red-800 mb-6 border-b border-red-300 pb-3">
          <i className="fas fa-upload mr-2 text-red-600"></i>Bulk Upload
          Products (CSV)
        </h3>
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
              className="block w-full text-sm text-gray-600 file:mr-4 file:py-2.5 file:px-5 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-100 file:text-red-700 hover:file:bg-red-200 cursor-pointer transition duration-200"
            />
            {csvUploadError && (
              <p className="text-red-500 text-sm mt-3">{csvUploadError}</p>
            )}
            <p className="text-gray-600 text-sm mt-4">
              <i className="fas fa-info-circle mr-1"></i>
              Please ensure your CSV has headers. You will map them in the next
              step.
            </p>
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
              {Object.keys(fieldMapping).map((sanityField) => (
                <div key={sanityField} className="flex items-center gap-4">
                  <label className="w-32 text-gray-700 font-medium capitalize">
                    {sanityField}{" "}
                    {["title", "sku", "price"].includes(sanityField) && (
                      <span className="text-red-500">*</span>
                    )}
                    :
                  </label>
                  <select
                    value={fieldMapping[sanityField]}
                    onChange={(e) =>
                      handleMappingChange(sanityField, e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-base bg-white"
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
                onClick={() => {
                  setShowCsvMapping(false);
                  setCsvFile(null);
                  setCsvHeaders([]);
                  setCsvData([]);
                  setCsvUploadError("");
                }}
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBulkUpload}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <i className="fas fa-check-circle mr-2"></i>Confirm Upload
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Price Adjustments */}
      <div className="mb-10 p-8 border border-red-200 rounded-xl bg-red-50/20 shadow-lg">
        <h3 className="text-2xl font-bold text-red-800 mb-6 border-b border-red-300 pb-3">
          <i className="fas fa-hand-holding-usd mr-2 text-red-600"></i>Bulk
          Price Adjustment
        </h3>
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
                  setPriceAdjustmentValue(parseFloat(e.target.value))
                }
                className="flex-1 px-4 py-2 border border-red-300 rounded-l-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-base bg-white transition duration-200"
              />
              <select
                value={priceAdjustmentType}
                onChange={(e) => setPriceAdjustmentType(e.target.value)}
                className="px-4 py-2 border border-red-300 rounded-r-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-base bg-white border-l-0 transition duration-200"
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
              placeholder="e.g., Apple, Samsung (Optional)"
              className="mt-1 block w-full px-4 py-2 border border-red-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-base bg-white transition duration-200"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Search Term:
            </label>
            <input
              type="text"
              value={priceAdjustmentSearchTerm}
              onChange={(e) => setPriceAdjustmentSearchTerm(e.target.value)}
              placeholder="e.g., iPhone, monitor (Optional)"
              className="mt-1 block w-full px-4 py-2 border border-red-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-base bg-white transition duration-200"
            />
          </div>
          <div className="md:col-span-2 text-center">
            <button
              onClick={handleBulkPriceAdjustment}
              className="w-full md:w-1/2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg text-lg transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <i className="fas fa-percent mr-2"></i>Apply Adjustment
            </button>
          </div>
        </div>
      </div>
      {/* Delete All Products */}
      <div className="mb-10 p-8 border border-red-200 rounded-xl bg-red-50/20 shadow-lg">
        <h3 className="text-2xl font-bold text-red-800 mb-6 border-b border-red-300 pb-3">
          <i className="fas fa-trash-alt mr-2 text-red-600"></i>Delete All
          Products
        </h3>
        <p className="text-gray-600 mb-4">
          This action will permanently delete all products from the database.
          This cannot be undone.
        </p>
        <div className="text-center">
          <button
            onClick={handleDeleteAllProducts}
            className="w-full md:w-1/2 bg-red-800 hover:bg-red-900 text-white font-semibold py-3 px-6 rounded-lg text-lg transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-700"
          >
            <i className="fas fa-exclamation-triangle mr-2"></i>Delete All
            Products
          </button>
        </div>
      </div>

      {/* Existing Products List (for editing/deleting) */}
      <div className="p-8 border border-red-200 rounded-xl bg-red-50/20 shadow-lg">
        <h3 className="text-2xl font-bold text-red-800 mb-6 border-b border-red-300 pb-3">
          <i className="fas fa-box-open mr-2 text-red-600"></i>Existing
          Products
        </h3>
        {products.length === 0 && (
          <p className="text-gray-600 text-center py-4 text-lg">
            No products found. Add some above!
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product._id}
              className="relative border border-red-100 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden bg-white group"
            >
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full h-40 object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
              )}
              <div className="p-4">
                <h4 className="text-lg font-bold text-gray-900 truncate mb-1">
                  {product.title}
                </h4>
                <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                <p className="text-xl font-extrabold text-red-700 mt-3">
                  SEK {product.price.toFixed(2)}
                </p>
                <div className="flex justify-between mt-5 space-x-3">
                  <button
                    onClick={() =>
                      alert(
                        `Edit functionality for ${product.title} would go here!`
                      )
                    }
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-200 transform hover:scale-105"
                  >
                    <i className="fas fa-edit mr-1"></i>Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product._id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-200 transform hover:scale-105"
                  >
                    <i className="fas fa-trash-alt mr-1"></i>Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminProductManagement;
