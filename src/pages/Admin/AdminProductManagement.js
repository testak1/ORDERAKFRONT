// Snippet for bulk upload (AdminProductManagement.js)
import * as XLSX from "xlsx";

const handleBulkUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Assuming CSV has 'title', 'description', 'sku', 'brand', 'price' columns
    const productsToCreate = json.map((row) => ({
      _type: "product",
      title: row.title,
      description: row.description,
      sku: String(row.sku), // Ensure SKU is string
      brand: row.brand,
      price: parseFloat(row.price),
      // Image handling would be more complex here, typically you'd upload images separately
      // or reference existing ones by ID if provided in CSV.
    }));

    const transaction = client.transaction();
    productsToCreate.forEach((product) => {
      transaction.create(product);
    });

    try {
      await transaction.commit();
      alert("Products uploaded successfully!");
      // Re-fetch products to update the list
    } catch (error) {
      console.error("Bulk upload failed:", error);
      alert("Failed to upload products.");
    }
  };
  reader.readAsArrayBuffer(file);
};
