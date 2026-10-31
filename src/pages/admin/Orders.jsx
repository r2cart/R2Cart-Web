function getAdminUser() {
  try {
    return JSON.parse(localStorage.getItem('r2cart-admin-user')) || null;
  } catch {
    return null;
  }
}

import { useEffect, useState, useMemo } from 'react';
import { Link, useParams, useLocation, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Eye, Printer, AlertTriangle, Truck, Camera, ExternalLink,
  Zap, Calendar, Clock, Phone, Mail, MapPin, Check, Copy, RefreshCw,
  Package, Search, X, CheckCircle2, ChevronRight, ShieldCheck, UserCheck, CheckCircle
} from 'lucide-react';
import { Button, Modal, Pagination, StatusBadge, money } from '../../components/ui';
import { useApp } from '../../context/AppContext';
import { adminService } from '../../services/admin.service';
import { addressText } from '../../utils/address';
import { OrderPrintModal } from '../../components/admin/OrderPrintView';
import { ModifyOrderItemModal } from '../../components/admin/ModifyOrderItemModal';
import '../../components/admin/order-print.css';
import './admin-orders.css';
import { hasPermission } from '../../utils/permissions';

const statuses = ['New', 'Confirmed', 'Packing', 'Out for Delivery', 'Delivered', 'Cancelled'];
const ADMIN_CANCEL_REASONS = [
  'Customer requested cancellation via call/chat',
  'Out of stock / damaged items in warehouse',
  'Delivery address unserviceable / invalid phone',
  'Customer refused delivery at doorstep',
  'Duplicate or test order',
  'Suspected fraudulent activity',
  'Other reason'
];
const date = value => new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

let adminOrdersCache = null;

