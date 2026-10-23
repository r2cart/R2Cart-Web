import { useEffect, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  History,
  Info,
  LoaderCircle,
  MapPin,
  Megaphone,
  Power,
  RefreshCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  X
} from 'lucide-react';
import { Button, ConfirmDialog, Modal, StatusBadge } from '../../components/ui';
import { useApp } from '../../context/AppContext';
import { adminService } from '../../services/admin.service';

const EMERGENCY_TYPES = [
  { id: 'ALL_ORDERS', label: 'Pause All Orders', desc: 'Blocks all new orders (immediate & scheduled) across the store' },
  { id: 'IMMEDIATE_ONLY', label: 'Pause Immediate Orders Only', desc: 'Allows customers to place advance scheduled orders only' },
  { id: 'SCHEDULED_ONLY', label: 'Pause Scheduled Orders Only', desc: 'Immediate deliveries proceed; advance bookings disabled' },
  { id: 'SELECTED_AREAS', label: 'Selected Villages Only', desc: 'Suspend deliveries for specific villages or routes' },
  { id: 'STORE_CLOSE', label: 'Complete Store Closure', desc: 'Emergency store shutdown with customer alert notice' }
];

const EMERGENCY_REASONS = [
  { id: 'WEATHER', label: 'Severe Weather / Heavy Rain / Waterlogging' },
  { id: 'STAFF_SHORTAGE', label: 'Staff Shortage / Dark Store Capacity' },
  { id: 'HIGH_VOLUME', label: 'Peak Order Rush / Surge Volume' },
  { id: 'VEHICLE_BREAKDOWN', label: 'Delivery Vehicle / Logistics Disruption' },
  { id: 'CURFEW', label: 'Local Administrative Curfew / Road Blockade' },
  { id: 'STOCK_EMERGENCY', label: 'Dark Store Audit / Critical Restock' },
  { id: 'OTHER', label: 'Other Reason (Specify below)' }
];

