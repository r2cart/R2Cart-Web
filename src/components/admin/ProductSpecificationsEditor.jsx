import React from 'react';
import { Sparkles, Check, AlertCircle, Info, Plus, Trash2, Heart } from 'lucide-react';

export default function ProductSpecificationsEditor({ details, onChange }) {
  const update = (key, value) => {
    onChange(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateNutrition = (nutriKey, value) => {
    onChange(prev => ({
      ...prev,
      nutrition: {
        ...(prev.nutrition || {}),
        [nutriKey]: value
      }
    }));
  };

  const handleFeatureChange = (index, value) => {
    const next = [...(details.keyFeatures || [])];
    next[index] = value;
    update('keyFeatures', next);
  };

  const addFeature = () => {
    update('keyFeatures', [...(details.keyFeatures || []), '']);
  };

  const removeFeature = (index) => {
    const next = (details.keyFeatures || []).filter((_, i) => i !== index);
    update('keyFeatures', next);
  };

  const loadSampleNestle = () => {
    onChange({
      summary: 'Nestle Classic Rich and Creamy Milk Treat Chocolate bar made with rich cocoa and smooth milk solids.',
      brand: 'Nestle',
      productType: 'Milk Chocolate',
      dietaryPreference: 'Veg',
      flavour: 'Chocolate',
      itemForm: 'Bar',
      weight: '28 g',
      itemIncluded: '1 x Chocolate bar',
      packagingType: 'Packet',
      countryOfOrigin: 'India',
      shelfLife: '9 Months',
      keyFeatures: [
        'Delicious Taste of Rich and Creamy Milk Choco',
        'Enjoy a smooth, indulgent taste experience with every bite',
        'Enjoy life’s little moments with the delicious Nestle Classic. Ideal for sharing'
      ],
      ingredients: 'Sugar, Milk solids, Fractionated vegetable fat, Hydrogenated vegetable fats, Cocoa solids (5.5%), Emulsifier (Soya lecithin) and Artificial (Vanilla) flavouring substances. Allergen Note: Contains Milk, Sesame, Soy and Wheat',
      allergens: 'Contains: Milk, Sesame, Soy, and Wheat',
      storage: 'Store in a cool, dry and hygienic place and avoid direct sunlight',
      nutrition: {
        serving: 'Per 100g',
        energy: '515 kcal',
        protein: '8.7 g',
        carbs: '57.5 g',
        sugars: '49.8 g',
        addedSugars: '39.2 g',
        fat: '27.8 g'
      },
      customSpecs: []
    });
  };

  return (
    <section className="admin-card" style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Product Highlights & Specifications</span>
            <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
              Production UI Ready
            </span>
          </h3>
          <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#64748b' }}>
            These details show as premium Blinkit/Zepto-style Highlights, Nutrition Facts, and Ingredients on mobile & laptop storefront.
          </p>
        </div>
        <button
          type="button"
          onClick={loadSampleNestle}
          style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '5px 12px',
            fontSize: '11.5px',
            fontWeight: 700,
            color: '#334155',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
          title="Auto-fill with the Nestle Chocolate specifications sample"
        >
          <Sparkles size={13} color="#059669" />
          <span>Load Nestle Sample Template</span>
        </button>
      </div>

      {/* Grid of basic specs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '12px',
        marginBottom: '18px'
      }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            Brand
          </label>
          <input
            type="text"
            placeholder="e.g. Nestle, Amul, Fortune"
            value={details.brand || ''}
            onChange={e => update('brand', e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            Product Type
          </label>
          <input
            type="text"
            placeholder="e.g. Milk Chocolate, Whole Spices"
            value={details.productType || ''}
            onChange={e => update('productType', e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            Dietary Preference / Speciality
          </label>
          <select
            value={details.dietaryPreference || 'Veg'}
            onChange={e => update('dietaryPreference', e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', background: '#fff' }}
          >
            <option value="Veg">🟢 Vegetarian (Veg)</option>
            <option value="Non-Veg">🔴 Non-Vegetarian</option>
            <option value="Vegan">🌱 100% Vegan</option>
            <option value="Eggless">🥚 Eggless</option>
            <option value="Organic">🌿 Certified Organic</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            Flavour / Variant
          </label>
          <input
            type="text"
            placeholder="e.g. Chocolate, Masala, Vanilla"
            value={details.flavour || ''}
            onChange={e => update('flavour', e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            Item Form
          </label>
          <input
            type="text"
            placeholder="e.g. Bar, Powder, Liquid, Grain"
            value={details.itemForm || ''}
            onChange={e => update('itemForm', e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            Net Weight / Item Size
          </label>
          <input
            type="text"
            placeholder="e.g. 28 g, 1 kg, 500 ml"
            value={details.weight || ''}
            onChange={e => update('weight', e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            Packaging Type
          </label>
          <input
            type="text"
            placeholder="e.g. Packet, Pouch, Bottle, Box"
            value={details.packagingType || ''}
            onChange={e => update('packagingType', e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            Items Included
          </label>
          <input
            type="text"
            placeholder="e.g. 1 x Chocolate bar"
            value={details.itemIncluded || ''}
            onChange={e => update('itemIncluded', e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            Shelf Life
          </label>
          <input
            type="text"
            placeholder="e.g. 9 Months, 12 Months"
            value={details.shelfLife || ''}
            onChange={e => update('shelfLife', e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            Country of Origin
          </label>
          <input
            type="text"
            placeholder="e.g. India"
            value={details.countryOfOrigin || 'India'}
            onChange={e => update('countryOfOrigin', e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Key Features / Bullet points */}
      <div style={{ marginBottom: '18px', background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
            Key Features & Highlights
          </label>
          <button
            type="button"
            onClick={addFeature}
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#047857',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Plus size={12} /> Add Feature Bullet
          </button>
        </div>

        {(!details.keyFeatures || details.keyFeatures.length === 0) ? (
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
            No key feature bullets added yet. Click "+ Add Feature Bullet" or click "Load Nestle Sample Template" above.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {details.keyFeatures.map((feat, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#059669', fontWeight: 800 }}>•</span>
                <input
                  type="text"
                  placeholder={`Feature bullet #${idx + 1}`}
                  value={feat}
                  onChange={e => handleFeatureChange(idx, e.target.value)}
                  style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                />
                <button
                  type="button"
                  onClick={() => removeFeature(idx)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                  title="Remove bullet"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ingredients & Allergens */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '12px',
        marginBottom: '18px'
      }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            Ingredients
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Sugar, Milk solids, Cocoa solids (5.5%), Emulsifier (Soya lecithin)..."
            value={details.ingredients || ''}
            onChange={e => update('ingredients', e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            Allergen Information
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Contains: Milk, Sesame, Soy, and Wheat"
            value={details.allergens || ''}
            onChange={e => update('allergens', e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Storage instructions */}
      <div style={{ marginBottom: '18px' }}>
        <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
          Storage Instructions
        </label>
        <input
          type="text"
          placeholder="e.g. Store in a cool, dry and hygienic place and avoid direct sunlight"
          value={details.storage || ''}
          onChange={e => update('storage', e.target.value)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
        />
      </div>

      {/* Nutrition Information Table */}
      <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
            Nutrition Information (Customer Front Facing Table)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Serving Size:</span>
            <input
              type="text"
              placeholder="e.g. Per 100g"
              value={details.nutrition?.serving || 'Per 100g'}
              onChange={e => updateNutrition('serving', e.target.value)}
              style={{ width: '100px', padding: '3px 6px', fontSize: '11.5px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
            />
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Energy</span>
            <input
              type="text"
              placeholder="e.g. 515 kcal"
              value={details.nutrition?.energy || ''}
              onChange={e => updateNutrition('energy', e.target.value)}
              style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Protein</span>
            <input
              type="text"
              placeholder="e.g. 8.7 g"
              value={details.nutrition?.protein || ''}
              onChange={e => updateNutrition('protein', e.target.value)}
              style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Carbohydrate</span>
            <input
              type="text"
              placeholder="e.g. 57.5 g"
              value={details.nutrition?.carbs || ''}
              onChange={e => updateNutrition('carbs', e.target.value)}
              style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Total Sugars</span>
            <input
              type="text"
              placeholder="e.g. 49.8 g"
              value={details.nutrition?.sugars || ''}
              onChange={e => updateNutrition('sugars', e.target.value)}
              style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Added Sugars</span>
            <input
              type="text"
              placeholder="e.g. 39.2 g"
              value={details.nutrition?.addedSugars || ''}
              onChange={e => updateNutrition('addedSugars', e.target.value)}
              style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Total Fat</span>
            <input
              type="text"
              placeholder="e.g. 27.8 g"
              value={details.nutrition?.fat || ''}
              onChange={e => updateNutrition('fat', e.target.value)}
              style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
