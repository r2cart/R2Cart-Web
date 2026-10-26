import { Plus, Trash2, Tag, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Button, money } from '../ui';
import UnitSelector from './UnitSelector';

export default function NewProductPacks({ packs, onChange, disabled, basePack = null }) {
  const update = (index, key, value) => {
    onChange(packs.map((pack, i) => (i === index ? { ...pack, [key]: value } : pack)));
  };

  const removePack = (index) => {
    onChange(packs.filter((_, i) => i !== index));
  };

  const addPack = () => {
    onChange([...packs, { unit: '', mrp: '', price: '', costPrice: '', stock: '' }]);
  };

  return (
    <section className="admin-card" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
            Additional Pack Sizes & Variants
          </h3>
          <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
            Add alternate weights or bundle sizes (e.g. 250 g, 500 g, 1 kg). Each pack gets its own price, stock, and inventory SKU.
          </p>
        </div>

        <Button
          type="button"
          disabled={disabled || packs.length >= 20}
          variant="outline"
          onClick={addPack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700 }}
        >
          <Plus size={15} />
          <span>Add Another Pack Size</span>
        </Button>
      </div>

      {/* Helpful Quick Guide */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '10px 14px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: '#475569'
        }}
      >
        <Info size={16} color="#059669" style={{ flexShrink: 0 }} />
        <span>
          The primary unit entered in <b>Pricing & Inventory</b> above is <b>Pack 1 (Default)</b>. Additional sizes configured below will appear as 1-tap switcher chips on the customer product page.
        </span>
      </div>

      {/* Live Customer Preview Bar */}
      {(basePack?.unit || packs.some((p) => p.unit)) && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '12px 14px', marginBottom: '18px' }}>
          <small style={{ fontSize: '11px', fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
            Live Customer Preview on Product Page:
          </small>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {basePack?.unit && (
              <div style={{ padding: '6px 12px', borderRadius: '8px', background: '#059669', color: '#ffffff', fontSize: '12px', fontWeight: 700 }}>
                {basePack.unit} {basePack.price ? `· ${money(basePack.price)}` : ''} <small style={{ opacity: 0.8 }}>(Default)</small>
              </div>
            )}
            {packs.map((p, idx) => (
              <div
                key={idx}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: '#ffffff',
                  border: '1px solid #a7f3d0',
                  color: '#065f46',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                {p.unit || `Pack ${idx + 2}`} {p.price ? `· ${money(p.price)}` : ''}
                {p.mrp && p.price && Number(p.mrp) > Number(p.price) && (
                  <span style={{ color: '#059669', fontSize: '10.5px', marginLeft: '5px' }}>
                    (Save {money(Number(p.mrp) - Number(p.price))})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List of Additional Pack Cards */}
      {packs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 16px', border: '1.5px dashed #cbd5e1', borderRadius: '14px', color: '#64748b' }}>
          <p style={{ margin: '0 0 10px', fontSize: '13px' }}>No additional pack sizes added yet.</p>
          <Button type="button" disabled={disabled} variant="outline" onClick={addPack} style={{ fontSize: '12px' }}>
            + Add 2nd Pack Size (Optional)
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {packs.map((pack, index) => {
            const mrpNum = Number(pack.mrp || 0);
            const priceNum = Number(pack.price || 0);
            const hasError = mrpNum > 0 && priceNum > 0 && priceNum > mrpNum;
            const savings = mrpNum > priceNum ? mrpNum - priceNum : 0;
            const discountPct = mrpNum > 0 && savings > 0 ? Math.round((savings / mrpNum) * 100) : 0;

            return (
              <div
                key={index}
                style={{
                  background: '#f8fafc',
                  border: hasError ? '1.5px solid #fecaca' : '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '16px',
                  position: 'relative'
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: '#059669',
                        color: '#ffffff'
                      }}
                    >
                      Pack {index + 2}
                    </span>
                    <b style={{ fontSize: '13px', color: '#0f172a' }}>
                      {pack.unit ? pack.unit : 'New Variant'}
                    </b>
                  </div>

                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => removePack(index)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Remove</span>
                  </button>
                </div>

                {/* Form Fields Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                  {/* Smart Unit Selector */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                      Pack Size / Unit *
                    </label>
                    <UnitSelector
                      value={pack.unit}
                      disabled={disabled}
                      onChange={(val) => update(index, 'unit', val)}
                      placeholder="e.g. 1 kg or 500 g"
                    />
                  </div>

                  {/* MRP */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                      MRP (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      disabled={disabled}
                      min="0.01"
                      step="0.01"
                      value={pack.mrp}
                      placeholder="e.g. 120"
                      onChange={(e) => update(index, 'mrp', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #e2e8f0',
                        fontSize: '13.5px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Selling Price */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                      Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      disabled={disabled}
                      min="0.01"
                      step="0.01"
                      value={pack.price}
                      placeholder="e.g. 99"
                      onChange={(e) => update(index, 'price', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: hasError ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0',
                        fontSize: '13.5px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Kharid Rate / Cost */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                      Kharid Rate / Cost (₹)
                    </label>
                    <input
                      type="number"
                      disabled={disabled}
                      min="0"
                      step="0.01"
                      value={pack.costPrice || ''}
                      placeholder="e.g. 80"
                      onChange={(e) => update(index, 'costPrice', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #e2e8f0',
                        fontSize: '13.5px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Stock */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '5px' }}>
                      Initial Stock *
                    </label>
                    <input
                      type="number"
                      required
                      disabled={disabled}
                      min="0"
                      step="1"
                      value={pack.stock}
                      placeholder="e.g. 50"
                      onChange={(e) => update(index, 'stock', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #e2e8f0',
                        fontSize: '13.5px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Savings or Error Bar */}
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                  {hasError ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b91c1c', fontSize: '12px', fontWeight: 700 }}>
                      <AlertTriangle size={15} />
                      <span>Selling price (₹{priceNum}) cannot exceed MRP (₹{mrpNum})!</span>
                    </div>
                  ) : savings > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#047857', fontSize: '12px', fontWeight: 700 }}>
                      <CheckCircle size={14} color="#059669" />
                      <span>
                        Customer saves {money(savings)} ({discountPct}% OFF) on this pack!
                      </span>
                    </div>
                  ) : null}

                  {priceNum > 0 && Number(pack.costPrice) > 0 && (
                    <div style={{
                      background: priceNum >= Number(pack.costPrice) ? '#ecfdf5' : '#fef2f2',
                      border: '1px solid ' + (priceNum >= Number(pack.costPrice) ? '#a7f3d0' : '#fecaca'),
                      color: priceNum >= Number(pack.costPrice) ? '#047857' : '#b91c1c',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '11.5px',
                      fontWeight: 700
                    }}>
                      Munafa: ₹{(priceNum - Number(pack.costPrice)).toFixed(2)} / pc ({(((priceNum - Number(pack.costPrice)) / priceNum) * 100).toFixed(1)}% Margin)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
