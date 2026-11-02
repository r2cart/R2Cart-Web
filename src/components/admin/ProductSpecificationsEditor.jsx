import React, { useState } from 'react';
import { Sparkles, Check, AlertCircle, Info, Plus, Trash2, Heart, Wand2, Loader2, Tag } from 'lucide-react';
import { generateDetailedSpecifications } from '../../utils/productDetails';
import { adminService } from '../../services/admin.service';

export default function ProductSpecificationsEditor({
  details = {},
  onChange,
  productName = '',
  category = '',
  unit = '',
  image = '',
  onDescriptionChange
}) {
  const [selectedPreset, setSelectedPreset] = useState('');
  const [generating, setGenerating] = useState(false);

  const normalizeDietPreset = (raw) => {
    if (!raw) return '';
    const l = String(raw).trim().toLowerCase();
    if (l === 'veg' || l === 'vegetarian' || l.includes('vegetarian')) return 'Veg';
    if (l === 'non-veg' || l === 'non-vegetarian' || l.includes('non-veg')) return 'Non-Veg';
    if (l === 'vegan' || l.includes('vegan')) return 'Vegan';
    if (l === 'eggless' || l.includes('eggless')) return 'Eggless';
    if (l === 'organic' || l.includes('organic')) return 'Organic';
    if (l === 'jain' || l.includes('jain')) return 'Jain';
    if (l === 'gluten-free' || l.includes('gluten')) return 'Gluten-Free';
    if (l === 'sugar-free' || l.includes('sugar')) return 'Sugar-Free';
    if (l === 'keto' || l.includes('keto')) return 'Keto';
    if (l === 'ayurvedic' || l.includes('ayurvedic') || l.includes('herbal')) return 'Ayurvedic';
    return '__custom__';
  };

  const [isCustomDiet, setIsCustomDiet] = useState(() => {
    const val = details.dietaryPreference || '';
    return Boolean(val && normalizeDietPreset(val) === '__custom__');
  });

  React.useEffect(() => {
    const val = details.dietaryPreference || '';
    setIsCustomDiet(Boolean(val && normalizeDietPreset(val) === '__custom__'));
  }, [details.dietaryPreference]);

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

  // Smart High-Power Auto-Generate using Backend AI & Semantic Knowledge Engine
  const handleAutoGenerate = async (presetOverrideName = null) => {
    const nameToUse = presetOverrideName || productName || 'Daily Grocery Item';
    setGenerating(true);
    try {
      const res = await adminService.generateProductDetails({
        name: nameToUse,
        category,
        unit,
        brand: details?.brand || ''
      });
      if (res && typeof res === 'object') {
        const dietVal = res.dietaryPreference !== undefined ? res.dietaryPreference : (details?.dietaryPreference || '');
        // Preserve admin's custom summary if they already entered one
        const currentSummary = (details?.summary && String(details.summary).trim()) || '';
        const generatedSummary = res.description || '';
        const finalSummary = currentSummary || generatedSummary;

        if (generatedSummary && onDescriptionChange && !currentSummary) {
          onDescriptionChange(generatedSummary);
        }

        onChange(prev => ({
          ...prev,
          summary: finalSummary,
          brand: res.brand || prev.brand || '',
          productType: res.productType || prev.productType || '',
          dietaryPreference: dietVal,
          flavour: res.flavour || prev.flavour || '',
          itemForm: res.itemForm || prev.itemForm || '',
          weight: res.weight || unit || prev.weight || '',
          packagingType: res.packagingType || prev.packagingType || 'Packet',
          itemsIncluded: res.itemsIncluded || prev.itemsIncluded || '1 x Pack',
          countryOfOrigin: res.countryOfOrigin || prev.countryOfOrigin || 'India',
          shelfLife: res.shelfLife || prev.shelfLife || '',
          keyFeatures: Array.isArray(res.keyFeatures) && res.keyFeatures.length > 0 ? res.keyFeatures : (prev.keyFeatures || []),
          ingredients: res.ingredients || prev.ingredients || '',
          allergens: res.allergens || prev.allergens || '',
          storage: res.storage || prev.storage || '',
          nutrition: {
            serving: 'Per 100g',
            ...(prev.nutrition || {}),
            ...(res.nutrition || {})
          }
        }));
        setIsCustomDiet(Boolean(dietVal && !['Veg', 'Non-Veg', 'Vegan', 'Eggless', 'Organic', 'Jain', 'Gluten-Free', 'Sugar-Free', 'Keto', 'Ayurvedic', ''].includes(dietVal)));
        return;
      }
    } catch (err) {
      console.warn('[Specifications] AI auto-generate fallback:', err);
    } finally {
      setGenerating(false);
    }

    // Local fallback
    const generated = generateDetailedSpecifications(nameToUse, category, unit, image);
    const existingSummary = (details?.summary && String(details.summary).trim()) || '';
    if (generated.summary && onDescriptionChange && !existingSummary) {
      onDescriptionChange(generated.summary);
    }
    onChange(prev => ({
      ...generated,
      summary: existingSummary || generated.summary || ''
    }));
  };

  const handlePresetChange = (e) => {
    const val = e.target.value;
    setSelectedPreset(val);
    if (!val) return;

    if (val === 'auto') {
      handleAutoGenerate();
    } else {
      handleAutoGenerate(val);
    }
  };

  const handleDietSelectChange = (e) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsCustomDiet(true);
    } else {
      setIsCustomDiet(false);
      update('dietaryPreference', val);
    }
  };

  return (
    <section className="admin-card" style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Product Highlights & Specifications</span>
            <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
              Production UI Ready
            </span>
          </h3>
          <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#64748b' }}>
            Production-level specifications, authentic ingredients & nutrition table generated uniquely for this product.
          </p>
        </div>

        {/* Dynamic Action Buttons: Auto-Generate based on name/category/image */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleAutoGenerate()}
            disabled={generating}
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: 800,
              color: '#ffffff',
              cursor: generating ? 'not-allowed' : 'pointer',
              opacity: generating ? 0.75 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)'
            }}
            title="Auto-fill high-power specifications using Backend AI & Semantic Knowledge Engine"
          >
            {generating ? <Loader2 size={14} className="spin" color="#ffffff" /> : <Wand2 size={14} color="#ffffff" />}
            <span>{generating ? '✨ Generating Specifications…' : '✨ Auto-Fill from Name & Category'}</span>
          </button>

          <select
            value={selectedPreset}
            onChange={handlePresetChange}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1.5px solid #cbd5e1',
              fontSize: '12px',
              fontWeight: 600,
              color: '#334155',
              background: '#ffffff',
              cursor: 'pointer'
            }}
            title="Choose a specific category template"
          >
            <option value="">📋 Template Presets...</option>
            <option value="auto">⚡ Auto-Detect (Current Name & Category)</option>
            <option value="Nestle Classic Milk Chocolate Bar">🍫 Chocolates & Confectionery</option>
            <option value="Aashirvaad Shudh Chakki Whole Wheat Atta">🌾 Atta, Flours & Grains</option>
            <option value="India Gate Feast Rozzana Basmati Rice">🍚 Basmati Rice & Dals</option>
            <option value="Fortune Sunlite Refined Sunflower Oil">🌻 Edible Oil & Desi Ghee</option>
            <option value="Amul Taaza Homogenised Toned Milk">🥛 Dairy, Milk & Paneer</option>
            <option value="Tata Tea Gold Leaf Tea">☕ Tea & Coffee</option>
            <option value="Parle-G Original Gluco Biscuits">🍪 Biscuits & Bakery</option>
            <option value="Haldiram's Nagpur Aloo Bhujia Sev">🥨 Chips, Snacks & Namkeen</option>
            <option value="Maggi 2-Minute Masala Instant Noodles">🍜 Instant Noodles, Sauces & Ketchup</option>
            <option value="Surf Excel Matic Front Load Detergent Powder">🧺 Laundry Detergents & Fabric Care</option>
            <option value="Vim Lemon Dishwash Gel">🍋 Cleaners & Dishwash</option>
            <option value="Dove Cream Beauty Bathing Soap Bar">🧼 Personal Care, Soaps & Shampoos</option>
            <option value="Pampers All round Protection Baby Diaper Pants">👶 Baby Care & Diapers</option>
            <option value="Tanishq Gold Plated Traditional Earrings">💍 Jewellery & Accessories</option>
            <option value="Volini Maxx Instant Pain Relief Spray">💊 Pharma, Balms & Wellness</option>
            <option value="Fresh Organic Farm Produce">🍎 Fresh Fruits & Vegetables</option>
          </select>
        </div>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, margin: 0 }}>
              Dietary Preference / Speciality
            </label>
            {details.dietaryPreference && (
              <span style={{ fontSize: '10px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>
                Live User Tag: {details.dietaryPreference}
              </span>
            )}
          </div>
          <select
            value={isCustomDiet ? '__custom__' : normalizeDietPreset(details.dietaryPreference)}
            onChange={handleDietSelectChange}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', background: '#fff' }}
          >
            <option value="Veg">🟢 Vegetarian (Veg)</option>
            <option value="Non-Veg">🔴 Non-Vegetarian (Non-Veg)</option>
            <option value="Vegan">🌱 100% Vegan</option>
            <option value="Eggless">🥚 Eggless</option>
            <option value="Organic">🌿 Certified Organic</option>
            <option value="Jain">🙏 Jain Friendly (No Onion/Garlic)</option>
            <option value="Gluten-Free">🌾 100% Gluten-Free</option>
            <option value="Sugar-Free">🚫 Sugar-Free</option>
            <option value="Keto">🥑 Keto Friendly</option>
            <option value="Ayurvedic">🍃 100% Ayurvedic / Herbal</option>
            <option value="__custom__">✏️ Custom Speciality / Diet (Type manually)…</option>
            <option value="">⚪ Not Applicable (Non-Food / Utility)</option>
          </select>

          {isCustomDiet && (
            <div style={{ marginTop: '6px' }}>
              <input
                type="text"
                placeholder="Type custom speciality (e.g. Cold Pressed, High Protein, Sugar Free)"
                value={details.dietaryPreference || ''}
                onChange={e => update('dietaryPreference', e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: '1.5px solid #10b981',
                  background: '#f0fdf4',
                  fontSize: '12.5px',
                  boxSizing: 'border-box',
                  color: '#065f46',
                  fontWeight: 600
                }}
              />
              <small style={{ fontSize: '10.5px', color: '#047857', display: 'block', marginTop: '2px' }}>
                ✓ Admin custom tag: This exact speciality will appear directly to the customer on the product page.
              </small>
            </div>
          )}
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
            value={details.weight || unit || ''}
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
            placeholder="e.g. 1 x Pack"
            value={details.itemIncluded || (productName ? `1 x ${productName}` : '')}
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
            No key feature bullets added yet. Click "+ Add Feature Bullet" or click "✨ Auto-Fill from Name & Category" above.
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
            placeholder="e.g. Sugar, Milk solids, Cocoa solids, Wheat flour..."
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
            placeholder="e.g. Contains: Milk, Wheat (Gluten), Soy"
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
