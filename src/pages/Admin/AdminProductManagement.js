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
  const [priceAdjustmentSearchTerm, setPriceAdjustmentSearchTerm] = useState("");

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
      [span_0](start_span)const query = *[_type == "product"]{_id, title, description, sku, brand, price, "imageUrl": image.asset->url};[span_0](end_span)
      [span_1](start_span)const fetchedProducts = await client.fetch(query);[span_1](end_span)
      setProducts(fetchedProducts);
    } catch (err) {
      [span_2](start_span)console.error("Failed to fetch products:", err);[span_2](end_span)
      [span_3](start_span)setError("Failed to load products.");[span_3](end_span)
    } finally {
      [span_4](start_span)setLoading(false);[span_4](end_span)
    }
  };

  const handleNewProductChange = (e) => {
    [span_5](start_span)const { name, value, files } = e.target;[span_5](end_span)
    [span_6](start_span)if (name === "image") {[span_6](end_span)
      [span_7](start_span)setImageFile(files[0]);[span_7](end_span)
      [span_8](start_span)setNewProduct((prev) => ({ ...prev, image: files[0] }));[span_8](end_span)
    } else {
      [span_9](start_span)setNewProduct((prev) => ({ ...prev, [name]: value }));[span_9](end_span)
    }
  };

  const handleAddProduct = async (e) => {
    [span_10](start_span)e.preventDefault();[span_10](end_span)
    try {
      [span_11](start_span)let imageUrl = null;[span_11](end_span)
      [span_12](start_span)if (imageFile) {[span_12](end_span)
        const asset = await client.assets.upload("image", imageFile);
        [span_13](start_span)imageUrl = asset._id;[span_13](end_span)
      }

      const productDoc = {
        _type: "product",
        title: newProduct.title,
        description: newProduct.description,
        sku: newProduct.sku,
        brand: newProduct.brand,
        price: parseFloat(newProduct.price),
        ...(imageUrl && {
          [span_14](start_span)image: { _type: "image", asset: { _ref: imageUrl } },[span_14](end_span)
        }),
      };

      [span_15](start_span)await client.create(productDoc);[span_15](end_span)
      [span_16](start_span)alert("Product added successfully!");[span_16](end_span)
      setNewProduct({
        title: "",
        description: "",
        sku: "",
        brand: "",
        price: 0,
        image: null,
      });
      [span_17](start_span)setImageFile(null);[span_17](end_span)
      fetchProducts(); // Re-fetch products
    } catch (error) {
      [span_18](start_span)console.error("Failed to add product:", error);[span_18](end_span)
      [span_19](start_span)alert("Failed to add product. SKU might already exist or other error.");[span_19](end_span)
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        [span_20](start_span)await client.delete(productId);[span_20](end_span)
        [span_21](start_span)alert("Product deleted successfully!");[span_21](end_span)
        fetchProducts(); // Re-fetch products
      } catch (error) {
        [span_22](start_span)console.error("Failed to delete product:", error);[span_22](end_span)
        [span_23](start_span)alert("Failed to delete product.");[span_23](end_span)
      }
    }
  };

  const handleCsvFileSelect = (event) => {
    setCsvUploadError("");
    const file = event.target.files[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader(); // LINE 51: Added semicolon here
    reader.onload = (e) => {
      [span_24](start_span)const data = new Uint8Array(e.target.result);[span_24](end_span)
      [span_25](start_span)const workbook = XLSX.read(data, { type: "array" });[span_25](end_span)
      [span_26](start_span)const sheetName = workbook.SheetNames[0];[span_26](end_span)
      [span_27](start_span)const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });[span_27](end_span)

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
    [span_28](start_span)reader.readAsArrayBuffer(file);[span_28](end_span)
  };

  const handleMappingChange = (field, csvHeader) => {
    setFieldMapping((prev) => ({ ...prev, [field]: csvHeader }));
  };

  const handleConfirmBulkUpload = async () => {
    // Validate mapping
    for (const key of ['title', 'sku', 'price']) {
        if (!fieldMapping[key]) {
            setCsvUploadError(`Please map the '${key}' field.`);
            return;
        }
    }

    setCsvUploadError("");
    const productsToCreate = csvData.map((row, rowIndex) => {
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
                  console.warn(`Invalid price for product on row ${rowIndex + 2}: ${row}`);
                  setCsvUploadError(`Invalid price found in row ${rowIndex + 2}. Please check your CSV data.`);
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
    }).filter(product => product !== null);

    if (productsToCreate.length === 0) {
        setCsvUploadError("No valid products to upload after mapping. Please check your CSV and mapping.");
        return;
    }

    [span_29](start_span)const transaction = client.transaction();[span_29](end_span)
    productsToCreate.forEach((product) => {
      [span_30](start_span)transaction.create(product);[span_30](end_span)
    });

    try {
      [span_31](start_span)await transaction.commit();[span_31](end_span)
      [span_32](start_span)alert("Products uploaded successfully!");[span_32](end_span)
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
      [span_33](start_span)fetchProducts();[span_33](end_span)
    } catch (error) {
      [span_34](start_span)console.error("Bulk upload failed:", error);[span_34](end_span)
      [span_35](start_span)setCsvUploadError("Failed to upload products. Check console for details.");[span_35](end_span)
    }
  };

  const handleBulkPriceAdjustment = async () => {
    if (!priceAdjustmentValue) {
      [span_36](start_span)alert("Please enter a value for price adjustment.");[span_36](end_span)
      return;
    }

    const query = `*[_type == "product" 
      ${priceAdjustmentBrand ? [span_37](start_span)`&& brand == "${priceAdjustmentBrand}"` : ""}[span_37](end_span)
      ${
        priceAdjustmentSearchTerm
          ? [span_38](start_span)`&& (title match "*${priceAdjustmentSearchTerm}*" || description match "*${priceAdjustmentSearchTerm}*" || sku match "*${priceAdjustmentSearchTerm}*")`[span_38](end_span)
          : ""
      }
    [span_39](start_span)]{_id, price}`;[span_39](end_span)
    try {
      [span_40](start_span)const productsToAdjust = await client.fetch(query);[span_40](end_span)
      [span_41](start_span)if (productsToAdjust.length === 0) {[span_41](end_span)
        [span_42](start_span)alert("No products found matching your criteria for adjustment.");[span_42](end_span)
        return;
      }

      [span_43](start_span)const transaction = client.transaction();[span_43](end_span)
      [span_44](start_span)productsToAdjust.forEach((product) => {[span_44](end_span)
        let newPrice;
        if (priceAdjustmentType === "percentage") {
          newPrice = product.price * (1 + priceAdjustmentValue / 100);
        } else {
          newPrice = product.price + priceAdjustmentValue;
        }
        [span_45](start_span)transaction.patch(product._id).set({ price: newPrice });[span_45](end_span)
      });
      [span_46](start_span)await transaction.commit();[span_46](end_span)
      alert("Bulk price adjustment applied!");
      fetchProducts();
    } catch (error) {
      [span_47](start_span)console.error("Bulk price adjustment failed:", error);[span_47](end_span)
      [span_48](start_span)alert("Failed to apply bulk price adjustment.");[span_48](end_span)
    }
  };

  if (loading)
    [span_49](start_span)return <div className="text-center py-8 text-lg font-semibold text-gray-700">Loading products...</div>;[span_49](end_span)
  if (error)
    [span_50](start_span)return <div className="text-center text-red-600 py-8 text-lg font-semibold">Error: {error}</div>;[span_50](end_span)

  return (
    <div className="p-4 bg-white rounded-lg shadow-xl">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center border-b-2 border-red-200 pb-4">
        Admin Product Management
      </h2>

      {/* Add Single Product */}
      <div className="mb-10 p-8 border border-red-200 rounded-xl bg-red-50/20 shadow-lg">
        <h3 className="text-2xl font-bold text-red-800 mb-6 border-b border-red-300 pb-3">
          <i className="fas fa-plus-circle mr-2 text-red-600"></i>Add New Product
        </h3>
        <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              [span_51](start_span)Title:<span className="text-red-500">*</span>[span_51](end_span)
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={newProduct.title}
              [span_52](start_span)onChange={handleNewProductChange}[span_52](end_span)
              required
              className="mt-1 block w-full px-4 py-2 border border-red-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-base bg-white transition duration-200"
            />
          </div>
          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
              [span_53](start_span)SKU:<span className="text-red-500">*</span>[span_53](end_span)
            </label>
            <input
              type="text"
              id="sku"
              name="sku"
              value={newProduct.sku}
              [span_54](start_span)onChange={handleNewProductChange}[span_54](end_span)
              required
              className="mt-1 block w-full px-4 py-2 border border-red-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-base bg-white transition duration-200"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              [span_55](start_span)Description:[span_55](end_span)
            </label>
            <textarea
              id="description"
              name="description"
              [span_56](start_span)value={newProduct.description}[span_56](end_span)
              [span_57](start_span)onChange={handleNewProductChange}[span_57](end_span)
              rows="3"
              className="mt-1 block w-full px-4 py-2 border border-red-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-base bg-white transition duration-200"
            ></textarea>
          </div>
          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
              [span_58](start_span)Brand:[span_58](end_span)
            </label>
            <input
              type="text"
              id="brand"
              name="brand"
              [span_59](start_span)value={newProduct.brand}[span_59](end_span)
              [span_60](start_span)onChange={handleNewProductChange}[span_60](end_span)
              className="mt-1 block w-full px-4 py-2 border border-red-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-base bg-white transition duration-200"
            />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              [span_61](start_span)Base Price (SEK):<span className="text-red-500">*</span>[span_61](end_span)
            </label>
            <input
              type="number"
              id="price"
              name="price"
              [span_62](start_span)value={newProduct.price}[span_62](end_span)
              [span_63](start_span)onChange={handleNewProductChange}[span_63](end_span)
              required
              [span_64](start_span)min="0"[span_64](end_span)
              [span_65](start_span)step="0.01"[span_65](end_span)
              className="mt-1 block w-full px-4 py-2 border border-red-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-base bg-white transition duration-200"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
              [span_66](start_span)Product Image:[span_66](end_span)
            </label>
            <input
              type="file"
              id="image"
              name="image"
              [span_67](start_span)onChange={handleNewProductChange}[span_67](end_span)
              [span_68](start_span)accept="image/*"[span_68](end_span)
              className="mt-1 block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-100 file:text-red-700 hover:file:bg-red-200 cursor-pointer transition duration-200"
            />
          </div>
          <div className="md:col-span-2 text-center">
            <button
              type="submit"
              [span_69](start_span)className="w-full md:w-1/2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg text-lg transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"[span_69](end_span)
            >
              <i className="fas fa-save mr-2"></i>Add Product
            </button>
          </div>
        </form>
      </div>

      {/* Bulk Product Upload */}
      <div className="mb-10 p-8 border border-red-200 rounded-xl bg-red-50/20 shadow-lg">
        <h3 className="text-2xl font-bold text-red-800 mb-6 border-b border-red-300 pb-3">
          [span_70](start_span)<i className="fas fa-upload mr-2 text-red-600"></i>Bulk Upload Products (CSV)[span_70](end_span)
        </h3>
        {!showCsvMapping ? (
          <div>
            <label htmlFor="csv-upload" className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File:
            </label>
            <input
              type="file"
              id="csv-upload"
              accept=".csv"
              onChange={handleCsvFileSelect}
              className="block w-full text-sm text-gray-600 file:mr-4 file:py-2.5 file:px-5 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-100 file:text-red-700 hover:file:bg-red-200 cursor-pointer transition duration-200"
            />
            {csvUploadError && <p className="text-red-500 text-sm mt-3">{csvUploadError}</p>}
            <p className="text-gray-600 text-sm mt-4">
              <i className="fas fa-info-circle mr-1"></i>
              Please ensure your CSV has headers. You will map them in the next step.
            </p>
          </div>
        ) : (
          <div className="mt-4">
            <h4 className="text-xl font-semibold text-gray-800 mb-4">
              Map CSV Columns to Product Fields:
            </h4>
            {csvUploadError && <p className="text-red-500 text-sm mb-4">{csvUploadError}</p>}
            <div className="space-y-4 mb-6">
              {Object.keys(fieldMapping).map((sanityField) => (
                <div key={sanityField} className="flex items-center gap-4">
                  <label className="w-32 text-gray-700 font-medium capitalize">
                    {sanityField} {["title", "sku", "price"].includes(sanityField) && <span className="text-red-500">*</span>}:
                  </label>
                  <select
                    value={fieldMapping[sanityField]}
                    onChange={(e) => handleMappingChange(sanityField, e.target.value)}
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
      [span_71](start_span)<div className="mb-10 p-8 border border-red-200 rounded-xl bg-red-50/20 shadow-lg">[span_71](end_span)
        <h3 className="text-2xl font-bold text-red-800 mb-6 border-b border-red-300 pb-3">
          <i className="fas fa-hand-holding-usd mr-2 text-red-600"></i>Bulk Price Adjustment
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              [span_72](start_span)Adjustment Value:[span_72](end_span)
            </label>
            <div className="flex items-center">
              <input
                type="number"
                [span_73](start_span)value={priceAdjustmentValue}[span_73](end_span)
                [span_74](start_span)onChange={(e) => setPriceAdjustmentValue(parseFloat(e.target.value))}[span_74](end_span)
                className="flex-1 px-4 py-2 border border-red-300 rounded-l-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-base bg-white transition duration-200"
              />
              <select
                [span_75](start_span)value={priceAdjustmentType}[span_75](end_span)
                [span_76](start_span)onChange={(e) => setPriceAdjustmentType(e.target.value)}[span_76](end_span)
                className="px-4 py-2 border border-red-300 rounded-r-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-base bg-white border-l-0 transition duration-200"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (SEK)</option>
              </select>
            </div>
          </div>
          <div>
            [span_77](start_span)<label className="block text-sm font-medium text-gray-700 mb-1">[span_77](end_span)
              [span_78](start_span)Filter by Brand:[span_78](end_span)
            </label>
            <input
              type="text"
              [span_79](start_span)value={priceAdjustmentBrand}[span_79](end_span)
              [span_80](start_span)onChange={(e) => setPriceAdjustmentBrand(e.target.value)}[span_80](end_span)
              placeholder="e.g., Apple, Samsung (Optional)"
              className="mt-1 block w-full px-4 py-2 border border-red-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-base bg-white transition duration-200"
            />
          </div>
          <div className="md:col-span-2">
            [span_81](start_span)<label className="block text-sm font-medium text-gray-700 mb-1">[span_81](end_span)
              [span_82](start_span)Filter by Search Term:[span_82](end_span)
            </label>
            <input
              type="text"
              [span_83](start_span)value={priceAdjustmentSearchTerm}[span_83](end_span)
              [span_84](start_span)onChange={(e) => setPriceAdjustmentSearchTerm(e.target.value)}[span_84](end_span)
              placeholder="e.g., iPhone, monitor (Optional)"
              className="mt-1 block w-full px-4 py-2 border border-red-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-base bg-white transition duration-200"
            />
          </div>
          <div className="md:col-span-2 text-center">
            <button
              [span_85](start_span)onClick={handleBulkPriceAdjustment}[span_85](end_span)
              className="w-full md:w-1/2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg text-lg transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <i className="fas fa-percent mr-2"></i>Apply Adjustment
            </button>
          </div>
        </div>
      </div>

      {/* Existing Products List (for editing/deleting) */}
      <div className="p-8 border border-red-200 rounded-xl bg-red-50/20 shadow-lg">
        <h3 className="text-2xl font-bold text-red-800 mb-6 border-b border-red-300 pb-3">
          <i className="fas fa-box-open mr-2 text-red-600"></i>Existing Products
        </h3>
        [span_86](start_span){products.length === 0 && ([span_86](end_span)
          <p className="text-gray-600 text-center py-4 text-lg">No products found. Add some above!</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          [span_87](start_span){products.map((product) => ([span_87](end_span)
            <div
              key={product._id}
              [span_88](start_span)className="relative border border-red-100 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden bg-white group"[span_88](end_span)
            >
              [span_89](start_span){product.imageUrl && ([span_89](end_span)
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  [span_90](start_span)className="w-full h-40 object-cover object-center group-hover:scale-105 transition-transform duration-300"[span_90](end_span)
                />
              )}
              <div className="p-4">
                [span_91](start_span)<h4 className="text-lg font-bold text-gray-900 truncate mb-1">[span_91](end_span)
                  {product.title}
                </h4>
                [span_92](start_span)<p className="text-sm text-gray-600">SKU: {product.sku}</p>[span_92](end_span)
                <p className="text-xl font-extrabold text-red-700 mt-3">
                  SEK {product.price.toFixed(2)}
                </p>
                [span_93](start_span)<div className="flex justify-between mt-5 space-x-3">[span_93](end_span)
                  <button
                    [span_94](start_span)onClick={() => alert(`Edit functionality for ${product.title} would go here!`)}[span_94](end_span)
                    [span_95](start_span)className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-200 transform hover:scale-105"[span_95](end_span)
                  >
                    <i className="fas fa-edit mr-1"></i>Edit
                  </button>
                  <button
                    [span_96](start_span)onClick={() => handleDeleteProduct(product._id)}[span_96](end_span)
                    [span_97](start_span)className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-200 transform hover:scale-105"[span_97](end_span)
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
