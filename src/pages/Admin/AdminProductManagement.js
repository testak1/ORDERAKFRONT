import React, { useState, useEffect } from "react";
import { client } from "../../sanityClient";
import Papa from "papaparse";
import CollapsibleSection from "../../components/CollapsibleSection"; // Import the new component

function AdminProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    mainImage: null,
  });

  const [adjustment, setAdjustment] = useState({
    type: "percentage",
    value: 0,
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const query = `*[_type == "product"]{_id, title, price, category, "imageUrl": mainImage.asset->url}`;
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

  const handleNewProductChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "mainImage") {
      setNewProduct({ ...newProduct, mainImage: files[0] });
    } else {
      setNewProduct({ ...newProduct, [name]: value });
    }
  };

  const handleAddNewProduct = async (e) => {
    e.preventDefault();
    const { title, description, price, category, mainImage } = newProduct;

    if (!title || !price || !mainImage) {
      alert("Title, price, and image are required.");
      return;
    }

    try {
      const imageAsset = await client.assets.upload("image", mainImage, {
        contentType: mainImage.type,
        filename: mainImage.name,
      });

      const productDoc = {
        _type: "product",
        title: title,
        description: description,
        price: parseFloat(price),
        category: category,
        mainImage: {
          _type: "image",
          asset: {
            _type: "reference",
            _ref: imageAsset._id,
          },
        },
      };

      await client.create(productDoc);
      alert("Product added successfully!");
      setNewProduct({
        title: "",
        description: "",
        price: "",
        category: "",
        mainImage: null,
      });
      document.getElementById("newProductForm").reset();
      fetchProducts();
    } catch (error) {
      console.error("Failed to add product:", error);
      alert("Failed to add product.");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await client.delete(productId);
        alert("Product deleted successfully!");
        fetchProducts();
      } catch (error) {
        console.error("Failed to delete product:", error);
        alert("Failed to delete product.");
      }
    }
  };

  const handleBulkUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const productsToUpload = results.data;
        if (
          !window.confirm(
            `You are about to upload ${productsToUpload.length} products. Continue?`
          )
        )
          return;

        const transaction = client.transaction();
        productsToUpload.forEach((product) => {
          if (product.title && product.price) {
            transaction.create({
              _type: "product",
              title: product.title,
              description: product.description || "",
              price: parseFloat(product.price),
              category: product.category || "Uncategorized",
            });
          }
        });

        try {
          await transaction.commit();
          alert(`${productsToUpload.length} products uploaded successfully!`);
          fetchProducts();
        } catch (error) {
          console.error("Bulk upload failed:", error);
          alert("Bulk upload failed. Check the console for more details.");
        }
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        alert("Failed to parse CSV file.");
      },
    });
  };

  const handleBulkPriceAdjust = async (e) => {
    e.preventDefault();
    const { type, value } = adjustment;
    const numericValue = parseFloat(value);

    if (isNaN(numericValue)) {
      alert("Please enter a valid number for the adjustment.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to adjust all product prices? This action cannot be undone.`
      )
    )
      return;

    const transaction = client.transaction();
    products.forEach((product) => {
      let newPrice;
      if (type === "percentage") {
        newPrice = product.price * (1 + numericValue / 100);
      } else {
        newPrice = product.price + numericValue;
      }
      transaction.patch(product._id, {
        set: { price: parseFloat(newPrice.toFixed(2)) },
      });
    });

    try {
      await transaction.commit();
      alert("Prices adjusted successfully!");
      fetchProducts();
    } catch (error) {
      console.error("Failed to adjust prices:", error);
      alert("Failed to adjust prices.");
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

  return (
    <div className="p-4 bg-white rounded-lg shadow-xl">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center border-b-2 border-red-200 pb-4">
        Product Management
      </h2>

      <CollapsibleSection title="Add New Product">
        <form
          id="newProductForm"
          onSubmit={handleAddNewProduct}
          className="space-y-4"
        >
          {/* Form fields for adding new product */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title:
            </label>
            <input
              type="text"
              name="title"
              onChange={handleNewProductChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description:
            </label>
            <textarea
              name="description"
              onChange={handleNewProductChange}
              className="mt-1 block w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Price:
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
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Main Image:
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
            Add Product
          </button>
        </form>
      </CollapsibleSection>

      <CollapsibleSection title="Bulk Upload Products (CSV)">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload a CSV file with columns: title, description, price, category.
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleBulkUpload}
            className="block w-full text-sm text-red-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-100 file:text-red-700 hover:file:bg-red-200"
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Bulk Price Adjustment">
        <form onSubmit={handleBulkPriceAdjust} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Adjustment Type:
            </label>
            <select
              value={adjustment.type}
              onChange={(e) =>
                setAdjustment({ ...adjustment, type: e.target.value })
              }
              className="mt-1 block w-full px-3 py-2 border border-red-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Value (use negative for discount):
            </label>
            <input
              type="number"
              step="any"
              value={adjustment.value}
              onChange={(e) =>
                setAdjustment({ ...adjustment, value: e.target.value })
              }
              className="mt-1 block w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
          >
            Adjust All Prices
          </button>
        </form>
      </CollapsibleSection>

      <CollapsibleSection title="Delete All Products">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            This will permanently delete all products from the database. This
            action cannot be undone.
          </p>
          <button
            onClick={handleDeleteAllProducts}
            className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-6 rounded-md transition-colors duration-200"
          >
            Erase All Products
          </button>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Existing Products" startOpen={true}>
        {loading && <p>Loading products...</p>}
        {error && <p className="text-red-500">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product._id}
              className="bg-white p-4 rounded-md shadow-sm border border-red-100 flex flex-col justify-between"
            >
              <div>
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-48 object-cover rounded-md mb-4"
                  />
                )}
                <h4 className="text-lg font-bold text-gray-800">
                  {product.title}
                </h4>
                <p className="text-gray-600">Price: ${product.price}</p>
                <p className="text-sm text-gray-500">
                  Category: {product.category}
                </p>
              </div>
              <button
                onClick={() => handleDeleteProduct(product._id)}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded-md text-sm self-end"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}

export default AdminProductManagement;
