import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Phone,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Camera,
  RefreshCw,
  LogOut,
  MapPin,
  ChevronDown,
  ChevronUp,
  Package,
  Wallet,
  ShieldCheck,
  XCircle,
  ExternalLink,
  Bell,
  MessageSquare,
  Copy,
  Check,
  Search,
  X,
  Volume2,
  Activity,
  ArrowRight,
  Store
} from 'lucide-react';
import { Button } from '../../components/ui';
import { useApp } from '../../context/AppContext';
import { deliveryService } from '../../services/delivery.service';
import { authService } from '../../services/auth.service';
import { DeliveryProofModal } from './DeliveryProofModal';
import { DeliveryFailureModal } from './DeliveryFailureModal';
import { DeliveryChatModal } from '../../components/DeliveryChatModal';
import { BRAND } from '../../config/brand';
import { subscribeToPush, isPushSupported, getNotificationPermission } from '../../services/pushNotification.service';

const money = val => `₹${Number(val || 0).toLocaleString('en-IN')}`;

const formatDateTime = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

function playChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

export function DeliveryDashboard() {
  const navigate = useNavigate();
  const { notify } = useApp();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [codSummary, setCodSummary] = useState(null);

  // Active filter tab: 'ALL' | 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED'
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Push notifications permission & state
  const [pushStatus, setPushStatus] = useState(() => getNotificationPermission());
  const [enablingPush, setEnablingPush] = useState(false);

  // Modals state
  const [proofModalOrder, setProofModalOrder] = useState(null);
  const [failureModalOrder, setFailureModalOrder] = useState(null);
  const [chatModalOrder, setChatModalOrder] = useState(null);

  // Expanded items state map for order card items
  const [expandedOrders, setExpandedOrders] = useState({});
  const [copiedOrderId, setCopiedOrderId] = useState(null);

  const toggleItemsExpand = (orderId) => {
    setExpandedOrders(curr => ({ ...curr, [orderId]: !curr[orderId] }));
  };

  const copyOrderNumber = (orderNumber, id) => {
    if (!orderNumber) return;
    navigator.clipboard?.writeText(orderNumber);
    setCopiedOrderId(id);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  const enableRiderNotifications = async () => {
    setEnablingPush(true);
    try {
      const res = await subscribeToPush({ role: 'DELIVERY_PERSON' });
      if (res.success) {
        setPushStatus('granted');
        notify('Push alerts enabled! You will be notified instantly when orders are assigned. 🛵');
        playChime();
      } else if (res.reason === 'permission_denied') {
        setPushStatus('denied');
        notify('Notification permission was blocked in browser settings.', 'error');
      }
    } catch (err) {
      notify(err.message || 'Failed to enable notifications', 'error');
    } finally {
      setEnablingPush(false);
    }
  };

  const loadDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [oData, pData, cData] = await Promise.all([
        deliveryService.getMyOrders({ tab: activeTab }),
        deliveryService.getMyProfile().catch(() => null),
        deliveryService.getMyCodSummary().catch(() => null)
      ]);
      const prevOrders = orders;
      const nextOrders = oData || [];

      // Check if new assignment arrived in silent refresh
      if (silent && prevOrders.length > 0 && nextOrders.length > prevOrders.length) {
        playChime();
        notify('🛵 New Delivery Assigned! Tap to view details.');
      }

      setOrders(nextOrders);
      if (pData) setProfile(pData);
      if (cData) setCodSummary(cData);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        navigate('/delivery/login', { replace: true });
        return;
      }
      if (!silent) notify(err.message || 'Failed to load assigned deliveries', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    const deliveryToken = localStorage.getItem('grocify-delivery-access-token') || localStorage.getItem('grocify-access-token');
    const raw = localStorage.getItem('grocify-delivery-user') || localStorage.getItem('grocify-user');
    let u = null;
    try { u = raw ? JSON.parse(raw) : null; } catch {}
    if (!deliveryToken || !u || u.role === 'CUSTOMER') {
      navigate('/delivery/login', { replace: true });
      return;
    }

    if (getNotificationPermission() === 'granted') {
      subscribeToPush({ role: 'DELIVERY_PERSON' }).catch(() => {});
    }
  }, [navigate]);

  useEffect(() => {
    loadDashboardData();

    // 20-second background polling
    const pollInterval = setInterval(() => {
      loadDashboardData(true);
    }, 20000);

    return () => clearInterval(pollInterval);
  }, [activeTab]);

  // Filtered orders list based on search query
  const filteredOrders = orders.filter(o => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
      (o.customerName && o.customerName.toLowerCase().includes(q)) ||
      (o.villageName && o.villageName.toLowerCase().includes(q)) ||
      (o.deliveryAddress && o.deliveryAddress.toLowerCase().includes(q))
    );
  });

  const handleDutyChange = async (newStatus) => {
    try {
      await deliveryService.updateDutyStatus({ dutyStatus: newStatus });
      setProfile(curr => ({ ...curr, dutyStatus: newStatus }));
      notify(`Duty status updated to ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      notify(err.message || 'Failed to update duty status', 'error');
    }
  };

  const handleStatusUpdate = async (assignmentId, status) => {
    try {
      await deliveryService.updateStatus(assignmentId, { status });
      notify(`Order updated to ${status.replace(/_/g, ' ')}`);
      await loadDashboardData();
    } catch (err) {
      notify(err.message || 'Failed to update status', 'error');
    }
  };

  const handleLogout = async () => {
    await authService.deliveryLogout();
    navigate('/delivery/login', { replace: true });
  };

  const currentDuty = profile?.dutyStatus || 'OFF_DUTY';

  return (
    <div className="rider-page-shell">
      {/* ================= 1. HIGH-TECH DARK SLATE NAVBAR ================= */}
      <header className="rider-header">
        <div className="rider-header-inner">
          {/* Brand & Partner Information */}
          <div className="rider-header-brand">
            <div className="rider-brand-avatar">
              <Truck size={22} strokeWidth={2.4} />
            </div>
            <div className="rider-header-info">
              <div className="rider-header-name-row">
                <span className="rider-header-title">
                  {profile?.name || 'Delivery Partner'}
                </span>
                {profile?.deliveryStaffId && (
                  <span className="rider-staff-badge">
                    {profile.deliveryStaffId}
                  </span>
                )}
              </div>
              <div className="rider-header-sub">
                {profile?.vehicleType || 'Bike'} {profile?.vehicleNumber ? `· Reg: ${profile.vehicleNumber}` : ''}
              </div>
            </div>
          </div>

          {/* Quick Header Actions: Audio Chime & Logout */}
          <div className="rider-header-top-actions">
            <button
              type="button"
              className="rider-icon-btn"
              onClick={() => {
                playChime();
                notify('Chime test sound played! 🛵');
              }}
              title="Test Order Chime"
            >
              <Volume2 size={16} />
            </button>

            <button
              type="button"
              className="rider-icon-btn danger"
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>

          {/* Duty Status Selector (Spans full-width on row 2 in mobile view) */}
          <div className="rider-duty-wrap">
            <select
              value={currentDuty}
              onChange={e => handleDutyChange(e.target.value)}
              className={`rider-duty-select ${
                currentDuty === 'ON_DUTY' ? 'on-duty' :
                currentDuty === 'ON_BREAK' ? 'on-break' : 'off-duty'
              }`}
              title="Change Duty Status"
            >
              <option value="ON_DUTY">● On Duty (Accepting Orders)</option>
              <option value="ON_BREAK">⏸ On Break (Paused)</option>
              <option value="OFF_DUTY">○ Off Duty</option>
            </select>
          </div>
        </div>
      </header>

      {/* ================= 2. FOCUSED 980PX MAIN CONTAINER ================= */}
      <main className="rider-content-wrap">
        {/* Push Notification Banner */}
        {isPushSupported() && pushStatus !== 'granted' && (
          <div className="rider-push-banner">
            <div className="rider-push-content">
              <div className="rider-push-icon">
                <Bell size={20} />
              </div>
              <div>
                <b className="rider-push-title">
                  Enable Live Delivery Dispatch Alerts
                </b>
                <span className="rider-push-desc">
                  Get instantaneous audio chimes & push notifications when new customer orders are assigned.
                </span>
              </div>
            </div>
            <button
              type="button"
              disabled={enablingPush}
              onClick={enableRiderNotifications}
              className="rider-push-btn"
            >
              {enablingPush ? 'Enabling...' : 'Turn On Alerts'}
            </button>
          </div>
        )}

        {/* ================= UNIFIED SHIFT SUMMARY CARD ================= */}
        <div className="rider-shift-ribbon">
          {/* Active Orders */}
          <div className="rider-ribbon-stat active">
            <div className="rider-ribbon-icon">
              <Truck size={20} />
            </div>
            <div>
              <span className="rider-ribbon-label">Active Tasks</span>
              <div className="rider-ribbon-val" style={{ color: '#1d4ed8' }}>
                {orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'DELIVERY_FAILED').length}
              </div>
            </div>
          </div>

          {/* Delivered Today */}
          <div className="rider-ribbon-stat delivered">
            <div className="rider-ribbon-icon">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <span className="rider-ribbon-label">Delivered Today</span>
              <div className="rider-ribbon-val" style={{ color: '#15803d' }}>
                {codSummary?.todayDeliveredCount ?? 0}
              </div>
            </div>
          </div>

          {/* Cash to Handover */}
          <div className="rider-ribbon-stat cod">
            <div className="rider-ribbon-icon">
              <Wallet size={20} />
            </div>
            <div>
              <span className="rider-ribbon-label">Cash In Hand (COD)</span>
              <div className="rider-ribbon-val" style={{ color: '#b45309' }}>
                {money(codSummary?.pendingHandoverAmount)}
              </div>
            </div>
          </div>
        </div>

        {/* ================= FILTER STRIP & SEARCH ================= */}
        <div className="rider-toolbar-row">
          <div className="rider-tab-strip">
            {[
              { id: 'ALL', label: 'All Orders' },
              { id: 'PENDING', label: 'Pending' },
              { id: 'IN_TRANSIT', label: 'In Transit' },
              { id: 'DELIVERED', label: 'Delivered' },
              { id: 'FAILED', label: 'Failed' }
            ].map(t => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`rider-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  <span>{t.label}</span>
                  {isActive && (
                    <span className="rider-tab-badge">{orders.length}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="rider-toolbar-search-wrap">
            <div className="rider-search-box">
              <Search size={15} style={{ color: '#94a3b8', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search order #, customer..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              className="rider-icon-btn"
              onClick={() => loadDashboardData()}
              disabled={loading}
              title="Refresh Deliveries"
              style={{ background: '#ffffff', color: '#475569', borderColor: '#cbd5e1' }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>

        {/* ================= ORDERS FEED ================= */}
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            color: '#64748b'
          }}>
            <RefreshCw size={28} className="spin" style={{ color: '#10b981', margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>Syncing delivery assignments...</div>
            <div style={{ fontSize: '12.5px', marginTop: '4px' }}>Connecting to R2Cart Dispatch Portal</div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1.5px dashed #cbd5e1',
            padding: '52px 24px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#f1f5f9',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px'
            }}>
              <Package size={28} />
            </div>
            <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
              No Orders in this view
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', maxWidth: '380px', marginInline: 'auto' }}>
              {searchQuery ? 'No deliveries match your search query.' : 'New deliveries will appear here as soon as dispatch assigns them.'}
            </p>
          </div>
        ) : (
          <div>
            {filteredOrders.map(order => {
              const isExpanded = Boolean(expandedOrders[order.assignmentId]);
              const isCod = order.paymentMethod === 'COD';
              const statusKey = (order.status || 'ASSIGNED').toLowerCase();
              const mapsUrl = order.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress || '')}`;

              return (
                <article key={order.assignmentId} className={`rider-task-card ${statusKey}`}>
                  {/* Compact Header: Order ID + Slot + Status */}
                  <div className="rider-card-top">
                    <div className="rider-card-id-grp">
                      <span className="rider-order-id-tag">
                        #{order.orderNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyOrderNumber(order.orderNumber, order.assignmentId)}
                        className="rider-copy-btn"
                        title="Copy Order #"
                      >
                        {copiedOrderId === order.assignmentId ? <Check size={11} style={{ color: '#10b981' }} /> : <Copy size={11} />}
                        <span>{copiedOrderId === order.assignmentId ? 'Copied' : 'Copy'}</span>
                      </button>
                      {order.deliverySlot && (
                        <span className="rider-slot-tag">
                          {order.deliverySlot}
                        </span>
                      )}
                    </div>

                    <span className={`rider-status-pill ${statusKey}`}>
                      {order.status === 'DELIVERED' && <CheckCircle2 size={11} />}
                      {order.status === 'DELIVERY_FAILED' && <XCircle size={11} />}
                      {order.status === 'OUT_FOR_DELIVERY' && <Truck size={11} />}
                      {order.status === 'PICKED_UP' && <Package size={11} />}
                      {order.status === 'ACCEPTED' && <Check size={11} />}
                      {order.status === 'ASSIGNED' && <Clock size={11} />}
                      <span>{order.status.replace(/_/g, ' ')}</span>
                    </span>
                  </div>

                  {/* High-Density Destination & Quick Actions Strip */}
                  <div className="rider-destination-strip">
                    <div className="rider-dest-header">
                      <div className="rider-dest-user">
                        <span className="rider-dest-name">{order.customerName}</span>
                        {order.villageName && (
                          <span className="rider-village-badge">{order.villageName}</span>
                        )}
                      </div>

                      {/* Quick 1-Tap Thumb Contacts */}
                      <div className="rider-quick-contacts">
                        {order.customerPhone && (
                          <a
                            href={`tel:${order.customerPhone}`}
                            className="rider-contact-btn call"
                            title={`Call ${order.customerName} (${order.customerPhone})`}
                          >
                            <Phone size={11} />
                            <span>Call</span>
                          </a>
                        )}

                        <button
                          type="button"
                          className="rider-contact-btn chat"
                          onClick={() => setChatModalOrder(order)}
                          title="Live Chat with Customer"
                        >
                          <MessageSquare size={11} />
                          <span>Chat</span>
                        </button>

                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rider-contact-btn maps"
                          title="Open directions in Google Maps GPS"
                        >
                          <Navigation size={11} />
                          <span>GPS</span>
                          <ExternalLink size={9} style={{ opacity: 0.6 }} />
                        </a>
                      </div>
                    </div>

                    {/* Address Line */}
                    <div className="rider-dest-address">
                      <MapPin size={12} className="rider-dest-pin" />
                      <span>{order.deliveryAddress}</span>
                    </div>

                    {/* Customer Delivery Note (if any) */}
                    {order.deliveryInstruction && (
                      <div className="rider-dest-note">
                        <Bell size={11} className="rider-note-bell" />
                        <span><b>Note:</b> “{order.deliveryInstruction}”</span>
                      </div>
                    )}
                  </div>

                  {/* Integrated Slim Payment & Items Bar */}
                  <div className={`rider-info-strip ${isCod ? 'cod' : 'prepaid'}`}>
                    <div className="rider-strip-payment">
                      {isCod ? (
                        <>
                          <span className="rider-strip-badge cod">💵 COD</span>
                          <span className="rider-strip-label">Collect:</span>
                          <b className="rider-strip-amount cod">
                            {money(order.codAmountToCollect || order.grandTotal)}
                          </b>
                        </>
                      ) : (
                        <>
                          <span className="rider-strip-badge prepaid">✓ PREPAID</span>
                          <span className="rider-strip-label prepaid">Paid Online · ₹0 Due</span>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleItemsExpand(order.assignmentId)}
                      className="rider-strip-items-btn"
                    >
                      <Package size={12} />
                      <span>{order.itemCount} items</span>
                      {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                  </div>

                  {/* Collapsible Items List */}
                  {isExpanded && (
                    <div style={{
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}>
                      {(order.items || []).map(it => (
                        <div key={it.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, paddingRight: '8px' }}>
                            {it.image && (
                              <img
                                src={it.image}
                                alt={it.name}
                                style={{ width: '26px', height: '26px', borderRadius: '5px', objectFit: 'cover', border: '1px solid #e2e8f0', flexShrink: 0 }}
                              />
                            )}
                            <span style={{ minWidth: 0, wordBreak: 'break-word', color: '#0f172a' }}>
                              <b>{it.name}</b> <span style={{ color: '#64748b' }}>({it.unit})</span>
                            </span>
                          </div>
                          <span style={{ fontWeight: 800, color: '#0f172a', background: '#ffffff', padding: '1px 6px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '11px', flexShrink: 0 }}>
                            x{it.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Compact Action Buttons */}
                  <div>
                    {order.status === 'ASSIGNED' && (
                      <button
                        type="button"
                        className="rider-btn-compact accept"
                        onClick={() => handleStatusUpdate(order.assignmentId, 'ACCEPTED')}
                      >
                        <CheckCircle2 size={16} />
                        <span>Accept Order Assignment</span>
                      </button>
                    )}

                    {order.status === 'ACCEPTED' && (
                      <button
                        type="button"
                        className="rider-btn-compact pickup"
                        onClick={() => handleStatusUpdate(order.assignmentId, 'PICKED_UP')}
                      >
                        <Package size={16} />
                        <span>Confirm Store Pick Up</span>
                      </button>
                    )}

                    {order.status === 'PICKED_UP' && (
                      <button
                        type="button"
                        className="rider-btn-compact start-route"
                        onClick={() => handleStatusUpdate(order.assignmentId, 'OUT_FOR_DELIVERY')}
                      >
                        <Truck size={16} />
                        <span>Start Route (Out for Delivery)</span>
                      </button>
                    )}

                    {(order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERY_PROOF_PENDING') && (
                      <div className="rider-compact-actions">
                        <button
                          type="button"
                          className="rider-btn-compact deliver"
                          onClick={() => setProofModalOrder(order)}
                        >
                          <Camera size={15} />
                          <span>{order.status === 'DELIVERY_PROOF_PENDING' ? 'Complete Proof' : 'Upload Proof & Complete'}</span>
                        </button>

                        <button
                          type="button"
                          className="rider-btn-compact-danger"
                          onClick={() => setFailureModalOrder(order)}
                          title="Report Failed Delivery"
                        >
                          <XCircle size={14} />
                          <span>Failed</span>
                        </button>
                      </div>
                    )}

                    {order.status === 'DELIVERED' && (
                      <div className="rider-compact-delivered">
                        <span style={{ color: '#15803d', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <CheckCircle2 size={14} /> Delivered on {formatDateTime(order.deliveredAt)}
                        </span>
                        {order.proofs?.[0]?.signedUrl && (
                          <a
                            href={order.proofs[0].signedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rider-proof-link"
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                          >
                            <Camera size={12} /> View Proof
                          </a>
                        )}
                      </div>
                    )}

                    {order.status === 'DELIVERY_FAILED' && (
                      <div className="rider-compact-failed">
                        <b>Failed:</b> {order.failureReason || 'Reported by staff'}
                        {order.failureNotes && <span style={{ fontStyle: 'italic', marginLeft: '6px' }}>“{order.failureNotes}”</span>}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* ================= MODALS ================= */}
      {/* Proof of Delivery Modal */}
      {proofModalOrder && (
        <DeliveryProofModal
          open={Boolean(proofModalOrder)}
          order={proofModalOrder}
          onClose={() => setProofModalOrder(null)}
          onSuccess={() => {
            notify(`Order #${proofModalOrder.orderNumber} successfully delivered!`);
            loadDashboardData();
          }}
        />
      )}

      {/* Failure Reporting Modal */}
      {failureModalOrder && (
        <DeliveryFailureModal
          open={Boolean(failureModalOrder)}
          order={failureModalOrder}
          onClose={() => setFailureModalOrder(null)}
          onSuccess={() => {
            notify(`Order #${failureModalOrder.orderNumber} marked as delivery failed`);
            loadDashboardData();
          }}
        />
      )}

      {/* Live Chat with Customer Modal */}
      {chatModalOrder && (
        <DeliveryChatModal
          isOpen={Boolean(chatModalOrder)}
          order={chatModalOrder}
          onClose={() => setChatModalOrder(null)}
          role="DELIVERY_PERSON"
        />
      )}
    </div>
  );
}

export default DeliveryDashboard;
