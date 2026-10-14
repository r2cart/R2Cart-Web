import { useState } from 'react';
import { AlertTriangle, LoaderCircle, ShieldAlert } from 'lucide-react';
import { Modal } from '../../components/ui';
import { deliveryService } from '../../services/delivery.service';

const FAILURE_REASONS = [
  'Customer unavailable / Door locked',
  'Customer refused delivery / Cancelled at door',
  'Incorrect / Incomplete delivery address',
  'Customer phone unreachable / Switched off',
  'Delivery location inaccessible / Security denied',
  'Customer requested reschedule to another time',
  'Other delivery issue'
];

export function DeliveryFailureModal({ open, onClose, order, onSuccess }) {
  const [reason, setReason] = useState(FAILURE_REASONS[0]);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await deliveryService.reportFailure(order.assignmentId, {
        reason,
        notes: notes.trim()
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record failed delivery attempt');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !busy && onClose()}
      size="pod-modal"
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0
            }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#dc2626', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Delivery Exception
              </div>
              <div style={{ fontSize: '15.5px', fontWeight: 800, color: '#0f172a' }}>
                Report Failed Delivery
              </div>
            </div>
          </div>
          <span style={{
            fontSize: '11.5px',
            fontFamily: 'monospace',
            fontWeight: 700,
            padding: '3px 9px',
            borderRadius: '7px',
            background: '#0f172a',
            color: '#f87171',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
            #{order?.orderNumber}
          </span>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {/* Warning Banner */}
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '13px 15px',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <AlertTriangle size={18} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <b style={{ fontSize: '13px', display: 'block' }}>Reporting Delivery Attempt Failure:</b>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#7f1d1d', lineHeight: 1.45 }}>
                Store administrators will be notified to contact customer <b>{order?.customerName}</b> ({order?.customerPhone || 'No phone'}), review the delivery issue, and reschedule or cancel the order.
              </p>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              borderRadius: '10px',
              padding: '11px 14px',
              fontSize: '12.5px',
              fontWeight: 600
            }}>
              {error}
            </div>
          )}

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
              Failure Reason <span style={{ color: '#ef4444' }}>*</span>
            </span>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              style={{
                height: '44px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                padding: '0 12px',
                fontSize: '13.5px',
                background: '#fff',
                color: '#0f172a',
                outline: 'none'
              }}
            >
              {FAILURE_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
              Detailed Explanation / Notes <span style={{ color: '#ef4444' }}>*</span>
            </span>
            <textarea
              required
              rows="4"
              placeholder="Provide exact details (e.g., Called customer 3 times, door locked, neighbor mentioned they are out of station)..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                padding: '12px',
                fontSize: '13px',
                color: '#0f172a',
                outline: 'none',
                resize: 'vertical',
                minHeight: '90px'
              }}
            />
          </label>
        </div>

        {/* Sticky Footer */}
        <div className="modal-foot">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            style={{
              height: '44px',
              padding: '0 20px',
              borderRadius: '10px',
              border: '1.5px solid #e2e8f0',
              background: '#ffffff',
              color: '#475569',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !notes.trim()}
            style={{
              height: '44px',
              padding: '0 22px',
              borderRadius: '10px',
              border: 'none',
              background: !notes.trim() ? '#94a3b8' : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: busy || !notes.trim() ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: !notes.trim() ? 'none' : '0 4px 14px rgba(220, 38, 38, 0.3)'
            }}
          >
            {busy ? (
              <>
                <LoaderCircle className="spin" size={16} />
                <span>Recording Failure...</span>
              </>
            ) : (
              <span>Submit Failed Attempt</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
