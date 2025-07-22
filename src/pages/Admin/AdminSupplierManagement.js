import React, { useState, useEffect } from "react";
import { client } from "../../sanityClient";

// Tom grund för en ny eller redigerad leverantör
const initialSupplierState = {
  name: "",
  sourceType: "xml",
  sourceUrl: "",
  fieldMapping: {
    sku: "",
    title: "",
    description: "",
    price: "",
    brand: "",
  },
};

function AdminSupplierManagement() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(initialSupplierState);

  // Hämta alla leverantörs-konfigurationer från Sanity
  const fetchSuppliers = async () => {
    setLoading(true);
    const query = `*[_type == "supplier"] | order(name asc)`;
    const result = await client.fetch(query);
    setSuppliers(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleAddNew = () => {
    setCurrentSupplier(initialSupplierState);
    setIsEditing(true);
  };

  const handleEdit = (supplier) => {
    setCurrentSupplier(supplier);
    setIsEditing(true);
  };

  const handleDelete = async (supplierId) => {
    if (window.confirm("Är du säker på att du vill ta bort denna leverantörs-konfiguration?")) {
      try {
        await client.delete(supplierId);
        alert("Konfigurationen borttagen!");
        fetchSuppliers();
      } catch (error) {
        alert("Kunde inte ta bort konfigurationen.");
        console.error("Delete failed:", error);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentSupplier(prev => ({ ...prev, [name]: value }));
  };

  const handleMappingChange = (e) => {
    const { name, value } = e.target;
    setCurrentSupplier(prev => ({
      ...prev,
      fieldMapping: {
        ...prev.fieldMapping,
        [name]: value,
      },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const doc = {
      _type: 'supplier',
      ...currentSupplier
    };

    try {
      // Om det finns ett _id, uppdatera. Annars, skapa ny.
      if (doc._id) {
        await client.patch(doc._id).set(doc).commit();
      } else {
        await client.create(doc);
      }
      alert("Leverantörs-konfiguration sparad!");
      setIsEditing(false);
      fetchSuppliers();
    } catch (error) {
      alert("Kunde inte spara konfigurationen.");
      console.error("Save failed:", error);
    }
  };

  if (loading) {
    return <p>Laddar leverantörer...</p>;
  }
  
  // Visa formuläret för att redigera/skapa
  if (isEditing) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold mb-4">{currentSupplier._id ? "Redigera" : "Lägg till"} leverantör</h2>
        <form onSubmit={handleSave} className="space-y-6">
          <input type="text" name="name" placeholder="Namn (t.ex. RM Motors)" value={currentSupplier.name} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md"/>
          <input type="url" name="sourceUrl" placeholder="URL till XML/XLSX" value={currentSupplier.sourceUrl} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md"/>
          
          <div className="flex gap-4">
            <label><input type="radio" name="sourceType" value="xml" checked={currentSupplier.sourceType === 'xml'} onChange={handleChange} /> XML</label>
            <label><input type="radio" name="sourceType" value="xlsx" checked={currentSupplier.sourceType === 'xlsx'} onChange={handleChange} /> XLSX/CSV</label>
          </div>

          <fieldset className="border p-4 rounded-md">
            <legend className="text-lg font-semibold px-2">Mappning & Transformation</legend>
            <p className="text-sm text-gray-500 mb-4">Använd `{'{kolumnnamn}'}` för att bygga ihop värden.</p>
            <div className="space-y-2">
              <input type="text" name="sku" placeholder="SKU / Artikelnummer" value={currentSupplier.fieldMapping.sku} onChange={handleMappingChange} className="w-full px-3 py-2 border rounded-md"/>
              <input type="text" name="title" placeholder="Titel-mall, t.ex. {make} {model}" value={currentSupplier.fieldMapping.title} onChange={handleMappingChange} className="w-full px-3 py-2 border rounded-md"/>
              <textarea name="description" placeholder="Beskrivnings-mall..." value={currentSupplier.fieldMapping.description} onChange={handleMappingChange} className="w-full px-3 py-2 border rounded-md"/>
              <input type="text" name="price" placeholder="Pris-kolumn" value={currentSupplier.fieldMapping.price} onChange={handleMappingChange} className="w-full px-3 py-2 border rounded-md"/>
              <input type="text" name="brand" placeholder="Märke (fast värde eller {kolumn})" value={currentSupplier.fieldMapping.brand} onChange={handleMappingChange} className="w-full px-3 py-2 border rounded-md"/>
            </div>
          </fieldset>

          <div className="flex justify-end gap-4">
            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-200 rounded-md">Avbryt</button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md">Spara</button>
          </div>
        </form>
      </div>
    );
  }

  // Visa listan över befintliga leverantörer
  return (
    <div className="p-4 bg-white rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Leverantörs-inställningar</h2>
        <button onClick={handleAddNew} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md">
          Lägg till ny
        </button>
      </div>
      <div className="space-y-4">
        {suppliers.map(supplier => (
          <div key={supplier._id} className="p-4 border rounded-md flex justify-between items-center">
            <div>
              <p className="font-bold text-lg">{supplier.name}</p>
              <p className="text-sm text-gray-500">{supplier.sourceUrl}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(supplier)} className="px-3 py-1 bg-yellow-500 text-white rounded-md text-sm">Redigera</button>
              <button onClick={() => handleDelete(supplier._id)} className="px-3 py-1 bg-red-600 text-white rounded-md text-sm">Ta bort</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminSupplierManagement;