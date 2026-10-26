import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, AlertTriangle, CheckCircle, Package, Info } from 'lucide-react';
import { Button, money } from '../ui';
import { adminService } from '../../services/admin.service';
import { useApp } from '../../context/AppContext';
import UnitSelector from './UnitSelector';

const emptyForm = { unit: '', mrp: '', price: '', costPrice: '', stock: '' };

export default function ProductVariants({ productId }) {
  const { notify, refreshProducts } = useApp();
  const [packs, setPacks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const load = async () => {
    try {
      setPacks(await adminService.productVariants(productId));
      setError('');
    } catch (reason) {
      setError(reason.message);
    }
  };

  useEffect(() => {
    load();
  }, [productId]);

  const add = async (e) => {
    e.preventDefault();
    if (!form.unit.trim()) return notify('Please select or enter a unit', 'error');
    if (!form.mrp || !form.price || form.stock === '') return notify('Complete all pack size fields', 'error');

    const mrp = Number(form.mrp);
    const price = Number(form.price);
    if (price > mrp) return notify('Selling price cannot exceed MRP', 'error');

    setBusy(true);
    try {
      await adminService.addProductVariant(productId, {
        ...form,
        mrp,
        price,
        costPrice: form.costPrice ? Number(form.costPrice) : 0,
        stock: Number(form.stock)
      });
      setForm(emptyForm);
      setShowAddForm(false);
      await load();
      await refreshProducts();
      window.dispatchEvent(new Event('grocify:products-updated'));
      notify('New pack size saved successfully');
    } catch (reason) {
      notify(reason.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const mrpNum = Number(form.mrp || 0);
  const priceNum = Number(form.price || 0);
  const hasError = mrpNum > 0 && priceNum > 0 && priceNum > mrpNum;
  const savings = mrpNum > priceNum ? mrpNum - priceNum : 0;
  const discountPct = mrpNum > 0 && savings > 0 ? Math.round((savings / mrpNum) * 100) : 0;

  return (
    <section className="admin-card" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
            Pack Sizes & Variants
          </h3>
          <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
            Each pack variant is linked to this product with its own individual price, stock, and SKU.
          </p>
        </div>

        {!showAddForm && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAddForm(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700 }}
          >
            <Plus size={15} />
            <span>Add New Pack Size</span>
          </Button>
        )}
      </div>

      {error ? (
        <div style={{ padding: '12px', background: '#fee2e2', borderRadius: '10px', color: '#b91c1c', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{error}</span>
          <Button type="button" variant="outline" onClick={load}>
            Retry
          </Button>
        </div>
      ) : null}

      {/* Existing Variants List */}
      <div style={{ marginBottom: '16px' }}>
        <b style={{ fontSize: '12.5px', color: '#334155', display: 'block', marginBottom: '8px' }}>
          Configured Packs ({packs.length}):
        </b>

        {packs.length === 0 ? (
          <div style={{ padding: '16px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', textAlign: 'center', color: '#64748b', fontSize: '12.5px' }}>
            Only the primary base pack exists for this product. You can add additional pack sizes below.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            {packs.map((pack) => (
              <div
                key={pack.id}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <b style={{ fontSize: '13px', color: '#0f172a' }}>{pack.unit}</b>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: pack.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                        color: pack.status === 'ACTIVE' ? '#15803d' : '#64748b'
                      }}
                    >
                      {pack.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '3px' }}>
                    <b style={{ fontSize: '13px', color: '#059669' }}>{money(pack.price)}</b>
                    {pack.mrp > pack.price && (
                      <del style={{ fontSize: '11px', color: '#94a3b8' }}>{money(pack.mrp)}</del>
                    )}
                    <span style={{ fontSize: '11px', color: '#64748b' }}>· {pack.stock} in stock</span>
                  </div>
                </div>

                <Link
                  to={`/admin/products/${pack.id}/edit`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: '#059669',
                    textDecoration: 'none',
                    padding: '5px 8px',
                    borderRadius: '6px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <Edit2 size={12} />
                  <span>Edit</span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Variant Form */}
      {showAddForm && (
        <form
          onSubmit={add}
          style={{
            background: '#f0fdf4',
            border: '1.5px solid #a7f3d0',
            borderRadius: '14px',
            padding: '16px',
            marginTop: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <b style={{ fontSize: '13.5px', color: '#047857' }}>Add New Pack Variant</b>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Pack Size / Unit *
              </label>
              <UnitSelector
                value={form.unit}
                onChange={(val) => setForm((prev) => ({ ...prev, unit: val }))}
                placeholder="e.g. 1 kg or 500 g"
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                MRP (₹) *
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                placeholder="e.g. 150"
                value={form.mrp}
                onChange={(e) => setForm((prev) => ({ ...prev, mrp: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Selling Price (₹) *
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                placeholder="e.g. 120"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: hasError ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Kharid Rate / Cost (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 100"
                value={form.costPrice}
                onChange={(e) => setForm((prev) => ({ ...prev, costPrice: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Stock *
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                placeholder="e.g. 40"
                value={form.stock}
                onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Validation & Savings Badge */}
          {hasError ? (
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: '#b91c1c', fontSize: '12px', fontWeight: 700 }}>
              <AlertTriangle size={15} />
              <span>Selling price (₹{priceNum}) cannot exceed MRP (₹{mrpNum})!</span>
            </div>
          ) : savings > 0 ? (
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: '#047857', fontSize: '12px', fontWeight: 700 }}>
              <CheckCircle size={14} color="#059669" />
              <span>Customer saves {money(savings)} ({discountPct}% OFF) on this pack!</span>
            </div>
          ) : null}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
            <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || hasError}>
              {busy ? 'Saving pack…' : 'Save & Publish Pack'}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
