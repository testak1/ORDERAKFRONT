import React, { useState, useEffect } from "react";
import { client } from "../../sanityClient";
import Papa from "papaparse";
import CollapsibleSection from "../../components/CollapsibleSection";

function AdminProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterText, setFilterText] = useState(""); // State for filtering existing products

  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    brand: "", // New field
    sku: "", // New field
    mainImage: null,
  });

  const fetchProducts = async () => {
    if (!products.length) setLoading(true);
    try {
      const query = `*[_type == "product"]{_id, title, price, category, brand, sku, "imageUrl": mainImage.asset->url}`;
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
      document.getElementById("newProductForm").reset();
      setNewProduct({
        title: "",
        description: "",
        price: "",
        category: "",
        brand: "",
        sku: "",
        mainImage: null,
      });
      fetchProducts();
    } catch (error) {
      console.error("Failed to add product:", error);
      alert("Failed to add product. Check if SKU is unique.");
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

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(filterText.toLowerCase())
  );

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                SKU:
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
              className="mt-1 block w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Other collapsible sections like Bulk Upload can go here */}

      <CollapsibleSection
        title={`Existing Products (${filteredProducts.length})`}
        startOpen={true}
      >
        <input
          type="text"
          placeholder="Filter products by title..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full px-3 py-2 mb-4 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500"
        />
        {loading && <p>Loading products...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {/* Scrollable container */}
        <div className="max-h-[600px] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-white p-4 rounded-md shadow-sm border border-red-100 flex flex-col justify-between"
              >
                <div>
                  {/* Gracefully handle missing images */}
                  <img
                    src={
                      product.imageUrl ||
                      "https://via.placeholder.com/300?text=No+Image"
                    }
                    alt={product.title}
                    className="w-full h-48 object-cover rounded-md mb-4 bg-gray-200"
                  />
                  <h4 className="text-lg font-bold text-gray-800">
                    {product.title}
                  </h4>
                  <p className="text-gray-600">Price: SEK {product.price}</p>
                  <p className="text-sm text-gray-500">SKU: {product.sku}</p>
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
        </div>
      </CollapsibleSection>
    </div>
  );
}

export default AdminProductManagement;