export function AdminEmergency() {
  const { notify } = useApp();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [statusData, setStatusData] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [historyMeta, setHistoryMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [historyPage, setHistoryPage] = useState(1);

  // Activate Modal state
  const [activateModal, setActivateModal] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [emergencyType, setEmergencyType] = useState('ALL_ORDERS');
  const [reason, setReason] = useState('WEATHER');
  const [customReason, setCustomReason] = useState('');
  const [message, setMessage] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60'); // '30', '60', '120', '240', 'custom'
  const [customEndTime, setCustomEndTime] = useState('');
  const [autoExpire, setAutoExpire] = useState(true);
  const [selectedVillageIds, setSelectedVillageIds] = useState([]);
  const [villageSearch, setVillageSearch] = useState('');

  const loadStatus = async () => {
    try {
      const data = await adminService.getEmergencyStatus();
      setStatusData(data);
    } catch (err) {
      notify(err.message || 'Failed to fetch emergency status', 'error');
    }
  };

  const loadHistory = async (page = 1) => {
    try {
      const res = await adminService.getEmergencyHistory({ page, limit: 15 });
      setHistoryList(res.history || []);
      setHistoryMeta(res.meta || { page: 1, pages: 1, total: 0 });
    } catch {
      // silently handle history load
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadStatus(), loadHistory(historyPage)]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [historyPage]);

  const handleActivate = async e => {
    e.preventDefault();
    if (emergencyType === 'SELECTED_AREAS' && (!selectedVillageIds || selectedVillageIds.length === 0)) {
      notify('Please select at least one village / delivery area to activate restrictions', 'error');
      return;
    }
    setBusy(true);
    try {
      let endTime = null;
      if (durationMinutes === 'custom') {
        if (!customEndTime) {
          notify('Please specify the emergency end date and time', 'error');
          setBusy(false);
          return;
        }
        endTime = new Date(customEndTime).toISOString();
      } else if (durationMinutes && Number(durationMinutes) > 0) {
        endTime = new Date(Date.now() + Number(durationMinutes) * 60 * 1000).toISOString();
      }

      const defaultMsg = message.trim() || `Store deliveries are temporarily paused due to ${customReason || reason.replace(/_/g, ' ').toLowerCase()}.`;

      await adminService.activateEmergency({
        type: emergencyType,
        reason,
        customReason: reason === 'OTHER' ? customReason.trim() : null,
        message: defaultMsg,
        affectedVillageIds: emergencyType === 'SELECTED_AREAS' ? selectedVillageIds : [],
        startTime: new Date().toISOString(),
        endTime,
        autoExpire: Boolean(autoExpire && endTime)
      });

      notify('🚨 Emergency restrictions activated. Customer announcements published.');
      setActivateModal(false);
      await loadAll();
      window.dispatchEvent(new Event('grocify:settings-updated'));
    } catch (err) {
      notify(err.message || 'Failed to activate emergency restrictions', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDeactivate = async () => {
    setBusy(true);
    try {
      await adminService.deactivateEmergency();
      notify('🟢 Emergency restrictions lifted. Normal store operations resumed.');
      setConfirmDeactivate(false);
      await loadAll();
      window.dispatchEvent(new Event('grocify:settings-updated'));
    } catch (err) {
      notify(err.message || 'Failed to deactivate emergency restrictions', 'error');
    } finally {
      setBusy(false);
    }
  };

  const toggleVillageSelection = vId => {
    setSelectedVillageIds(curr =>
      curr.includes(vId) ? curr.filter(id => id !== vId) : [...curr, vId]
    );
  };

  const isEmergencyActive = Boolean(statusData?.isActive);
  const activeDetails = statusData?.emergency || {};

  return (
    <div className="admin-page">
      <div className="admin-title">
        <div>
          <h1>Emergency Management</h1>
          <p>Handle unexpected disruptions, weather emergencies, urgent order pauses, and area-specific delivery suspensions.</p>
        </div>
        <div className="row gap">
          <Button variant="outline" onClick={loadAll} disabled={loading || busy}>
            <RefreshCcw size={15} className={loading ? 'spin' : ''} /> Refresh Status
          </Button>
          {isEmergencyActive ? (
            <Button variant="danger" onClick={() => setConfirmDeactivate(true)} disabled={busy}>
              <Power size={16} /> Resume Normal Operations
            </Button>
          ) : (
            <Button
              style={{ background: '#dc2626', color: '#fff', border: 'none' }}
              onClick={() => {
                setMessage('');
                setActivateModal(true);
              }}
              disabled={busy}
            >
              <ShieldAlert size={16} /> Activate Emergency Pause
            </Button>
          )}
        </div>
      </div>

      {/* EMERGENCY STATUS BANNER */}
      <div
        className="admin-card"
        style={{
          border: isEmergencyActive ? '2px solid #ef4444' : '1px solid #10b981',
          background: isEmergencyActive
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: isEmergencyActive ? '#ef4444' : '#10b981',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                boxShadow: isEmergencyActive ? '0 0 24px rgba(239, 68, 68, 0.6)' : '0 0 24px rgba(16, 185, 129, 0.4)'
              }}
            >
              {isEmergencyActive ? <AlertOctagon size={32} /> : <CheckCircle2 size={32} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
                  {isEmergencyActive ? 'Emergency Restriction Active' : 'Normal Operations Active'}
                </h2>
                <StatusBadge status={isEmergencyActive ? 'INACTIVE' : 'ACTIVE'} />
              </div>
              <p style={{ margin: '6px 0 0', color: isEmergencyActive ? '#fca5a5' : '#86efac', fontSize: '14px' }}>
                {isEmergencyActive
                  ? `Store operational status: ${statusData?.storeStatus} — ${statusData?.statusReason}`
                  : 'All operational schedules, immediate ordering, and scheduled delivery slots are functioning normally.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {isEmergencyActive ? (
              <Button variant="danger" onClick={() => setConfirmDeactivate(true)}>
                <Power size={15} /> Lift Emergency Restrictions
              </Button>
            ) : (
              <Button
                style={{ background: '#ef4444', color: '#fff' }}
                onClick={() => setActivateModal(true)}
              >
                <ShieldAlert size={15} /> Trigger Emergency Restriction
              </Button>
            )}
          </div>
        </div>

        {/* ACTIVE RESTRICTION DETAILS CARD */}
        {isEmergencyActive && (
          <div
            style={{
              marginTop: '20px',
              padding: '16px 20px',
              borderRadius: '12px',
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px'
            }}
          >
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px' }}>Scope</span>
              <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                {EMERGENCY_TYPES.find(t => t.id === activeDetails.type)?.label || activeDetails.type || 'All Orders'}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px' }}>Reason</span>
              <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                {activeDetails.customReason || activeDetails.reason?.replace(/_/g, ' ') || 'Emergency Operations Pause'}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px' }}>Auto-Expires At</span>
              <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                {activeDetails.endTime ? new Date(activeDetails.endTime).toLocaleString('en-IN') : 'Manual Deactivation Only'}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px' }}>Customer Announcement</span>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#fecaca', fontStyle: 'italic' }}>
                "{activeDetails.message}"
              </p>
            </div>
            {activeDetails.type === 'SELECTED_AREAS' && Array.isArray(activeDetails.affectedVillageIds) && activeDetails.affectedVillageIds.length > 0 && (
              <div style={{ gridColumn: '1 / -1', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px' }}>
                  Suspended Villages ({activeDetails.affectedVillageIds.length}):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {activeDetails.affectedVillageIds.map(vId => {
                    const vObj = (statusData?.villages || []).find(v => String(v.id) === String(vId) || String(v.name).toLowerCase() === String(vId).toLowerCase());
                    const label = vObj ? vObj.name : vId;
                    return (
                      <span key={vId} style={{ background: '#ef444433', color: '#fca5a5', border: '1px solid #ef444466', padding: '3px 9px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700 }}>
                        📍 {label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* EMERGENCY CONTROL TILES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <AlertTriangle style={{ color: '#f59e0b' }} size={20} />
            <h3 style={{ margin: 0, fontSize: '16px' }}>Emergency Priority Rules</h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>
            Emergency restrictions deterministically override all normal operating schedules, seasonal hours, and weekly working timings.
          </p>
          <ul style={{ fontSize: '12px', color: 'var(--muted)', paddingLeft: '20px', margin: '10px 0 0', lineHeight: 1.7 }}>
            <li><b>Priority 1:</b> Active Emergency Pause</li>
            <li><b>Priority 2:</b> Date-Specific Special Schedule</li>
            <li><b>Priority 3:</b> Seasonal Operating Hours</li>
            <li><b>Priority 4:</b> Regular Weekly Timings</li>
            <li><b>Priority 5:</b> Global Default (7 AM – 9 PM)</li>
          </ul>
        </div>

        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Megaphone style={{ color: '#38bdf8' }} size={20} />
            <h3 style={{ margin: 0, fontSize: '16px' }}>Customer-Facing Alerts</h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>
            When an emergency is active, a high-priority sticky announcement is pinned to the customer website header and cart checkout.
          </p>
          <div
            style={{
              marginTop: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: '#991b1b',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            🚨 <b>Store Announcement:</b> {activeDetails.message || 'Store orders temporarily paused due to emergency conditions.'}
          </div>
        </div>

        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <ShieldCheck style={{ color: '#10b981' }} size={20} />
            <h3 style={{ margin: 0, fontSize: '16px' }}>Confirmed Orders Safety</h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>
            Emergency activation <b>never deletes or cancels confirmed existing customer orders</b>. Store packing teams can continue fulfilling in-flight orders safely from the Orders dashboard.
          </p>
        </div>
      </div>

      {/* EMERGENCY ACTIVITY AUDIT HISTORY */}
      <div className="admin-card">
        <div className="between" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={18} style={{ color: 'var(--green)' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Emergency Activity Log & Audit Trail</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                Immutable audit history of all emergency activations, auto-expirations, and manual deactivations.
              </p>
            </div>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Total Events: {historyMeta.total}</span>
        </div>

        {historyList.length === 0 ? (
          <p style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
            No emergency activation events recorded yet.
          </p>
        ) : (
          <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: '8px', border: '1px solid var(--line)' }}>
            <table className="admin-table" style={{ width: '100%', minWidth: '1100px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--line)' }}>
                  <th style={{ width: '100px', padding: '12px 14px', whiteSpace: 'nowrap' }}>Action</th>
                  <th style={{ width: '150px', padding: '12px 14px', whiteSpace: 'nowrap' }}>Scope</th>
                  <th style={{ width: '160px', padding: '12px 14px', whiteSpace: 'nowrap' }}>Reason</th>
                  <th style={{ minWidth: '280px', maxWidth: '360px', padding: '12px 14px' }}>Customer Message</th>
                  <th style={{ width: '170px', padding: '12px 14px', whiteSpace: 'nowrap' }}>Start Time</th>
                  <th style={{ width: '170px', padding: '12px 14px', whiteSpace: 'nowrap' }}>End Time</th>
                  <th style={{ width: '140px', padding: '12px 14px', whiteSpace: 'nowrap' }}>Triggered By</th>
                  <th style={{ width: '160px', padding: '12px 14px', whiteSpace: 'nowrap' }}>Recorded At</th>
                </tr>
              </thead>
              <tbody>
                {historyList.map(h => (
                  <tr key={h.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: h.action === 'ACTIVATE' ? '#ef444422' : h.action === 'AUTO_EXPIRE' ? '#f59e0b22' : '#10b98122',
                          color: h.action === 'ACTIVATE' ? '#ef4444' : h.action === 'AUTO_EXPIRE' ? '#f59e0b' : '#10b981'
                        }}
                      >
                        {h.action}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, whiteSpace: 'nowrap', fontSize: '12px' }}>{h.type}</td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', fontSize: '12px' }}>{h.customReason || h.reason?.replace(/_/g, ' ') || '—'}</td>
                    <td style={{ padding: '12px 14px', minWidth: '280px', maxWidth: '360px', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.45, fontSize: '12px', color: '#334155' }} title={h.message}>
                      {h.message || '—'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', whiteSpace: 'nowrap', color: '#475569' }}>
                      {h.startTime ? new Date(h.startTime).toLocaleString('en-IN') : '—'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', whiteSpace: 'nowrap', color: '#475569' }}>
                      {h.endTime ? new Date(h.endTime).toLocaleString('en-IN') : '—'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {h.adminName || 'Admin'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '11.5px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {new Date(h.createdAt).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {historyMeta.pages > 1 && (
          <div className="row end gap" style={{ marginTop: '16px' }}>
            <Button
              variant="outline"
              size="sm"
              disabled={historyPage <= 1}
              onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span style={{ fontSize: '13px', color: 'var(--muted)', alignSelf: 'center' }}>
              Page {historyPage} of {historyMeta.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={historyPage >= historyMeta.pages}
              onClick={() => setHistoryPage(p => Math.min(historyMeta.pages, p + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* ACTIVATE EMERGENCY RESTRICTIONS MODAL */}
      <Modal open={activateModal} onClose={() => setActivateModal(false)} title="Activate Emergency Restrictions" size="location-modal">
        <form onSubmit={handleActivate} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box', overflowX: 'hidden' }}>
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            <AlertOctagon size={20} style={{ flexShrink: 0 }} />
            <div>
              <b>Notice:</b> Activating this restriction will immediately modify order acceptance on the customer website and display your announcement message.
            </div>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
            <span>1. Emergency Restriction Scope *</span>
            <select
              value={emergencyType}
              onChange={e => setEmergencyType(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', boxSizing: 'border-box' }}
            >
              {EMERGENCY_TYPES.map(t => (
                <option key={t.id} value={t.id}>{t.label} — {t.desc}</option>
              ))}
            </select>
          </label>

          {emergencyType === 'SELECTED_AREAS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>
                  Select Affected Villages / Areas *
                  <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: 600, color: selectedVillageIds.length > 0 ? '#ef4444' : 'var(--muted)' }}>
                    ({selectedVillageIds.length} of {(statusData?.villages || []).length} selected)
                  </span>
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedVillageIds((statusData?.villages || []).map(v => v.id))}
                    style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', color: '#15803d' }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedVillageIds([])}
                    style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', color: '#b91c1c' }}
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Village Search Bar */}
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search village / area name..."
                  value={villageSearch}
                  onChange={e => setVillageSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px 8px 32px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '12px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Village Items Grid */}
              <div
                style={{
                  maxHeight: '190px',
                  overflowY: 'auto',
                  border: '1px solid var(--line)',
                  borderRadius: '10px',
                  padding: '8px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '6px',
                  background: '#f8fafc',
                  boxSizing: 'border-box'
                }}
              >
                {(statusData?.villages || [])
                  .filter(v => !villageSearch || v.name.toLowerCase().includes(villageSearch.toLowerCase()))
                  .map(v => {
                    const isChecked = selectedVillageIds.includes(v.id);
                    return (
                      <label
                        key={v.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          background: isChecked ? '#fef2f2' : '#ffffff',
                          border: isChecked ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: isChecked ? 700 : 500,
                          color: isChecked ? '#b91c1c' : '#334155',
                          transition: 'all 0.15s ease',
                          boxShadow: isChecked ? '0 1px 3px rgba(239,68,68,0.1)' : 'none'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleVillageSelection(v.id)}
                          style={{ accentColor: '#ef4444', cursor: 'pointer', width: '15px', height: '15px' }}
                        />
                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={v.name}>
                          {v.name}
                        </span>
                        {v.isPaused && (
                          <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', background: '#fee2e2', color: '#b91c1c', flexShrink: 0 }}>
                            Paused
                          </span>
                        )}
                      </label>
                    );
                  })}
                {(statusData?.villages || []).filter(v => !villageSearch || v.name.toLowerCase().includes(villageSearch.toLowerCase())).length === 0 && (
                  <div style={{ gridColumn: '1 / -1', padding: '12px', textAlign: 'center', color: 'var(--muted)', fontSize: '12px' }}>
                    No villages match "{villageSearch}"
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
              <span>2. Reason Category *</span>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', boxSizing: 'border-box' }}
              >
                {EMERGENCY_REASONS.map(r => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
              <span>3. Duration & Auto-Expiration</span>
              <select
                value={durationMinutes}
                onChange={e => setDurationMinutes(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', boxSizing: 'border-box' }}
              >
                <option value="30">30 Minutes</option>
                <option value="60">1 Hour (Recommended)</option>
                <option value="120">2 Hours</option>
                <option value="240">4 Hours</option>
                <option value="custom">Custom Date & Time</option>
                <option value="0">Until Manually Deactivated</option>
              </select>
            </label>
          </div>

          {reason === 'OTHER' && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
              <span>Custom Reason *</span>
              <input
                required
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                placeholder="e.g. Local transformer maintenance / road blocked"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </label>
          )}

          {durationMinutes === 'custom' && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
              <span>Auto-Expire End Date & Time *</span>
              <input
                required
                type="datetime-local"
                value={customEndTime}
                onChange={e => setCustomEndTime(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </label>
          )}

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
            <span>4. Customer-Facing Announcement Message</span>
            <textarea
              rows={3}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="e.g. Store orders temporarily paused due to heavy waterlogging in Hathua. Expected resumption in 1 hour."
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <small style={{ color: 'var(--muted)', display: 'block', marginTop: '4px', fontWeight: 400 }}>
              Displayed prominently on the customer homepage alert bar and checkout.
            </small>
          </label>

          <div className="row end gap" style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button type="button" variant="ghost" onClick={() => setActivateModal(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={busy}
              style={{ background: '#dc2626', color: '#fff', padding: '10px 18px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              {busy ? <LoaderCircle className="spin" size={16} /> : <ShieldAlert size={16} />}
              Confirm & Activate Emergency
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DEACTIVATE DIALOG */}
      <ConfirmDialog
        open={confirmDeactivate}
        onClose={() => setConfirmDeactivate(false)}
        onConfirm={handleDeactivate}
        title="Resume Normal Operations?"
        message="This will immediately lift all emergency restrictions and re-enable immediate and scheduled deliveries according to the normal operational schedule."
        confirmText="Lift Emergency Restrictions"
        cancelText="Keep Active"
      />
    </div>
  );
}
