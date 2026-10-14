import React, { useState } from 'react';
import { AlertTriangle, Trash2, MinusCircle, CheckCircle2, X } from 'lucide-react';
import { Button, money } from '../ui';

const REASON_PRESETS = [
  'Item out of stock on shelf / dark-store',
  'Damaged / expired packaging found during packing',
  'Customer requested removal / unavailable replacement',
  'Quality standard check failed'
];

export function ModifyOrderItemModal({ open, onClose, order, item, onUpdated }) {
  if (!open || !item || !order) return null;

  const currentQty = item.quantity || 1;
  const unitPrice = Number(item.price);
  const canReduce = currentQty > 1;

  const [action, setAction] = useState('OUT_OF_STOCK'); // 'OUT_OF_STOCK' | 'REDUCE_QUANTITY'
  const [newQty, setNewQty] = useState(1);
  const [reason, setReason] = useState(REASON_PRESETS[0]);
  const [customReason, setCustomReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const finalReason = reason === 'custom' ? customReason.trim() : reason;

  // Calculate live financial impact
  const deductedQty = action === 'OUT_OF_STOCK' ? currentQty : Math.max(0, currentQty - newQty);
  const deductedAmount = deductedQty * unitPrice;
  const currentTotal = Number(order.total || order.grandTotal || 0);
  const revisedTotal = Math.max(0, currentTotal - deductedAmount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!finalReason) {
      setError('Please provide a reason for order item modification');
      return;
    }
    if (action === 'REDUCE_QUANTITY' && (newQty < 1 || newQty >= currentQty)) {
      setError(`New quantity must be between 1 and ${currentQty - 1}`);
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onUpdated({
        action,
        quantity: action === 'REDUCE_QUANTITY' ? newQty : undefined,
        reason: finalReason
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to modify order item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="order-print-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(10, 15, 29, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto'
      }}
    >
      <div
        className="admin-card modal-card"
        style={{
          maxWidth: '560px',
          width: '100%',
          maxHeight: 'min(90vh, 760px)',
          display: 'flex',
          flexDirection: 'column',
          margin: 'auto',
          background: '#0f172a',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.85)'
        }}
      >
        {/* Sticky Header */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: '#131e36'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ display: 'inline-flex', padding: '6px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <AlertTriangle size={18} />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#f8fafc' }}>Modify Order Item</h3>
              <small style={{ color: '#94a3b8' }}>Order #{order.orderNumber}</small>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '6px',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              scrollbarWidth: 'thin'
            }}
          >
            {/* Target Item Card */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', background: 'rgba(255,255,255,0.04)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              {item.image && (
                <img src={item.image} alt="" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ display: 'block', fontSize: '14px', color: '#f8fafc' }}>{item.name}</b>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {item.unit} · Rate: <b>₹{unitPrice}</b> · Current Qty: <b style={{ color: '#f59e0b' }}>{currentQty}</b>
                </span>
              </div>
              <strong style={{ fontSize: '15px', color: '#f8fafc' }}>₹{unitPrice * currentQty}</strong>
            </div>

            {/* Action Choice */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
                Select Modification Action:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: canReduce ? '1fr 1fr' : '1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setAction('OUT_OF_STOCK')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    borderRadius: '10px',
                    border: action === 'OUT_OF_STOCK' ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                    background: action === 'OUT_OF_STOCK' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.02)',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <Trash2 size={18} color="#ef4444" />
                  <div>
                    <b style={{ display: 'block', fontSize: '13px' }}>Mark Out of Stock</b>
                    <small style={{ color: '#94a3b8', fontSize: '11px' }}>Remove all {currentQty} item(s)</small>
                  </div>
                </button>

                {canReduce && (
                  <button
                    type="button"
                    onClick={() => setAction('REDUCE_QUANTITY')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px',
                      borderRadius: '10px',
                      border: action === 'REDUCE_QUANTITY' ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                      background: action === 'REDUCE_QUANTITY' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.02)',
                      color: '#f8fafc',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <MinusCircle size={18} color="#f59e0b" />
                    <div>
                      <b style={{ display: 'block', fontSize: '13px' }}>Reduce Quantity</b>
                      <small style={{ color: '#94a3b8', fontSize: '11px' }}>Partial quantity available</small>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* New Quantity Selector (if reducing) */}
            {action === 'REDUCE_QUANTITY' && (
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '8px' }}>
                  New Available Quantity (Customer ordered {currentQty}):
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <select
                    value={newQty}
                    onChange={e => setNewQty(Number(e.target.value))}
                    style={{
                      background: '#1e293b',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.15)',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      width: '130px'
                    }}
                  >
                    {Array.from({ length: currentQty - 1 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n} unit{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Removing <b style={{ color: '#f59e0b' }}>{currentQty - newQty}</b> unit(s) (-₹{(currentQty - newQty) * unitPrice})
                  </span>
                </div>
              </div>
            )}

            {/* Reason Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Reason for Adjustment:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {REASON_PRESETS.map((preset) => (
                  <label
                    key={preset}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: '#e2e8f0',
                      cursor: 'pointer',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: reason === preset ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                      border: reason === preset ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent'
                    }}
                  >
                    <input
                      type="radio"
                      name="reason"
                      checked={reason === preset}
                      onChange={() => setReason(preset)}
                    />
                    <span>{preset}</span>
                  </label>
                ))}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: reason === 'custom' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                    border: reason === 'custom' ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent'
                  }}
                >
                  <input
                    type="radio"
                    name="reason"
                    checked={reason === 'custom'}
                    onChange={() => setReason('custom')}
                  />
                  <span>Other / Custom reason</span>
                </label>
              </div>
              {reason === 'custom' && (
                <input
                  type="text"
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  placeholder="Enter specific reason for removal..."
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                  required
                />
              )}
            </div>

            {/* Real-time Financial Impact Calculation */}
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                <span>Current Grand Total:</span>
                <span>₹{currentTotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#ef4444', fontWeight: 600, marginBottom: '6px' }}>
                <span>Amount Deducted from Bill:</span>
                <span>-₹{deductedAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 800, color: '#10b981', paddingTop: '6px', borderTop: '1px dashed rgba(255,255,255,0.15)' }}>
                <span>Revised Order Total:</span>
                <span>₹{revisedTotal.toFixed(2)}</span>
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                Customer will be notified of this change and the bill will be automatically updated.
              </p>
            </div>

            {error && (
              <p role="alert" style={{ color: '#ef4444', fontSize: '12px', background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </p>
            )}
          </div>

          {/* Sticky Footer with Clear, Meaningful Actions */}
          <div
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '14px 20px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              background: '#090d16'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Deduction:</span>
              <b style={{ fontSize: '14px', color: '#ef4444' }}>-₹{deductedAmount.toFixed(2)}</b>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button type="button" variant="ghost" onClick={onClose} disabled={saving} style={{ color: '#cbd5e1' }}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={saving}
                style={{
                  background: action === 'OUT_OF_STOCK' ? '#ef4444' : '#f59e0b',
                  borderColor: action === 'OUT_OF_STOCK' ? '#ef4444' : '#f59e0b',
                  color: '#fff',
                  fontWeight: 700,
                  padding: '9px 18px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: action === 'OUT_OF_STOCK' ? '0 4px 14px rgba(239,68,68,0.4)' : '0 4px 14px rgba(245,158,11,0.4)'
                }}
              >
                {saving ? (
                  'Updating Order…'
                ) : action === 'OUT_OF_STOCK' ? (
                  <>
                    <Trash2 size={15} />
                    <span>Mark Out of Stock (-₹{deductedAmount.toFixed(0)})</span>
                  </>
                ) : (
                  <>
                    <MinusCircle size={15} />
                    <span>Reduce to {newQty} (-₹{deductedAmount.toFixed(0)})</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
