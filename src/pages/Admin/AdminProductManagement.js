import React, { useState, useEffect } from "react";
import { client } from "../../sanityClient";
import Papa from "papaparse";
import CollapsibleSection from "../../components/CollapsibleSection";

function AdminProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterText, setFilterText] = useState("");

  const [newProduct, setNewProduct] = useState({
    title: "",
    sku: "",
    brand: "",
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

  // --- NEW ARCHIVE LOGIC ---
  const handleArchiveProduct = async (productId) => {
    if (
      window.confirm(
        "Are you sure you want to archive this product? It will be hidden from the store."
      )
    ) {
      try {
        // Instead of deleting, we now 'patch' the document
        await client.patch(productId).set({ isArchived: true }).commit();
        alert("Product archived successfully!");
        fetchProducts(); // Refresh list to remove the archived product
      } catch (err) {
        console.error("Failed to archive product:", err);
        alert("Failed to archive product.");
      }
    }
  };

  // --- FUNCTIONS FOR FEATURES ---
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
        isArchived: false, // Ensure it's not archived on creation
        mainImage: {
          _type: "image",
          asset: { _type: "reference", _ref: imageAsset._id },
        },
      };
      await client.create(productDoc);
      alert("Product added successfully!");
      document.getElementById("newProductForm").reset();
      fetchProducts();
    } catch (error) {
      console.error("Failed to add product:", error);
      alert("Failed to add product. Check if SKU is unique.");
    }
  };

  const handleDeleteAllProducts = async () => {
    if (
      window.confirm(
        "DANGER: This will delete ALL products that are NOT part of an order. This cannot be undone. Continue?"
      )
    ) {
      try {
        // This query is complex: it finds products that are NOT referenced in any order
        const query = `*[_type == "product" && !(_id in *[_type == "order"].items[].product._ref))]`;
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

  // Simplified change handler
  const handleNewProductChange = (e) => {
    const { name, value, files } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: files ? files[0] : value }));
  };

  // (Add handlers for Bulk Upload and Price Adjustment here if needed)

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="p-4 bg-white rounded-lg shadow-xl">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center border-b-2 border-red-200 pb-4">
        Product Management
      </h2>

      <CollapsibleSection title="Add New Product">
        {/* The form from the previous step goes here, it is already correct */}
      </CollapsibleSection>

      <CollapsibleSection title="Bulk Actions (CSV, Price Adjustments)">
        <p>
          CSV Import and Bulk Price Adjustment features can be re-added here.
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="Danger Zone">
        <div className="text-center p-4 bg-red-100 border border-red-300 rounded-lg">
          <p className="text-gray-600 mb-4">
            This will permanently delete all products that are not currently
            part of any order.
          </p>
          <button
            onClick={handleDeleteAllProducts}
            className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-6 rounded-md"
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
          {loading ? (
            <p>Loading...</p>
          ) : (
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
                  <h4 className="text-lg font-bold text-gray-800">
                    {product.title}
                  </h4>
                  <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  <p className="text-gray-600">Price: SEK {product.price}</p>
                  <div className="mt-auto pt-4">
                    {/* The button now calls handleArchiveProduct */}
                    <button
                      onClick={() => handleArchiveProduct(product._id)}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-md"
                    >
                      <i className="fa-solid fa-archive mr-2"></i>Archive
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}

export default AdminProductManagement;