export function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const prefix = location.pathname.startsWith('/super-admin') ? '/super-admin' : '/admin';

  // Read URL query params or fallback
  const initialType = (searchParams.get('type') || 'ALL').toUpperCase();
  const initialStatus = searchParams.get('status') || 'All';
  const initialSearch = searchParams.get('q') || '';

  const [deliveryType, setDeliveryType] = useState(['ALL', 'INSTANT', 'SCHEDULED'].includes(initialType) ? initialType : 'ALL');
  const [tab, setTab] = useState(statuses.includes(initialStatus) ? initialStatus : 'All');
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(adminOrdersCache || null);
  const [loading, setLoading] = useState(!adminOrdersCache);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  // Sync state to URL params cleanly
  const updateDeliveryType = (type) => {
    setDeliveryType(type);
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (type === 'ALL') {
      newParams.delete('type');
    } else {
      newParams.set('type', type.toLowerCase());
    }
    setSearchParams(newParams, { replace: true });
  };

  const updateStatusTab = (status) => {
    setTab(status);
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (status === 'All') {
      newParams.delete('status');
    } else {
      newParams.set('status', status);
    }
    setSearchParams(newParams, { replace: true });
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (!searchQuery.trim()) {
      newParams.delete('q');
    } else {
      newParams.set('q', searchQuery.trim());
    }
    setSearchParams(newParams, { replace: true });
    setRefresh(v => v + 1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('q');
    setSearchParams(newParams, { replace: true });
    setRefresh(v => v + 1);
  };

  useEffect(() => {
    let active = true;
    if (!adminOrdersCache) setLoading(true);

    const query = {
      page,
      limit: 20,
      ...(tab !== 'All' && { status: tab }),
      ...(deliveryType !== 'ALL' && { deliveryType }),
      ...(searchQuery.trim() && { q: searchQuery.trim() })
    };

    adminService.ordersPage(query).then(value => {
      if (active) {
        adminOrdersCache = value;
        setResult(value);
        setError('');
      }
    }).catch(reason => {
      if (active) {
        setError(reason.message);
        setResult(null);
      }
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [deliveryType, tab, page, refresh]);

  const counts = result?.counts || { all: 0, instant: 0, scheduled: 0 };

  return (
    <>
      <div className="admin-title">
        <div>
          <h1>Orders Queue</h1>
          <p>Real-time order dispatch, instant delivery queue & slot scheduling.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" disabled={loading} onClick={() => setRefresh(value => value + 1)}>
            <RefreshCw size={14} style={{ marginRight: '6px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </Button>
        </div>
      </div>

      {/* TOP DELIVERY MODE SWITCHER: ALL vs INSTANT vs SCHEDULED */}
      <div className="orders-type-nav">
        <button
          type="button"
          className={`type-nav-card ${deliveryType === 'ALL' ? 'active mode-all' : ''}`}
          onClick={() => updateDeliveryType('ALL')}
        >
          <div className="type-nav-icon all">
            <Package size={22} />
          </div>
          <div className="type-nav-meta">
            <div className="type-nav-meta-top">
              <span className="type-nav-title">All Orders</span>
              <span className="type-nav-badge all">{counts.all || result?.pagination?.total || 0}</span>
            </div>
            <p className="type-nav-subtext">Consolidated live order queue</p>
          </div>
        </button>

        <button
          type="button"
          className={`type-nav-card ${deliveryType === 'INSTANT' ? 'active mode-instant' : ''}`}
          onClick={() => updateDeliveryType('INSTANT')}
        >
          <div className="type-nav-icon instant">
            <Zap size={22} />
          </div>
          <div className="type-nav-meta">
            <div className="type-nav-meta-top">
              <span className="type-nav-title">⚡ Instant Express</span>
              <span className="type-nav-badge instant">{counts.instant || 0}</span>
            </div>
            <p className="type-nav-subtext">10–15 min quick commerce queue</p>
          </div>
        </button>

        <button
          type="button"
          className={`type-nav-card ${deliveryType === 'SCHEDULED' ? 'active mode-scheduled' : ''}`}
          onClick={() => updateDeliveryType('SCHEDULED')}
        >
          <div className="type-nav-icon scheduled">
            <Calendar size={22} />
          </div>
          <div className="type-nav-meta">
            <div className="type-nav-meta-top">
              <span className="type-nav-title">📅 Scheduled Orders</span>
              <span className="type-nav-badge scheduled">{counts.scheduled || 0}</span>
            </div>
            <p className="type-nav-subtext">Future date & time slot queue</p>
          </div>
        </button>
      </div>

      {/* SCHEDULED QUEUE INFO NOTICE */}
      {deliveryType === 'SCHEDULED' && (
        <div style={{
          background: '#eff6ff',
          border: '1.5px solid #bfdbfe',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Calendar size={20} style={{ color: '#2563eb', flexShrink: 0 }} />
          <div style={{ fontSize: '13px', color: '#1e40af' }}>
            <b>Scheduled Delivery Queue:</b> Orders are booked for specific customer date & time windows. Prioritize packing based on the upcoming delivery slot to ensure timely handover.
          </div>
        </div>
      )}

      {/* FILTER TABS & SEARCH BAR ROW */}
      <div className="orders-filter-row">
        <div className="tabs admin-tabs" style={{ margin: 0 }}>
          {['All', ...statuses].map(value => (
            <button
              type="button"
              className={tab === value ? 'active' : ''}
              onClick={() => updateStatusTab(value)}
              key={value}
            >
              {value}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="orders-search-input-wrap">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search order #, customer, mobile…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" onClick={handleClearSearch} className="orders-search-clear">
              <X size={15} />
            </button>
          )}
        </form>
      </div>

      {/* ORDERS TABLE CARD */}
      <div className="admin-card table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {['Order & Schedule', 'Customer Details', 'Items', 'Total', 'Payment', 'Status', 'Action'].map(label => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && !result?.orders?.length ? (
                Array.from({ length: 8 }).map((_, idx) => (
                  <tr key={`ord-skel-${idx}`}>
                    <td>
                      <div className="r2c-skeleton-box" style={{ width: '110px', height: '16px', borderRadius: '4px', marginBottom: '6px' }} />
                      <div className="r2c-skeleton-box" style={{ width: '130px', height: '12px', borderRadius: '4px' }} />
                    </td>
                    <td>
                      <div className="r2c-skeleton-box" style={{ width: '140px', height: '16px', borderRadius: '4px', marginBottom: '6px' }} />
                      <div className="r2c-skeleton-box" style={{ width: '100px', height: '12px', borderRadius: '4px' }} />
                    </td>
                    <td>
                      <div className="r2c-skeleton-box" style={{ width: '80px', height: '14px', borderRadius: '4px' }} />
                    </td>
                    <td>
                      <div className="r2c-skeleton-box" style={{ width: '70px', height: '16px', borderRadius: '4px' }} />
                    </td>
                    <td>
                      <div className="r2c-skeleton-box" style={{ width: '60px', height: '22px', borderRadius: '12px' }} />
                    </td>
                    <td>
                      <div className="r2c-skeleton-box" style={{ width: '80px', height: '22px', borderRadius: '12px' }} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <div className="r2c-skeleton-box" style={{ width: '65px', height: '30px', borderRadius: '6px' }} />
                        <div className="r2c-skeleton-box" style={{ width: '30px', height: '30px', borderRadius: '6px' }} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan="7">
                    <p role="alert" style={{ color: '#dc2626' }}>{error}</p>
                    <Button variant="outline" onClick={() => setRefresh(value => value + 1)}>Try again</Button>
                  </td>
                </tr>
              ) : !result?.orders?.length ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{ color: '#64748b', fontSize: '14px' }}>
                      No orders found matching the selected filters.
                    </div>
                    {(tab !== 'All' || deliveryType !== 'ALL' || searchQuery) && (
                      <button
                        type="button"
                        onClick={() => { updateDeliveryType('ALL'); updateStatusTab('All'); handleClearSearch(); }}
                        style={{ marginTop: '10px', background: 'none', border: 'none', color: '#059669', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
                      >
                        Reset all filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : result.orders.map(order => (
                <tr key={order.id}>
                  <td>
                    <Link
                      to={`${prefix}/orders/${order.id}`}
                      style={{ fontWeight: 800, color: '#0f172a', textDecoration: 'none', fontSize: '14px', letterSpacing: '-0.3px' }}
                    >
                      #{order.orderNumber}
                    </Link>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      {date(order.date)}
                    </div>
                    <div style={{ marginTop: '6px' }}>
                      {order.deliveryType === 'SCHEDULED' ? (
                        <span className="order-type-chip-lg scheduled" style={{ padding: '3px 8px', fontSize: '11px' }}>
                          <Calendar size={12} /> {order.deliveryDate} · {order.deliverySlot}
                        </span>
                      ) : (
                        <span className="order-type-chip-lg instant" style={{ padding: '3px 8px', fontSize: '11px' }}>
                          <Zap size={12} /> Instant Express
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
                      {order.customer || 'Customer'}
                    </div>
                    {order.mobile && (
                      <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                        <a href={`tel:${order.mobile}`} style={{ color: '#059669', textDecoration: 'none', fontWeight: 600 }}>
                          📞 {order.mobile}
                        </a>
                      </div>
                    )}
                    {order.addressSnapshot && (
                      <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '5px', maxWidth: '240px', lineHeight: 1.35 }}>
                        <span style={{ color: '#059669', fontWeight: 700 }}>📍 </span>
                        <span>{addressText(order.addressSnapshot).line}</span>
                        {addressText(order.addressSnapshot).cityLine && (
                          <span style={{ display: 'block', color: '#64748b', fontSize: '10.5px', marginTop: '1px' }}>
                            {addressText(order.addressSnapshot).cityLine}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                    <small style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </small>
                  </td>
                  <td>
                    <b style={{ fontSize: '14px', color: '#0f172a' }}>{money(order.total)}</b>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                      {order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}
                    </div>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      marginTop: '3px',
                      background: order.paymentStatus === 'PAID' ? '#dcfce7' : '#fef3c7',
                      color: order.paymentStatus === 'PAID' ? '#15803d' : '#92400e'
                    }}>
                      {order.paymentStatus || 'PENDING'}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={order.status} />
                    {order.status === 'Delivered' && (
                      <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 600, marginTop: '4px' }}>
                        ✓ {order.deliveredAt ? date(order.deliveredAt) : 'Delivered'}
                      </div>
                    )}
                    {order.status === 'Cancelled' && (
                      <div style={{ marginTop: '5px' }}>
                        <div
                          style={{
                            display: 'inline-block',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#9f1239',
                            background: '#ffe4e6',
                            border: '1px solid #fecdd3',
                            padding: '2px 7px',
                            borderRadius: '5px',
                            maxWidth: '180px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={`Cancellation Reason: ${order.cancellationReason || 'Reason not recorded'}${order.cancelledBy ? ` (by ${order.cancelledBy})` : ''}`}
                        >
                          Reason: {order.cancellationReason || 'Cancelled'}
                        </div>
                        {order.cancelledBy && (
                          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                            By {order.cancelledBy}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <Link
                      className="icon-btn"
                      aria-label="View order details"
                      to={`${prefix}/orders/${order.id}`}
                      style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                    >
                      <Eye size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && result?.pagination?.pages > 1 && (
        <Pagination page={page} setPage={setPage} total={result.pagination.pages} />
      )}
    </>
  );
}

// ----------------------------------------------------------------------
// ENHANCED ORDER DETAILS COMPONENT (MATCHING 2ND SCREENSHOT REQUIREMENTS)
// ----------------------------------------------------------------------
export function AdminOrderDetails() {
  const { id } = useParams();
  const location = useLocation();
  const prefix = location.pathname.startsWith('/super-admin') ? '/super-admin' : '/admin';

  const { notify, refreshProducts, storeSettings } = useApp();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);
  const [copied, setCopied] = useState(false);

  // Enterprise Print & OOS Handling state
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [modifyItemModal, setModifyItemModal] = useState(null);

  // Admin Cancellation Modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedAdminReason, setSelectedAdminReason] = useState(ADMIN_CANCEL_REASONS[0]);
  const [customAdminReason, setCustomAdminReason] = useState('');
  const [cancelError, setCancelError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setOrder(null);
    adminService.order(id).then(value => {
      if (active) {
        setOrder(value);
        setStatus(value.status);
        setError('');
      }
    }).catch(reason => {
      if (active) setError(reason.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [id, reload]);

  const copyOrderNumber = () => {
    if (!order?.orderNumber) return;
    navigator.clipboard.writeText(order.orderNumber);
    setCopied(true);
    notify('Order ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const save = async (nextStatus, customReason) => {
    const targetStatus = nextStatus || status;
    if (targetStatus === 'Cancelled' && !customReason) {
      setCancelModalOpen(true);
      return;
    }
    setSaving(true);
    try {
      const value = await adminService.updateOrderStatus(id, targetStatus, customReason);
      setOrder(value);
      setStatus(value.status);
      await refreshProducts();
      window.dispatchEvent(new Event('r2cart:orders-updated'));
      window.dispatchEvent(new Event('r2cart:products-updated'));
      notify(`Order updated to ${targetStatus}`);
    } catch (reason) {
      notify(reason.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAdminCancelSubmit = async (e) => {
    if (e) e.preventDefault();
    const finalReason = selectedAdminReason === 'Other reason'
      ? customAdminReason.trim()
      : selectedAdminReason;

    if (selectedAdminReason === 'Other reason' && !finalReason) {
      setCancelError('Please enter a cancellation reason');
      return;
    }

    setSaving(true);
    setCancelError('');
    try {
      const value = await adminService.updateOrderStatus(id, 'Cancelled', finalReason);
      setOrder(value);
      setStatus(value.status);
      setCancelModalOpen(false);
      await refreshProducts();
      window.dispatchEvent(new Event('r2cart:orders-updated'));
      window.dispatchEvent(new Event('r2cart:products-updated'));
      notify('Order cancelled successfully');
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel order');
    } finally {
      setSaving(false);
    }
  };

  const handleModifyItem = async (payload) => {
    try {
      const updated = await adminService.modifyOrderItem(order.id, modifyItemModal.id, payload);
      setOrder(updated);
      setStatus(updated.status);
      await refreshProducts();
      window.dispatchEvent(new Event('r2cart:orders-updated'));
      window.dispatchEvent(new Event('r2cart:products-updated'));
      notify('Order items and total updated successfully');
    } catch (err) {
      notify(err.message || 'Failed to update order item', 'error');
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="order-details-shell" style={{ padding: '60px 0', textAlign: 'center' }}>
        <div className="confirm-loader-spin" style={{ width: '28px', height: '28px', margin: '0 auto 12px' }} />
        <h3 style={{ color: '#0f172a', margin: 0 }}>Loading order details…</h3>
        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Fetching live information from database</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-details-shell">
        <Link className="order-back-btn" to={`${prefix}/orders`}>
          <ArrowLeft size={16} /> Back to orders
        </Link>
        <div className="admin-card bulk-error" style={{ marginTop: '20px' }}>
          <p role="alert">{error || 'Order not found'}</p>
          <Button variant="outline" onClick={() => setReload(value => value + 1)}>Try again</Button>
        </div>
      </div>
    );
  }

  const address = addressText(order.addressSnapshot);
  const terminal = ['Delivered', 'Cancelled'].includes(order.status);
  const isScheduled = order.deliveryType === 'SCHEDULED';
  const currentUser = getAdminUser();
  const isSuper = currentUser?.role === 'SUPER_ADMIN' || currentUser?.staffRole === 'SUPER_ADMIN';
  const canUpdateStatus = isSuper || hasPermission(currentUser, 'orders.update_status');
  const canCancel = isSuper || hasPermission(currentUser, 'orders.cancel');
  const isOutForDelivery = order.status === 'Out for Delivery';

  const allowedStatuses = statuses.filter(s => {
    if (s === 'Cancelled') {
      if (['Out for Delivery', 'Delivered'].includes(order.status)) return false;
      return canCancel;
    }
    return canUpdateStatus;
  });

  // Calculate visual stepper progress
  const stepperSteps = ['New', 'Confirmed', 'Packing', 'Out for Delivery', 'Delivered'];
  const currentStepIndex = stepperSteps.indexOf(order.status);
  const isCancelled = order.status === 'Cancelled';

  // Quick next-stage helper
  const nextStage = order.status === 'New' ? 'Confirmed' : order.status === 'Confirmed' ? 'Packing' : null;

  return (
    <div className="order-details-shell">
      {/* 1. TOP BREADCRUMB / BACK BAR */}
      <div className="order-details-top-bar">
        <Link className="order-back-btn" to={`${prefix}/orders`}>
          <ArrowLeft size={16} />
          <span>Back to orders</span>
        </Link>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="outline"
            onClick={() => setReload(v => v + 1)}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <RefreshCw size={14} /> Refresh
          </Button>
          <Button
            variant="primary"
            onClick={() => setPrintModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <Printer size={15} />
            <span>Print Slip / Invoice</span>
          </Button>
        </div>
      </div>

      {/* 2. EXECUTIVE ORDER HEADER CARD */}
      <div className="order-details-header-card">
        <div className="order-header-primary-row">
          <div className="order-header-title-block">
            <div className="order-header-title-row">
              <h1 className="order-header-id">Order #{order.orderNumber}</h1>
              <button
                type="button"
                className="order-copy-chip"
                onClick={copyOrderNumber}
                title="Copy order ID"
              >
                {copied ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <div className="order-meta-info">
              <span className="order-meta-item">
                <Clock size={13} />
                Placed {date(order.date)} · India time
              </span>
              {order.status === 'Delivered' && (
                <span className="order-meta-item" style={{ color: '#15803d', fontWeight: 700 }}>
                  <CheckCircle size={13} />
                  Delivered on {order.deliveredAt ? date(order.deliveredAt) : 'Yes'}
                  {order.deliveryPerson?.name ? ` by ${order.deliveryPerson.name}` : ''}
                </span>
              )}
            </div>
          </div>

          <div className="order-header-actions">
            {isScheduled ? (
              <span className="order-type-chip-lg scheduled">
                <Calendar size={14} />
                <span>Scheduled: {order.deliveryDate} · {order.deliverySlot}</span>
              </span>
            ) : (
              <span className="order-type-chip-lg instant">
                <Zap size={14} />
                <span>Instant Express (10-15 Min)</span>
              </span>
            )}

            <div className={`order-status-pill-lg ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
              <span className={`order-status-dot ${!terminal ? 'pulse' : ''}`} />
              <span>{order.status}</span>
            </div>
          </div>
        </div>

        {/* 3. VISUAL ORDER PIPELINE (STEPPER) */}
        {!isCancelled ? (
          <div className="order-stepper-box">
            <div className="order-stepper-pipeline">
              <div className="order-step-line">
                <div
                  className="order-step-line-progress"
                  style={{
                    width: currentStepIndex >= 0 ? `${(currentStepIndex / (stepperSteps.length - 1)) * 100}%` : '0%'
                  }}
                />
              </div>

              {stepperSteps.map((step, idx) => {
                const isCompleted = currentStepIndex > idx;
                const isCurrent = currentStepIndex === idx;
                return (
                  <div
                    key={step}
                    className={`order-step-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                  >
                    <div className="order-step-bubble">
                      {isCompleted ? <Check size={16} strokeWidth={3} /> : idx + 1}
                    </div>
                    <span className="order-step-title">{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="order-cancelled-summary-card" style={{
            marginTop: '16px',
            padding: '16px 20px',
            background: '#fff1f2',
            border: '1.5px solid #fecdd3',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(225, 29, 72, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: '#ffe4e6',
                border: '1.5px solid #fca5a5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: '#e11d48'
              }}>
                <AlertTriangle size={22} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#9f1239' }}>
                      This order was Cancelled
                    </h4>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      background: '#e11d48',
                      color: '#ffffff',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px'
                    }}>
                      Cancelled
                    </span>
                  </div>
                  {order.cancelledAt && (
                    <span style={{ fontSize: '12px', color: '#be123c', fontWeight: 600 }}>
                      🕒 Cancelled on {date(order.cancelledAt)}
                    </span>
                  )}
                </div>

                <div style={{
                  marginTop: '12px',
                  padding: '12px 16px',
                  background: '#ffffff',
                  border: '1.5px solid #fecdd3',
                  borderRadius: '10px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '12px'
                }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#881337', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                      Cancellation Reason
                    </span>
                    <div style={{
                      fontSize: '13.5px',
                      fontWeight: 800,
                      color: '#9f1239',
                      background: '#fff1f2',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      display: 'inline-block',
                      border: '1px solid #fecdd3'
                    }}>
                      {order.cancellationReason || 'Reason not recorded'}
                    </div>
                  </div>

                  <div>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#881337', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                      Cancelled By
                    </span>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1f2937' }}>
                      👤 {order.cancelledBy || 'Customer'}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '10px', fontSize: '12px', color: '#be123c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={14} style={{ color: '#059669', strokeWidth: 3 }} />
                  <span>Inventory allocations, coupons, and discounts have been handled. Deducted items returned to catalog stock.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. MAIN DETAILS 2-COLUMN GRID */}
      <div className="order-details-grid">
        {/* LEFT COLUMN: ITEMS, BILL BREAKDOWN, HISTORY */}
        <div>
          {/* CARD 1: ORDER ITEMS */}
          <div className="admin-section-card">
            <div className="admin-section-head">
              <h3 className="admin-section-title">
                <Package size={18} />
                <span>Order Items</span>
              </h3>
              <span className="admin-section-badge">
                {order.items.length} {order.items.length === 1 ? 'item' : 'items'} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} units total
              </span>
            </div>

            {!terminal && (
              <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: '#64748b' }}>
                💡 Click &apos;Adjust&apos; if any item is out of stock in your warehouse to refund or partially fulfill.
              </p>
            )}

            <div className="enhanced-items-list">
              {order.items.map(item => (
                <div className="enhanced-order-item" key={item.id}>
                  <div className="enhanced-item-left">
                    <img
                      src={item.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5"%3E%3Cpath d="m7.5 4.27 9 5.15"%3E%3C/path%3E%3Cpath d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"%3E%3C/path%3E%3C/svg%3E'}
                      alt={item.name || 'Order item'}
                      className="enhanced-item-img"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5"%3E%3Cpath d="m7.5 4.27 9 5.15"%3E%3C/path%3E%3Cpath d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"%3E%3C/path%3E%3C/svg%3E';
                      }}
                    />
                    <div className="enhanced-item-info">
                      <span className="enhanced-item-name">{item.name}</span>
                      <div className="enhanced-item-chips">
                        <span className="item-unit-pill">{item.unit || 'Standard'}</span>
                        <span className="item-unit-pill">Qty: {item.quantity}</span>
                        {item.sku && <span className="item-sku-pill">SKU: {item.sku}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="enhanced-item-right">
                    <div className="enhanced-item-price-col">
                      <div className="enhanced-item-total">{money(item.price * item.quantity)}</div>
                      <div className="enhanced-item-calc">
                        {item.quantity > 1 ? `${money(item.price)} × ${item.quantity}` : money(item.price)}
                      </div>
                    </div>

                    {!terminal && !isOutForDelivery && canUpdateStatus && (
                      <button
                        type="button"
                        className="item-adjust-btn"
                        onClick={() => setModifyItemModal(item)}
                        title="Out of stock / Reduce quantity"
                      >
                        <AlertTriangle size={13} />
                        <span>Adjust</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CARD 2: BILL BREAKDOWN */}
          <div className="admin-section-card">
            <div className="admin-section-head">
              <h3 className="admin-section-title">
                <ShieldCheck size={18} />
                <span>Bill Breakdown & Financials</span>
              </h3>
            </div>

            <div className="bill-breakdown-table">
              <div className="bill-row">
                <span>Items at MRP</span>
                <b>{money(order.itemTotal)}</b>
              </div>

              {Number(order.productDiscount) > 0 && (
                <div className="bill-row discount">
                  <span>Product Savings (Store Discount)</span>
                  <b>- {money(order.productDiscount)}</b>
                </div>
              )}

              {Number(order.couponDiscount) > 0 && (
                <div className="bill-row coupon-highlight">
                  <span>
                    🏷️ Coupon Savings {order.coupon?.code ? `(${order.coupon.code})` : ''}
                  </span>
                  <b>- {money(order.couponDiscount)}</b>
                </div>
              )}

              <div className="bill-row">
                <span>Delivery Fee</span>
                <b>{Number(order.deliveryFee) === 0 ? <span style={{ color: '#15803d' }}>FREE</span> : money(order.deliveryFee)}</b>
              </div>

              {/* Grand Total Highlight Banner */}
              <div className="bill-grand-banner">
                <div className="bill-grand-left">
                  <span className="bill-grand-label">Grand Total</span>
                  <span className="bill-grand-payment-badge">
                    {order.paymentMethod === 'COD' ? '💵 Cash on Delivery' : '💳 Online Payment'} · {order.paymentStatus || 'PENDING'}
                  </span>
                </div>
                <div className="bill-grand-amount">
                  {money(order.total)}
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: AUDIT HISTORY TIMELINE */}
          <div className="admin-section-card">
            <div className="admin-section-head">
              <h3 className="admin-section-title">
                <Clock size={18} />
                <span>Order Status Audit Trail</span>
              </h3>
            </div>

            <div className="enhanced-timeline">
              {order.history?.length ? order.history.map(event => {
                const isCancelledEvt = event.status === 'CANCELLED';
                return (
                  <div className={`timeline-event-row ${isCancelledEvt ? 'cancelled-evt' : ''}`} key={event.id}>
                    <div
                      className="timeline-dot"
                      style={isCancelledEvt ? { background: '#e11d48', borderColor: '#fca5a5' } : {}}
                    />
                    <div className="timeline-event-content">
                      <div className="timeline-event-head">
                        <span
                          className="timeline-event-status"
                          style={isCancelledEvt ? { color: '#e11d48', fontWeight: 800 } : {}}
                        >
                          {event.status.replaceAll('_', ' ')}
                        </span>
                        <span className="timeline-event-time">
                          {date(event.createdAt)}
                        </span>
                      </div>
                      {event.note && (
                        <p
                          className="timeline-event-note"
                          style={isCancelledEvt ? {
                            color: '#9f1239',
                            fontWeight: 600,
                            background: '#fff1f2',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #fecdd3',
                            marginTop: '6px'
                          } : {}}
                        >
                          {event.note}
                        </p>
                      )}
                    </div>
                  </div>
                );
              }) : (
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  No previous status transitions recorded yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIONS, SCHEDULE, CUSTOMER, RIDER & POD */}
        <div>
          {/* CARD 4: PRINT & FULFILMENT ACTIONS */}
          <div className="admin-section-card">
            <div className="admin-section-head">
              <h3 className="admin-section-title">
                <CheckCircle2 size={18} />
                <span>Fulfilment & Actions</span>
              </h3>
            </div>

            <div className="action-workflow-card">
              {/* Quick 1-tap advance button */}
              {!terminal && nextStage && canUpdateStatus && (
                <div className="status-advance-banner">
                  <div className="status-advance-left">
                    <span className="status-advance-label">Recommended Next Step</span>
                    <span className="status-advance-target">Advance to {nextStage}</span>
                  </div>
                  <button
                    type="button"
                    className="status-advance-btn"
                    disabled={saving}
                    onClick={() => save(nextStage)}
                  >
                    {saving ? 'Updating…' : `Mark ${nextStage} →`}
                  </button>
                </div>
              )}

              {/* Status Select dropdown */}
              <div className="status-select-wrap">
                <label className="status-select-label">Change Order Status</label>
                {canUpdateStatus || canCancel ? (
                  <>
                    <select
                      className="modern-status-select"
                      value={status}
                      disabled={saving || terminal}
                      onChange={event => setStatus(event.target.value)}
                    >
                      {allowedStatuses.map(value => <option key={value}>{value}</option>)}
                    </select>

                    <Button
                      className="wide"
                      disabled={saving || terminal || status === order.status}
                      onClick={() => save()}
                      style={{ marginTop: '4px' }}
                    >
                      {saving ? 'Saving…' : 'Save Status'}
                    </Button>
                  </>
                ) : (
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                    Your staff account does not have permission to update fulfillment status.
                  </p>
                )}
              </div>

              {isOutForDelivery && (
                <div style={{
                  fontSize: '12px',
                  color: '#0369a1',
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  padding: '10px 12px',
                  borderRadius: '10px'
                }}>
                  🚚 <b>Order is Out for Delivery:</b> Partner is en route. Cancellation and items modifications are locked.
                </div>
              )}

              {terminal && (
                <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                  ✓ This order has reached terminal status ({order.status}).
                </p>
              )}

              {isCancelled && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px 12px',
                  background: '#fff1f2',
                  border: '1px solid #fecdd3',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#9f1239'
                }}>
                  <div style={{ fontWeight: 700, marginBottom: '2px' }}>Order Cancelled</div>
                  <div>Reason: <b>{order.cancellationReason || 'Reason not recorded'}</b></div>
                  <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>Initiated by {order.cancelledBy || 'Customer'}</div>
                </div>
              )}
            </div>
          </div>

          {/* CARD 5: DELIVERY SCHEDULE & INSTRUCTIONS */}
          <div className="admin-section-card">
            <div className="admin-section-head">
              <h3 className="admin-section-title">
                <Calendar size={18} />
                <span>Delivery Window</span>
              </h3>
            </div>

            {isScheduled ? (
              <div className="order-type-chip-lg scheduled" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
                <Calendar size={16} />
                <span>Scheduled: {order.deliveryDate} · {order.deliverySlot}</span>
              </div>
            ) : (
              <div className="order-type-chip-lg instant" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
                <Zap size={16} />
                <span>⚡ Instant Express Delivery (10–15 Mins)</span>
              </div>
            )}

            {order.deliveryInstruction && (
              <div className="delivery-notes-callout">
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <div>
                  <b>Customer Instruction:</b>
                  <p style={{ margin: '2px 0 0 0' }}>{order.deliveryInstruction}</p>
                </div>
              </div>
            )}
          </div>

          {/* CARD 6: CUSTOMER PROFILE & ADDRESS */}
          <div className="admin-section-card">
            <div className="admin-section-head">
              <h3 className="admin-section-title">
                <UserCheck size={18} />
                <span>Customer Profile</span>
              </h3>
            </div>

            <div className="customer-card-head">
              <div className="customer-avatar-circle">
                {(order.customer || 'C').charAt(0).toUpperCase()}
              </div>
              <div className="customer-name-block">
                <span className="customer-name">{order.customer || 'Valued Customer'}</span>
                <div className="customer-contact-links">
                  {order.mobile && (
                    <a href={`tel:${order.mobile}`}>📞 {order.mobile}</a>
                  )}
                  {order.user?.email && (
                    <a href={`mailto:${order.user.email}`}>✉️ Email</a>
                  )}
                </div>
              </div>
            </div>

            <div className="customer-address-box">
              <div className="customer-address-head">
                <MapPin size={14} />
                <span>Delivery Address</span>
              </div>
              <p className="customer-address-text">
                {address.line ? (
                  <>
                    <b>{address.line}</b><br />
                    {address.cityLine}
                  </>
                ) : (
                  'Address details unavailable'
                )}
              </p>
              {address.line && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address.line}, ${address.cityLine}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    color: '#059669',
                    textDecoration: 'none',
                    fontWeight: 700,
                    marginTop: '8px'
                  }}
                >
                  <span>View on Google Maps</span>
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>

          {/* CARD 7: DELIVERY FULFILMENT & POD */}
          <div className="admin-section-card">
            <div className="admin-section-head">
              <h3 className="admin-section-title">
                <Truck size={18} />
                <span>Delivery Partner & POD</span>
              </h3>
              <Link
                to={`${prefix}/delivery?tab=assignments`}
                style={{ fontSize: '12px', color: '#059669', textDecoration: 'none', fontWeight: 700 }}
              >
                Dispatch Hub →
              </Link>
            </div>

            {order.deliveryAssignments?.length > 0 ? (
              <div className="rider-assigned-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                    {order.deliveryAssignments[0].deliveryPerson?.name || 'Assigned Partner'}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    background: '#dbeafe',
                    color: '#1d4ed8',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {order.deliveryAssignments[0].status?.replace('_', ' ')}
                  </span>
                </div>

                {order.deliveryAssignments[0].deliveryPerson?.mobile && (
                  <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#475569' }}>
                    📞 <a href={`tel:${order.deliveryAssignments[0].deliveryPerson.mobile}`} style={{ color: '#059669', fontWeight: 700 }}>
                      {order.deliveryAssignments[0].deliveryPerson.mobile}
                    </a>
                  </p>
                )}

                {order.deliveryAssignments[0].deliveryPerson?.vehicleType && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    🛵 {order.deliveryAssignments[0].deliveryPerson.vehicleType} {order.deliveryAssignments[0].deliveryPerson.vehicleNumber ? `· ${order.deliveryAssignments[0].deliveryPerson.vehicleNumber}` : ''}
                  </p>
                )}

                {(order.deliveryAssignments[0].deliveredAt || order.deliveredAt) && (
                  <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#15803d', fontWeight: 700 }}>
                    ✓ Delivered: {date(order.deliveryAssignments[0].deliveredAt || order.deliveredAt)}
                  </p>
                )}
              </div>
            ) : (
              <div className="rider-unassigned-card">
                <div style={{ fontSize: '12.5px', color: '#b45309', fontWeight: 600 }}>
                  ⚠️ No delivery driver assigned yet.
                </div>
                <div style={{ marginTop: '10px' }}>
                  <Link
                    to={`${prefix}/delivery?tab=assignments&orderNumber=${order.orderNumber}&orderId=${order.id}`}
                    className="btn btn-outline"
                    style={{ display: 'inline-flex', fontSize: '12px', padding: '6px 14px', borderColor: '#f59e0b', color: '#b45309' }}
                  >
                    Assign Driver Now →
                  </Link>
                </div>
              </div>
            )}

            {/* Proof of Delivery (POD) section */}
            {order.deliveryProofs?.length > 0 && (
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={14} /> Proof of Delivery (POD)
                </h4>
                {order.deliveryProofs.map(proof => (
                  <div key={proof.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '8px', marginBottom: '8px' }}>
                    <a href={proof.cloudinaryUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={proof.cloudinaryUrl}
                        alt="POD"
                        style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </a>
                    <div style={{ flex: 1, minWidth: 0, fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{proof.recipientName || 'Recipient'}</span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: proof.verificationStatus === 'VERIFIED' ? '#dcfce7' : proof.verificationStatus === 'FLAGGED' ? '#fee2e2' : '#fef3c7',
                          color: proof.verificationStatus === 'VERIFIED' ? '#15803d' : proof.verificationStatus === 'FLAGGED' ? '#b91c1c' : '#b45309'
                        }}>
                          {proof.verificationStatus}
                        </span>
                      </div>
                      {proof.recipientPhone && <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>📱 {proof.recipientPhone}</div>}
                      {proof.notes && <div style={{ color: '#334155', fontSize: '11px', marginTop: '2px' }}>{proof.notes}</div>}
                      <a href={proof.cloudinaryUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#059669', fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>
                        View Full Photo <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* COD Collection info */}
            {order.codCollection && (
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>COD Collected:</span>
                  <span style={{ fontWeight: 700, color: '#15803d' }}>{money(order.codCollection.collectedAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ color: '#64748b' }}>Settlement:</span>
                  <span style={{ fontWeight: 700, color: order.codCollection.settlementStatus === 'SETTLED' ? '#15803d' : '#b45309' }}>
                    {order.codCollection.settlementStatus}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enterprise Print Modal */}
      <OrderPrintModal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        order={order}
        storeSettings={storeSettings}
      />

      {/* Enterprise Partial Item OOS / Reduction Modal */}
      <ModifyOrderItemModal
        open={Boolean(modifyItemModal)}
        onClose={() => setModifyItemModal(null)}
        order={order}
        item={modifyItemModal}
        onUpdated={handleModifyItem}
      />

      {/* Admin Cancel Order Modal */}
      <Modal
        open={cancelModalOpen}
        onClose={() => !saving && setCancelModalOpen(false)}
        title={`Cancel Order #${order?.orderNumber || ''}`}
        size="r2-order-modal"
      >
        <form onSubmit={handleAdminCancelSubmit} className="r2-modal-form">
          <div className="r2-modal-body">
            <div style={{
              padding: '12px 14px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
              color: '#991b1b',
              marginBottom: '14px'
            }}>
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '12.5px', lineHeight: 1.4 }}>
                <b>Are you sure you want to cancel this order?</b>
                <div style={{ marginTop: '2px', color: '#b91c1c' }}>
                  All order items will be automatically returned to store inventory and allocations reversed.
                </div>
              </div>
            </div>

            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
              Please select reason for cancellation:
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              {ADMIN_CANCEL_REASONS.map(r => (
                <label
                  key={r}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: `1.5px solid ${selectedAdminReason === r ? '#e11d48' : '#e2e8f0'}`,
                    background: selectedAdminReason === r ? '#fff1f2' : '#ffffff',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: selectedAdminReason === r ? 700 : 500,
                    color: selectedAdminReason === r ? '#9f1239' : '#334155'
                  }}
                >
                  <input
                    type="radio"
                    name="admin_cancel_reason"
                    value={r}
                    checked={selectedAdminReason === r}
                    onChange={() => { setSelectedAdminReason(r); setCancelError(''); }}
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>

            {selectedAdminReason === 'Other reason' && (
              <div style={{ marginTop: '8px' }}>
                <textarea
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    minHeight: '65px',
                    resize: 'vertical'
                  }}
                  placeholder="Specify cancellation reason for record keeping…"
                  value={customAdminReason}
                  onChange={e => setCustomAdminReason(e.target.value)}
                />
              </div>
            )}

            {cancelError && (
              <p role="alert" style={{ margin: '8px 0 0', fontSize: '12.5px', color: '#dc2626', fontWeight: 600 }}>
                {cancelError}
              </p>
            )}
          </div>

          <div className="r2-modal-foot" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '14px 20px', borderTop: '1px solid #e2e8f0' }}>
            <Button
              type="button"
              variant="ghost"
              disabled={saving}
              onClick={() => {
                setCancelModalOpen(false);
                setStatus(order.status);
              }}
              style={{ height: '36px', padding: '0 14px', fontSize: '13px' }}
            >
              Keep Order
            </Button>

            <Button
              type="submit"
              disabled={saving}
              style={{
                height: '36px',
                padding: '0 16px',
                fontSize: '13px',
                background: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Cancelling…' : 'Confirm Cancel Order'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
