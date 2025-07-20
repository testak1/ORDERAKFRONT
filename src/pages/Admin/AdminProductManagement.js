import React, { useState, useEffect } from "react";
import { client } from "../../sanityClient"; // Import Sanity client
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
    image: null, // For file input
  });
  const [imageFile, setImageFile] = useState(null);

  // State for bulk price adjustments
  const [priceAdjustmentValue, setPriceAdjustmentValue] = useState(0);
  const [priceAdjustmentType, setPriceAdjustmentType] = useState("percentage"); // 'percentage' or 'fixed'
  const [priceAdjustmentBrand, setPriceAdjustmentBrand] = useState("");
  const [priceAdjustmentSearchTerm, setPriceAdjustmentSearchTerm] =
    useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const query = `*[_type == "product"]{_id, title, description, sku, brand, price, "imageUrl": image.asset->url}`;
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
      setNewProduct((prev) => ({ ...prev, image: files[0] })); // Keep track of the file object
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
        imageUrl = asset._id; // Get the asset ID
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

  const handleBulkUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      const productsToCreate = json.map((row) => ({
        _type: "product",
        title: row.title,
        description: row.description,
        sku: String(row.sku),
        brand: row.brand || "", // Ensure brand exists
        price: parseFloat(row.price || 0), // Ensure price is a number
      }));

      const transaction = client.transaction();
      productsToCreate.forEach((product) => {
        transaction.create(product);
      });

      try {
        await transaction.commit();
        alert("Products uploaded successfully!");
        fetchProducts();
      } catch (error) {
        console.error("Bulk upload failed:", error);
        alert("Failed to upload products.");
      }
    };
    reader.readAsArrayBuffer(file);
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
          // fixed
          newPrice = product.price + priceAdjustmentValue;
        }
        transaction.patch(product._id).set({ price: newPrice });
      });
      await transaction.commit();
      alert("Bulk price adjustment applied!");
      fetchProducts(); // Re-fetch products
    } catch (error) {
      console.error("Bulk price adjustment failed:", error);
      alert("Failed to apply bulk price adjustment.");
    }
  };

  if (loading)
    return <div className="text-center py-8">Loading products...</div>;
  if (error)
    return <div className="text-center text-red-500 py-8">Error: {error}</div>;

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Product Management
      </h2>

      {/* Add Single Product */}
      <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Add New Product
        </h3>
        <form onSubmit={handleAddProduct} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title:{" "}
              <input
                type="text"
                name="title"
                value={newProduct.title}
                onChange={handleNewProductChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description:{" "}
              <textarea
                name="description"
                value={newProduct.description}
                onChange={handleNewProductChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              ></textarea>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              SKU:{" "}
              <input
                type="text"
                name="sku"
                value={newProduct.sku}
                onChange={handleNewProductChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Brand:{" "}
              <input
                type="text"
                name="brand"
                value={newProduct.brand}
                onChange={handleNewProductChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Base Price:{" "}
              <input
                type="number"
                name="price"
                value={newProduct.price}
                onChange={handleNewProductChange}
                required
                min="0"
                step="0.01"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Image:{" "}
              <input
                type="file"
                name="image"
                onChange={handleNewProductChange}
                accept="image/*"
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </label>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
          >
            Add Product
          </button>
        </form>
      </div>

      {/* Bulk Product Upload */}
      <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Bulk Upload Products (CSV)
        </h3>
        <input
          type="file"
          accept=".csv"
          onChange={handleBulkUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
        />
      </div>

      {/* Bulk Price Adjustments */}
      <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Bulk Price Adjustment
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Adjustment Value:{" "}
              <input
                type="number"
                value={priceAdjustmentValue}
                onChange={(e) =>
                  setPriceAdjustmentValue(parseFloat(e.target.value))
                }
                className="mt-1 inline-block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </label>
            <select
              value={priceAdjustmentType}
              onChange={(e) => setPriceAdjustmentType(e.target.value)}
              className="ml-2 mt-1 inline-block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (SEK)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Filter by Brand:{" "}
              <input
                type="text"
                value={priceAdjustmentBrand}
                onChange={(e) => setPriceAdjustmentBrand(e.target.value)}
                placeholder="Optional Brand"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Filter by Search Term:{" "}
              <input
                type="text"
                value={priceAdjustmentSearchTerm}
                onChange={(e) => setPriceAdjustmentSearchTerm(e.target.value)}
                placeholder="Optional Search"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </label>
          </div>
          <button
            onClick={handleBulkPriceAdjustment}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
          >
            Apply Adjustment
          </button>
        </div>
      </div>

      {/* Existing Products List (for editing/deleting) */}
      <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Existing Products
        </h3>
        {products.length === 0 && (
          <p className="text-gray-500">No products found.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <div
              key={product._id}
              className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden bg-white"
            >
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full h-32 object-cover object-center"
                />
              )}
              <div className="p-4">
                <h4 className="text-lg font-medium text-gray-900 truncate">
                  {product.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1">SKU: {product.sku}</p>
                <p className="text-md font-bold text-green-700 mt-2">
                  SEK {product.price.toFixed(2)}
                </p>
                <div className="flex justify-between mt-4 space-x-2">
                  <button
                    onClick={() => alert(`Edit ${product.title}`)}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1.5 px-3 rounded-md text-sm transition-colors duration-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product._id)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-1.5 px-3 rounded-md text-sm transition-colors duration-200"
                  >
                    Delete
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
