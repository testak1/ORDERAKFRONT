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

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Product Management</h2>

      {/* Add Single Product */}
      <h3>Add New Product</h3>
      <form onSubmit={handleAddProduct}>
        <div>
          <label>
            Title:{" "}
            <input
              type="text"
              name="title"
              value={newProduct.title}
              onChange={handleNewProductChange}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Description:{" "}
            <textarea
              name="description"
              value={newProduct.description}
              onChange={handleNewProductChange}
            ></textarea>
          </label>
        </div>
        <div>
          <label>
            SKU:{" "}
            <input
              type="text"
              name="sku"
              value={newProduct.sku}
              onChange={handleNewProductChange}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Brand:{" "}
            <input
              type="text"
              name="brand"
              value={newProduct.brand}
              onChange={handleNewProductChange}
            />
          </label>
        </div>
        <div>
          <label>
            Base Price:{" "}
            <input
              type="number"
              name="price"
              value={newProduct.price}
              onChange={handleNewProductChange}
              required
              min="0"
              step="0.01"
            />
          </label>
        </div>
        <div>
          <label>
            Image:{" "}
            <input
              type="file"
              name="image"
              onChange={handleNewProductChange}
              accept="image/*"
            />
          </label>
        </div>
        <button type="submit">Add Product</button>
      </form>

      {/* Bulk Product Upload */}
      <h3>Bulk Upload Products (CSV)</h3>
      <input type="file" accept=".csv" onChange={handleBulkUpload} />

      {/* Bulk Price Adjustments */}
      <h3>Bulk Price Adjustment</h3>
      <div>
        <label>
          Adjustment Value:{" "}
          <input
            type="number"
            value={priceAdjustmentValue}
            onChange={(e) =>
              setPriceAdjustmentValue(parseFloat(e.target.value))
            }
          />
        </label>
        <select
          value={priceAdjustmentType}
          onChange={(e) => setPriceAdjustmentType(e.target.value)}
        >
          <option value="percentage">Percentage (%)</option>
          <option value="fixed">Fixed Amount ($)</option>
        </select>
      </div>
      <div>
        <label>
          Filter by Brand:{" "}
          <input
            type="text"
            value={priceAdjustmentBrand}
            onChange={(e) => setPriceAdjustmentBrand(e.target.value)}
            placeholder="Optional Brand"
          />
        </label>
      </div>
      <div>
        <label>
          Filter by Search Term:{" "}
          <input
            type="text"
            value={priceAdjustmentSearchTerm}
            onChange={(e) => setPriceAdjustmentSearchTerm(e.target.value)}
            placeholder="Optional Search"
          />
        </label>
      </div>
      <button onClick={handleBulkPriceAdjustment}>Apply Adjustment</button>

      {/* Existing Products List (for editing/deleting) */}
      <h3>Existing Products</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "10px",
        }}
      >
        {products.map((product) => (
          <div
            key={product._id}
            style={{ border: "1px solid #eee", padding: "10px" }}
          >
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.title}
                style={{ maxWidth: "100px", height: "auto" }}
              />
            )}
            <h4>{product.title}</h4>
            <p>SKU: {product.sku}</p>
            <p>Price: ${product.price.toFixed(2)}</p>
            <button onClick={() => alert(`Edit ${product.title}`)}>
              Edit
            </button>{" "}
            {/* Implement Edit Modal later */}
            <button onClick={() => handleDeleteProduct(product._id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminProductManagement;
