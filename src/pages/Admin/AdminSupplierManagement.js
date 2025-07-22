import React, { useState, useEffect } from "react";
import { client } from "../../sanityClient";

const initialSupplierState = {
  name: "",
  sourceType: "xml",
  sourceUrl: "",
  exchangeRate: 1,
  // Starta med ett exempelintervall
  pricingTiers: [{ priceFrom: 0, priceTo: 1000, margin: 1.5 }], 
  fieldMapping: { sku: "", title: "", description: "", price: "", brand: "" },
  categoryKeywords: [],
};

function AdminSupplierManagement() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(initialSupplierState);

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
    // Säkerställ att fälten är i rätt format när vi börjar redigera
    const supplierToEdit = {
      ...initialSupplierState,
      ...supplier,
      categoryKeywords: supplier.categoryKeywords || [],
      pricingTiers: supplier.pricingTiers && supplier.pricingTiers.length > 0 ? supplier.pricingTiers : [{ priceFrom: 0, priceTo: 1000, margin: 1.5 }],
    };
    setCurrentSupplier(supplierToEdit);
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
    const parsedValue = name === 'exchangeRate' ? parseFloat(value) : value;
    setCurrentSupplier(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleMappingChange = (e) => {
    const { name, value } = e.target;
    setCurrentSupplier(prev => ({
      ...prev,
      fieldMapping: { ...prev.fieldMapping, [name]: value },
    }));
  };

  const handleKeywordsChange = (e) => {
    const keywords = e.target.value.split(',').map(kw => kw.trim()).filter(Boolean);
    setCurrentSupplier(prev => ({ ...prev, categoryKeywords: keywords }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const doc = { _type: 'supplier', ...currentSupplier };

    try {
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

  const handleTierChange = (index, field, value) => {
    const updatedTiers = [...currentSupplier.pricingTiers];
    updatedTiers[index][field] = value === '' ? null : parseFloat(value) || 0;
    setCurrentSupplier(prev => ({ ...prev, pricingTiers: updatedTiers }));
  };

  const addTier = () => {
    const newTiers = [...(currentSupplier.pricingTiers || []), { priceFrom: 1000, priceTo: null, margin: 1.35 }];
    setCurrentSupplier(prev => ({ ...prev, pricingTiers: newTiers }));
  };

  const removeTier = (index) => {
    const newTiers = currentSupplier.pricingTiers.filter((_, i) => i !== index);
    setCurrentSupplier(prev => ({ ...prev, pricingTiers: newTiers }));
  };

  if (loading) return <p>Laddar leverantörer...</p>;
  
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
          <input type="number" step="0.01" name="exchangeRate" placeholder="Växelkurs till SEK" value={currentSupplier.exchangeRate} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md"/>

          <fieldset className="border p-4 rounded-md">
            <legend className="text-lg font-semibold px-2">Prisnivåer & Marginaler</legend>
            <div className="space-y-2">
              {(currentSupplier.pricingTiers || []).map((tier, index) => (
                <div key={index} className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 rounded-md">
                  <span className="font-medium">Från:</span>
                  <input type="number" value={tier.priceFrom ?? ''} onChange={(e) => handleTierChange(index, 'priceFrom', e.target.value)} className="w-24 px-2 py-1 border rounded-md" />
                  <span className="font-medium">Till:</span>
                  <input type="number" placeholder="(och uppåt)" value={tier.priceTo ?? ''} onChange={(e) => handleTierChange(index, 'priceTo', e.target.value)} className="w-24 px-2 py-1 border rounded-md" />
                  <span className="font-medium">Marginal:</span>
                  <input type="number" step="0.01" value={tier.margin ?? ''} onChange={(e) => handleTierChange(index, 'margin', e.target.value)} className="w-24 px-2 py-1 border rounded-md" />
                  <button type="button" onClick={() => removeTier(index)} className="px-2 py-1 bg-red-500 text-white rounded-md text-xs ml-auto">Ta bort</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addTier} className="mt-4 px-3 py-1 bg-blue-500 text-white rounded-md text-sm">Lägg till nivå</button>
          </fieldset>

          <fieldset className="border p-4 rounded-md">
            <legend className="text-lg font-semibold px-2">Mappning & Transformation</legend>
            <div className="space-y-2">
              <input type="text" name="sku" placeholder="SKU / Artikelnummer" value={currentSupplier.fieldMapping.sku} onChange={handleMappingChange} className="w-full px-3 py-2 border rounded-md"/>
              <input type="text" name="title" placeholder="Titel-mall, t.ex. {make} {model}" value={currentSupplier.fieldMapping.title} onChange={handleMappingChange} className="w-full px-3 py-2 border rounded-md"/>
              <textarea name="description" placeholder="Beskrivnings-mall..." value={currentSupplier.fieldMapping.description} onChange={handleMappingChange} className="w-full px-3 py-2 border rounded-md"/>
              <input type="text" name="price" placeholder="Pris-kolumn" value={currentSupplier.fieldMapping.price} onChange={handleMappingChange} className="w-full px-3 py-2 border rounded-md"/>
              <input type="text" name="brand" placeholder="Märke (fast värde eller {kolumn})" value={currentSupplier.fieldMapping.brand} onChange={handleMappingChange} className="w-full px-3 py-2 border rounded-md"/>
            </div>
          </fieldset>

          <fieldset className="border p-4 rounded-md">
            <legend className="text-lg font-semibold px-2">Kategori-nyckelord</legend>
            <p className="text-sm text-gray-500 mb-2">Ange bilmärken separerade med kommatecken, t.ex. BMW, Audi, VW</p>
            <textarea
              placeholder="BMW, Audi, VW, Mercedes..."
              value={(currentSupplier.categoryKeywords || []).join(', ')}
              onChange={handleKeywordsChange}
              className="w-full px-3 py-2 border rounded-md"
            />
          </fieldset>

          <div className="flex justify-end gap-4">
            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-200 rounded-md">Avbryt</button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md">Spara</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Leverantörs-inställningar</h2>
        <button onClick={handleAddNew} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md">Lägg till ny</button>
      </div>
      <div className="space-y-4">
        {suppliers.map(supplier => (
          <div key={supplier._id} className="p-4 border rounded-md flex justify-between items-center">
            <div>
              <p className="font-bold text-lg">{supplier.name}</p>
              <p className="text-sm text-gray-500">Nyckelord: {(supplier.categoryKeywords || []).join(', ') || 'Inga'}</p>
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