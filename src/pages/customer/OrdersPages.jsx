import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  ShoppingBag,
  RotateCcw,
  Copy,
  CheckCheck,
  Search,
  X,
  MapPin,
  Phone,
  Calendar,
  Zap,
  Printer,
  AlertCircle,
  ChevronRight,
  XCircle,
  Edit2,
  MessageSquare,
  Star
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EmptyState, StatusBadge, money, Button, Modal } from '../../components/ui';
import { addressText } from '../../utils/address';
import { orderService } from '../../services/order.service';
import { catalogService } from '../../services/catalog.service';
import { customerService } from '../../services/customer.service';
import { DeliveryChatModal } from '../../components/DeliveryChatModal';
import { OrderPrintModal } from '../../components/admin/OrderPrintView';

const orderItems = o => (o.items || []).filter(Boolean);
const orderLabel = o => o.orderNumber || o.id;
export const formatDateTime = (val) => {
  if (!val) return null;
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
const paymentLabel = order =>
  typeof order?.payment === 'object'
    ? order.paymentMethod === 'COD'
      ? 'Cash on Delivery'
      : order.paymentMethod || order.payment?.method || 'Cash on Delivery'
    : order?.payment || order?.paymentMethod || 'Cash on Delivery';

const CANCEL_REASONS = [
  'Placed order by mistake',
  'Need to change delivery address or phone number',
  'Need to add or modify items in grocery basket',
  'Selected delivery timing is no longer suitable',
  'Found items available earlier locally',
  'Other reason'
];

function CancelOrderModal({ order, open, onClose, onCancelled, onOpenEdit }) {
  const [selectedReason, setSelectedReason] = useState(CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!open || !order) return null;

  const isAddressOrPhoneReason = selectedReason === 'Need to change delivery address or phone number';
  const isTimingReason = selectedReason === 'Selected delivery timing is no longer suitable';
  const isBasketReason = selectedReason === 'Need to add or modify items in grocery basket';
  const isModifiableReason = isAddressOrPhoneReason || isTimingReason;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const reasonText = selectedReason === 'Other reason' ? customReason.trim() : selectedReason;
    if (selectedReason === 'Other reason' && !reasonText) {
      setError('Please enter your cancellation reason');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await onCancelled(order.id || order.orderNumber, reasonText);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to cancel order. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={() => !busy && onClose()} title="Cancel Order" size="r2-order-modal">
      <form onSubmit={handleSubmit} className="r2-modal-form">
        <div className="r2-modal-body">
          {/* Warning Banner */}
          <div className="cancel-warning-strip">
            <AlertCircle size={17} color="#dc2626" style={{ flexShrink: 0 }} />
            <div>
              <b>Are you sure you want to cancel order #{orderLabel(order)}?</b>
              <span>All {orderItems(order).length} item{orderItems(order).length > 1 ? 's' : ''} will be released and returned to store inventory.</span>
            </div>
          </div>

          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
            Please select reason for cancellation:
          </label>

          <div className="cancel-reasons-list">
            {CANCEL_REASONS.map(r => (
              <label
                key={r}
                className={`cancel-reason-item ${selectedReason === r ? 'active' : ''}`}
              >
                <input
                  type="radio"
                  name="cancel_reason"
                  value={r}
                  checked={selectedReason === r}
                  onChange={() => { setSelectedReason(r); setError(''); }}
                />
                <span>{r}</span>
              </label>
            ))}
          </div>

          {/* Option to modify details instead of cancelling */}
          {isModifiableReason && onOpenEdit && (
            <div className="cancel-modify-tip-banner">
              <div className="tip-content">
                <b>
                  <Edit2 size={13} color="#059669" />
                  {isTimingReason ? 'Change delivery timing instead?' : 'Modify address or phone instead?'}
                </b>
                <p>
                  {isTimingReason
                    ? 'You can change scheduled date & slot without cancelling your order.'
                    : 'You don’t have to cancel! Update recipient name, phone, or address directly.'}
                </p>
              </div>
              <button
                type="button"
                className="cancel-modify-action-btn"
                onClick={() => {
                  onClose();
                  onOpenEdit(order);
                }}
              >
                <Edit2 size={13} />
                <span>Modify Details</span>
              </button>
            </div>
          )}

          {isBasketReason && (
            <div
              style={{
                marginTop: '10px',
                padding: '9px 12px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '9px',
                fontSize: '11.5px',
                color: '#1e40af',
                lineHeight: 1.4
              }}
            >
              <b>Need to modify basket items?</b> Once cancelled, you can click <b>Re-order all items</b> to instantly load your basket and adjust items before placing a new order.
            </div>
          )}

          {selectedReason === 'Other reason' && (
            <textarea
              style={{
                width: '100%',
                marginTop: '8px',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '12.5px',
                boxSizing: 'border-box',
                resize: 'vertical',
                minHeight: '60px',
                fontFamily: 'inherit'
              }}
              placeholder="Tell us why you are cancelling..."
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
            />
          )}

          {error && (
            <p role="alert" style={{ margin: '8px 0 0', fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
              {error}
            </p>
          )}
        </div>

        {/* Pinned Bottom Footer Actions */}
        <div className="r2-modal-foot">
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={onClose}
            style={{ height: '36px', padding: '0 14px', fontSize: '13px' }}
          >
            Keep Order
          </Button>

          <Button
            type="submit"
            variant="danger"
            disabled={busy}
            style={{ height: '36px', padding: '0 16px', fontSize: '13px' }}
          >
            {busy ? 'Cancelling…' : 'Yes, Cancel Order'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function EditOrderDetailsModal({ order, open, onClose, onUpdated }) {
  const { availableLocalities } = useApp();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [house, setHouse] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [pin, setPin] = useState('');
  const [deliveryInstruction, setDeliveryInstruction] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliverySlot, setDeliverySlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [updateSavedAddress, setUpdateSavedAddress] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isScheduled = order?.deliveryType === 'SCHEDULED';

  useEffect(() => {
    if (order && open) {
      const snap = order.address || {};
      setName(snap.name || order.customer || '');
      setMobile(snap.mobile || order.mobile || '');
      setHouse(snap.house || '');
      setStreet(snap.street || '');
      setLandmark(snap.landmark || '');
      setArea(snap.area || '');
      setCity(snap.city || 'Hathua');
      setPin(snap.pin || '');
      setDeliveryInstruction(order.deliveryInstruction || '');
      setDeliveryDate(order.deliveryDate || '');
      setDeliverySlot(order.deliverySlot || '');
      setUpdateSavedAddress(false);
      setError('');

      if (order.deliveryDate) {
        catalogService.listDeliverySlots(order.deliveryDate)
          .then(slots => {
            if (Array.isArray(slots) && slots.length > 0) setAvailableSlots(slots);
          })
          .catch(() => {});
      }
    }
  }, [order, open]);

  useEffect(() => {
    if (deliveryDate) {
      catalogService.listDeliverySlots(deliveryDate)
        .then(slots => {
          if (Array.isArray(slots) && slots.length > 0) setAvailableSlots(slots);
        })
        .catch(() => {});
    }
  }, [deliveryDate]);

  if (!open || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanMobile = mobile.replace(/\D/g, '');
    const cleanArea = area.trim();

    if (cleanName.length < 2) {
      setError('Recipient name must have at least 2 characters');
      return;
    }
    if (!/^\d{10}$/.test(cleanMobile)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!cleanArea) {
      setError('Village / Locality area is required');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await onUpdated({
        name: cleanName,
        mobile: cleanMobile,
        street: street.trim(),
        landmark: landmark.trim(),
        area: cleanArea,
        city: 'Hathua',
        deliveryDate: isScheduled ? deliveryDate : undefined,
        deliverySlot: isScheduled ? deliverySlot : undefined,
        updateSavedAddress
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update order details');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={() => !busy && onClose()} title="Edit Order Details" size="r2-order-modal">
      <form onSubmit={handleSubmit} className="r2-modal-form">
        <div className="r2-modal-body">
          {/* Order Summary Strip */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#475569', marginBottom: '12px' }}>
            Updating delivery address and contact information for <b>#{orderLabel(order)}</b>.
          </div>

          <div className="edit-details-grid">
            {/* Recipient Details */}
            <div className="edit-details-row">
              <div className="edit-field">
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>
              <div className="edit-field">
                <label>Mobile Number *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  placeholder="10-digit number"
                />
              </div>
            </div>

            {/* Street / Colony / Ward */}
            <div className="edit-field">
              <label>Street / Colony / Ward details</label>
              <input
                type="text"
                value={street}
                onChange={e => setStreet(e.target.value)}
                placeholder="e.g. Ward No. 3, Main Market road"
              />
            </div>

            {/* Nearby Landmark */}
            <div className="edit-field">
              <label>Nearby Landmark (Mandir, School, etc.)</label>
              <input
                type="text"
                value={landmark}
                onChange={e => setLandmark(e.target.value)}
                placeholder="e.g. Near Shiv Mandir, High School"
              />
            </div>

            {/* Village / Area */}
            <div className="edit-field">
              <label>Village / Area *</label>
              {availableLocalities && availableLocalities.length > 0 ? (
                <select
                  value={area}
                  required
                  onChange={e => setArea(e.target.value)}
                >
                  <option value="">Select Village / Locality</option>
                  {availableLocalities.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={area}
                  onChange={e => setArea(e.target.value)}
                  placeholder="Village / Area name"
                />
              )}
            </div>

            {/* Scheduled date & slot if applicable */}
            {isScheduled && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#166534', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  📅 Scheduled Timing
                </span>
                <div className="edit-details-row">
                  <div className="edit-field">
                    <label style={{ color: '#166534' }}>Delivery Date</label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={e => setDeliveryDate(e.target.value)}
                      style={{ height: '34px', borderColor: '#86efac' }}
                    />
                  </div>
                  <div className="edit-field">
                    <label style={{ color: '#166534' }}>Delivery Slot</label>
                    <select
                      value={deliverySlot}
                      onChange={e => setDeliverySlot(e.target.value)}
                      style={{ height: '34px', borderColor: '#86efac' }}
                    >
                      {availableSlots.length > 0 ? (
                        availableSlots.map(s => (
                          <option key={s.id || s.label} value={s.label}>
                            {s.label}
                          </option>
                        ))
                      ) : (
                        <>
                          {deliverySlot && <option value={deliverySlot}>{deliverySlot}</option>}
                          <option value="Morning Slot (07:00 AM – 11:00 AM)">Morning Slot (07:00 AM – 11:00 AM)</option>
                          <option value="Midday Slot (10:00 AM - 01:00 PM)">Midday Slot (10:00 AM - 01:00 PM)</option>
                          <option value="Afternoon Slot (01:00 PM - 04:00 PM)">Afternoon Slot (01:00 PM - 04:00 PM)</option>
                          <option value="Evening Slot (04:00 PM - 07:00 PM)">Evening Slot (04:00 PM - 07:00 PM)</option>
                          <option value="Night Slot (07:00 PM - 10:00 PM)">Night Slot (07:00 PM - 10:00 PM)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Checkbox to update saved address */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#4b5563', cursor: 'pointer', marginTop: '4px' }}>
              <input
                type="checkbox"
                checked={updateSavedAddress}
                onChange={e => setUpdateSavedAddress(e.target.checked)}
                style={{ width: 'auto', height: 'auto', accentColor: '#10b981' }}
              />
              <span>Also update this in my saved addresses for future orders</span>
            </label>

            {error && (
              <p role="alert" style={{ margin: '4px 0 0', fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Pinned Bottom Footer Actions */}
        <div className="r2-modal-foot">
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={onClose}
            style={{ height: '36px', padding: '0 16px', fontSize: '13px', borderRadius: '8px' }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={busy}
            style={{ height: '36px', padding: '0 18px', fontSize: '13px', fontWeight: 700, borderRadius: '8px', background: '#10b981', color: '#fff' }}
          >
            {busy ? 'Saving changes…' : 'Save Details'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function OrdersPage() {
  const { orderList, setOrderList, refreshProducts, user, add, notify } = useApp();
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [chatTarget, setChatTarget] = useState(null);
  const nav = useNavigate();

  // If customer is not logged in, prompt sign-in with clean state
  if (!user) {
    return (
      <div className="container page" style={{ padding: '60px 16px', textAlign: 'center' }}>
        <div
          style={{
            margin: '0 auto',
            maxWidth: '440px',
            background: '#ffffff',
            padding: '36px 24px',
            borderRadius: '20px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 8px 30px rgba(0,0,0,0.04)'
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: '#ecfdf5',
              color: '#10b981',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px'
            }}
          >
            <ShoppingBag size={28} />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px', color: '#111827' }}>
            Sign in to view your orders
          </h1>
          <p style={{ color: '#6b7280', fontSize: '13.5px', margin: '0 0 20px', lineHeight: 1.5 }}>
            Track active deliveries, review past orders, and re-order your favorite groceries anytime.
          </p>
          <Button
            onClick={() => nav('/login')}
            style={{ width: '100%', height: '44px', fontSize: '14px', fontWeight: 700 }}
          >
            Sign in to R2Cart
          </Button>
        </div>
      </div>
    );
  }

  // Calculate order counts for stat chips
  const totalCount = orderList?.length || 0;
  const activeCount = useMemo(
    () => (orderList || []).filter(x => ['New', 'Confirmed', 'Packing', 'Out for Delivery'].includes(x.status)).length,
    [orderList]
  );
  const deliveredCount = useMemo(
    () => (orderList || []).filter(x => x.status === 'Delivered').length,
    [orderList]
  );
  const cancelledCount = useMemo(
    () => (orderList || []).filter(x => x.status === 'Cancelled').length,
    [orderList]
  );

  // Filter orders by tab and search
  const filteredList = useMemo(() => {
    let list = orderList || [];
    if (tab === 'Active') {
      list = list.filter(x => ['New', 'Confirmed', 'Packing', 'Out for Delivery'].includes(x.status));
    } else if (tab === 'Delivered') {
      list = list.filter(x => x.status === 'Delivered');
    } else if (tab === 'Cancelled') {
      list = list.filter(x => x.status === 'Cancelled');
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(o => {
        const idMatch = (o.orderNumber || o.id || '').toLowerCase().includes(q);
        const itemMatch = (o.items || []).some(item => (item.name || '').toLowerCase().includes(q));
        return idMatch || itemMatch;
      });
    }

    return list;
  }, [orderList, tab, search]);

  // Bulk re-order action: adds all items of an order to customer cart
  const handleReorder = (order, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const items = orderItems(order);
    if (!items.length) return;

    let addedCount = 0;
    items.forEach(item => {
      if (item.productId || item.id) {
        add(item.productId || item.id);
        addedCount++;
      }
    });

    notify(`Added ${addedCount} items from Order #${orderLabel(order)} to your basket!`, 'success');
  };

  const handleCancelOrder = async (orderId, reason) => {
    await orderService.cancel(orderId, reason);
    setOrderList(current => current.map(o => (o.id === orderId || o.orderNumber === orderId ? { ...o, status: 'Cancelled' } : o)));
    await refreshProducts();
    window.dispatchEvent(new Event('r2cart:orders-updated'));
    window.dispatchEvent(new Event('r2cart:products-updated'));
    notify('Order cancelled successfully. Deducted stock has been restored.', 'success');
  };

  const handleUpdateDetails = async (payload) => {
    if (!editTarget) return;
    const res = await orderService.updateDetails(editTarget.id || editTarget.orderNumber, payload);
    const updated = res?.data || res?.order || res;
    setOrderList(current => current.map(o => (o.id === editTarget.id || o.orderNumber === editTarget.orderNumber ? { ...o, ...updated } : o)));
    window.dispatchEvent(new Event('r2cart:orders-updated'));
    notify('Order details updated successfully.', 'success');
  };

  return (
    <div className="orders-main-container">
      <div className="orders-page-shell">
        {/* Top Header Banner */}
        <div className="orders-hero-banner">
          <div className="orders-hero-info">
            <h1>
              <ShoppingBag size={20} /> My Orders
            </h1>
            <p>Track active deliveries and review your grocery purchases.</p>
          </div>

          <div className="orders-hero-stats">
            <div className="orders-stat-pill">
              <span>All:</span> <b>{totalCount}</b>
            </div>
            {activeCount > 0 && (
              <div className="orders-stat-pill active-pill">
                <span className="orders-live-pulse-dot" />
                <span>Active:</span> <b>{activeCount}</b>
              </div>
            )}
            <div className="orders-stat-pill">
              <span>Delivered:</span> <b>{deliveredCount}</b>
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Controls */}
        <div className="orders-controls-card">
          <div className="orders-tabs-group" role="tablist">
            {[
              { id: 'All', label: 'All', count: totalCount },
              { id: 'Active', label: 'Active', count: activeCount, isLive: activeCount > 0 },
              { id: 'Delivered', label: 'Delivered', count: deliveredCount },
              { id: 'Cancelled', label: 'Cancelled', count: cancelledCount }
            ].map(t => (
              <button
                type="button"
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                className={`orders-tab-btn ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.isLive && <span className="orders-live-pulse-dot" />}
                <span>{t.label}</span>
                <span className="orders-tab-count">{t.count}</span>
              </button>
            ))}
          </div>

          <div className="orders-search-box">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search by Order ID or item..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="clear-btn"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Order Cards List */}
        {filteredList.length > 0 ? (
          <div className="orders-cards-list">
            {filteredList.map(order => (
              <OrderCardV2
                key={order.id || order.orderNumber}
                order={order}
                onReorder={e => handleReorder(order, e)}
                onCancel={order => setCancelTarget(order)}
                onEdit={order => setEditTarget(order)}
                onChat={order => setChatTarget(order)}
              />
            ))}
          </div>
        ) : (
          <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '36px 16px' }}>
            <EmptyState
              icon="package"
              title={search ? 'No orders match your search' : tab === 'Active' ? 'No active deliveries' : 'No orders in this tab'}
              text={
                search
                  ? `No orders matching "${search}" were found. Try another search.`
                  : tab === 'Active'
                  ? 'All your past orders have been completed. Add fresh items to start a new delivery!'
                  : 'Orders matching this filter will appear here.'
              }
              action="Explore Groceries"
              to="/"
            />
          </div>
        )}
      </div>

      <CancelOrderModal
        order={cancelTarget}
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onCancelled={handleCancelOrder}
        onOpenEdit={order => setEditTarget(order)}
      />

      <EditOrderDetailsModal
        order={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onUpdated={handleUpdateDetails}
      />

      <DeliveryChatModal
        order={chatTarget}
        isOpen={Boolean(chatTarget)}
        onClose={() => setChatTarget(null)}
        role="CUSTOMER"
      />
    </div>
  );
}

function OrderCardV2({ order, onReorder, onCancel, onEdit, onChat }) {
  const [copied, setCopied] = useState(false);
  const items = orderItems(order);
  const isScheduled = order.deliveryType === 'SCHEDULED';
  const isActive = ['New', 'Confirmed', 'Packing', 'Out for Delivery'].includes(order.status);
  const canCancel = ['New', 'Confirmed', 'Packing'].includes(order.status);

  const copyOrderId = e => {
    e.stopPropagation();
    navigator.clipboard?.writeText?.(orderLabel(order));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Preview names
  const previewNames = items
    .slice(0, 3)
    .map(x => x.name)
    .join(', ');
  const remainingCount = items.length > 3 ? items.length - 3 : 0;

  // Order timeline step index
  const steps = ['Order Placed', 'Confirmed', 'Packing', 'Out for Delivery', 'Delivered'];
  const getStepIndex = status => {
    if (status === 'New') return 0;
    if (status === 'Confirmed') return 1;
    if (status === 'Packing') return 2;
    if (status === 'Out for Delivery') return 3;
    if (status === 'Delivered') return 4;
    return 0;
  };
  const currentStep = getStepIndex(order.status);
  const progressPercent = Math.max(15, (currentStep / (steps.length - 1)) * 100);

  return (
    <article className="order-card-v2">
      {/* Top Meta Header: 2 Balanced Rows */}
      <div className="order-card-v2-header">
        <div className="order-card-top-row">
          <span className="order-number-badge">
            #{orderLabel(order)}
            <button
              type="button"
              className="order-copy-btn"
              onClick={copyOrderId}
              title={copied ? 'Copied!' : 'Copy Order ID'}
            >
              {copied ? <CheckCheck size={13} color="#10b981" /> : <Copy size={13} />}
            </button>
          </span>

          <StatusBadge status={order.status} />
        </div>

        <div className="order-card-sub-row">
          <span className="order-date-text">
            <Calendar size={12} />
            {order.date ? new Date(order.date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'Recent Order'}
          </span>

          {isScheduled ? (
            <span className="delivery-type-pill scheduled">
              📅 {order.deliveryDate} ({order.deliverySlot})
            </span>
          ) : (
            <span className="delivery-type-pill instant">
              ⚡ Instant Delivery
            </span>
          )}
        </div>
      </div>

      {/* Live Tracker Bar for active orders */}
      {isActive && (
        <div className="order-card-tracker">
          {/* Mobile version: Clean Progress Bar & Phase badge */}
          <div className="mobile-tracker-wrap">
            <div className="mobile-tracker-status-row">
              <span className="mobile-tracker-badge">
                <span className="orders-live-pulse-dot" />
                <span>{order.status}</span>
              </span>
              <span className="mobile-tracker-step-num">Step {currentStep + 1} of 5</span>
            </div>
            <div className="mobile-tracker-progress-track">
              <div
                className="mobile-tracker-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Desktop version: 5-step milestone stepper */}
          <div className="desktop-tracker-wrap">
            <div className="order-tracker-bar">
              <div className="order-tracker-line">
                <div
                  className="order-tracker-line-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {steps.map((step, idx) => {
                const isDone = idx <= currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <div
                    key={step}
                    className={`order-tracker-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
                  >
                    <div className="order-tracker-dot">
                      {idx < currentStep ? <Check size={14} /> : idx + 1}
                    </div>
                    <span className="order-tracker-label">{step}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="order-tracker-message">
            <Truck size={14} style={{ flexShrink: 0 }} />
            <span>
              {order.status === 'Out for Delivery'
                ? 'Delivery partner is on the way! Please keep your phone reachable.'
                : order.status === 'Packing'
                ? 'Items are being packed with care at our local hub.'
                : order.status === 'Confirmed'
                ? 'Store has confirmed your items and dispatch is scheduled.'
                : 'Order received. Getting your grocery basket ready.'}
            </span>
          </div>
        </div>
      )}

      {/* Delivery Confirmation Strip for completed orders */}
      {order.status === 'Delivered' && (
        <div style={{
          margin: '10px 14px 4px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '10px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46' }}>
            <CheckCircle2 size={18} style={{ color: '#059669', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              Delivered on <b>{formatDateTime(order.deliveredAt || order.date)}</b>
            </span>
          </div>
          {order.deliveryPerson?.name && (
            <span style={{ fontSize: '11.5px', color: '#047857', background: '#d1fae5', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
              Delivered by {order.deliveryPerson.name}
            </span>
          )}
        </div>
      )}

      {/* Middle Body: Products Thumbnails and Summary */}
      <div className="order-card-v2-body">
        <div className="order-card-items-col">
          {/* Thumbnails */}
          <div className="order-items-scroll-preview">
            {items.slice(0, 3).map((item, idx) => (
              <div className="order-item-thumb-box" key={item.id || idx}>
                <img
                  src={item.image}
                  alt={item.name}
                  onError={e => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22%3E%3Crect width=%2260%22 height=%2260%22 fill=%22%23f3f4f6%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2220%22%3E🛒%3C/text%3E%3C/svg%3E';
                  }}
                />
                {(item.quantity || item.qty) > 1 && (
                  <span className="order-item-qty-tag">x{item.quantity || item.qty}</span>
                )}
              </div>
            ))}
          </div>

          {/* Names and Count */}
          <div className="order-items-text-summary">
            <span className="order-items-names">{previewNames || 'Grocery order items'}</span>
            <span className="order-items-count-pill">
              {items.length} {items.length === 1 ? 'item' : 'items'}
              {remainingCount > 0 && ` (+${remainingCount} more)`}
            </span>
          </div>
        </div>

        {/* Pricing & Payment Mode */}
        <div className="order-price-summary-row">
          <span className="order-payment-method-chip">
            {paymentLabel(order)}
          </span>
          <span className="order-grand-total-amount">
            {money(order.total ?? order.grandTotal ?? 0)}
          </span>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="order-card-v2-footer">
        <div className="order-footer-status-note">
          {order.status === 'Delivered' ? (
            <>
              <CheckCircle2 size={15} color="#10b981" />
              <span>Delivered successfully</span>
            </>
          ) : order.status === 'Cancelled' ? (
            <>
              <AlertCircle size={15} color="#ef4444" />
              <span>Order was cancelled</span>
            </>
          ) : (
            <>
              <Clock size={15} color="#f59e0b" />
              <span>
                {isScheduled
                  ? `Scheduled: ${order.deliveryDate}`
                  : 'Live delivery update'}
              </span>
            </>
          )}
        </div>

        <div className="order-card-btn-actions">
          {order.status === 'Out for Delivery' && onChat && (
            <button
              type="button"
              className="order-btn-cancel"
              style={{ color: '#0284c7', borderColor: '#7dd3fc', background: '#f0f9ff' }}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                onChat?.(order);
              }}
              title="Chat with your delivery rider"
            >
              <MessageSquare size={13} />
              <span>Chat Rider</span>
            </button>
          )}

          {canCancel && onEdit && (
            <button
              type="button"
              className="order-btn-cancel"
              style={{ color: '#0f766e', borderColor: '#99f6e4', background: '#f0fdfa' }}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                onEdit?.(order);
              }}
              title="Edit delivery details"
            >
              <Edit2 size={12} />
              <span>Edit</span>
            </button>
          )}

          {canCancel && (
            <button
              type="button"
              className="order-btn-cancel"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                onCancel?.(order);
              }}
              title="Cancel this order"
            >
              <XCircle size={13} />
              <span>Cancel</span>
            </button>
          )}

          <button
            type="button"
            className="order-btn-reorder"
            onClick={onReorder}
            title="Add all items from this order to basket"
          >
            <RotateCcw size={13} />
            <span>Re-order</span>
          </button>

          <Link to={`/orders/${order.id || order.orderNumber}`} className="order-btn-details">
            <span>View Details</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function OrderItemRateCard({ item, notify, refreshProducts }) {
  const productId = item.productId || item.id;
  const storageKey = `r2_prod_rating_${productId}`;
  const [currentScore, setCurrentScore] = useState(() => {
    try {
      return Number(localStorage.getItem(storageKey)) || 0;
    } catch {
      return 0;
    }
  });
  const [hoverScore, setHoverScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(() => {
    try {
      return Boolean(localStorage.getItem(storageKey));
    } catch {
      return false;
    }
  });

  const handleRate = async (val) => {
    if (!productId || submitting) return;
    setSubmitting(true);
    try {
      await customerService.rateProduct(productId, val);
      setCurrentScore(val);
      setSubmitted(true);
      try {
        localStorage.setItem(storageKey, String(val));
      } catch {}
      if (refreshProducts) await refreshProducts();
      notify(`Thank you! You rated "${item.name}" ${val} ★`, 'success');
    } catch (err) {
      notify(err.message || 'Failed to submit rating', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        marginTop: '8px',
        padding: '8px 12px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
          {submitted ? 'Your rating:' : 'Rate product:'}
        </span>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          {[1, 2, 3, 4, 5].map((val) => {
            const active = hoverScore ? val <= hoverScore : val <= currentScore;
            return (
              <button
                key={val}
                type="button"
                disabled={submitting}
                onClick={() => handleRate(val)}
                onMouseEnter={() => setHoverScore(val)}
                onMouseLeave={() => setHoverScore(0)}
                aria-label={`Rate ${val} star`}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '2px',
                  cursor: submitting ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.1s ease',
                  transform: hoverScore === val ? 'scale(1.2)' : 'none'
                }}
              >
                <Star
                  size={17}
                  color={active ? '#f59e0b' : '#cbd5e1'}
                  fill={active ? '#f59e0b' : 'none'}
                />
              </button>
            );
          })}
        </div>
      </div>
      {submitted && (
        <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Check size={13} strokeWidth={2.5} /> Saved ({currentScore}/5 ★)
        </span>
      )}
    </div>
  );
}

export function OrderDetailPage() {
  const { id } = useParams();
  const { orderList, setOrderList, refreshProducts, user, add, notify, storeSettings } = useApp();
  const [copied, setCopied] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [freshOrder, setFreshOrder] = useState(null);

  useEffect(() => {
    if (id) {
      orderService.get(id).then(res => {
        const o = res?.data || res?.order || res;
        if (o) setFreshOrder(o);
      }).catch(err => console.error('Failed to load fresh order details:', err));
    }
  }, [id]);

  const baseOrder = orderList.find(x => x.id === id) || orderList.find(x => x.orderNumber === id);
  const order = freshOrder || baseOrder;

  if (!order) {
    return (
      <div className="container page" style={{ padding: '60px 16px', textAlign: 'center' }}>
        <EmptyState
          icon="package"
          title="Order not found"
          text="This order is not available or may belong to another account."
          action="View my orders"
          to="/orders"
        />
      </div>
    );
  }

  const itemList = orderItems(order);
  const snapshot = order.addressSnapshot || order.address;
  const address = addressText(snapshot);
  const customerName = snapshot?.name || order.customer || user?.name || 'Customer';
  const customerMobile = snapshot?.mobile || address.mobile || order.phone || user?.phone || '';
  const total = order.total ?? order.grandTotal ?? 0;
  const deliveryFee = Number(order.deliveryFee || 0);
  const itemTotal = order.itemTotal ?? total - deliveryFee;
  const isScheduled = order.deliveryType === 'SCHEDULED';
  const isDelivered = String(order.status || '').trim().toLowerCase() === 'delivered';
  const isOutForDelivery = order.status === 'Out for Delivery';
  const canCancel = ['New', 'Confirmed', 'Packing'].includes(order.status);
  const canEdit = canCancel;

  const copyOrderId = () => {
    navigator.clipboard?.writeText?.(orderLabel(order));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancelOrder = async (orderId, reason) => {
    await orderService.cancel(orderId, reason);
    setOrderList(current => current.map(o => (o.id === orderId || o.orderNumber === orderId ? { ...o, status: 'Cancelled' } : o)));
    await refreshProducts();
    window.dispatchEvent(new Event('r2cart:orders-updated'));
    window.dispatchEvent(new Event('r2cart:products-updated'));
    notify('Order cancelled successfully. Deducted stock has been restored.', 'success');
  };

  const handleUpdateDetails = async (payload) => {
    const res = await orderService.updateDetails(order.id || order.orderNumber, payload);
    const updated = res?.data || res?.order || res;
    setOrderList(current => current.map(o => (o.id === order.id || o.orderNumber === order.orderNumber ? { ...o, ...updated } : o)));
    window.dispatchEvent(new Event('r2cart:orders-updated'));
    notify('Order details updated successfully.', 'success');
  };

  const handleReorderAll = () => {
    let count = 0;
    itemList.forEach(item => {
      if (item.productId || item.id) {
        add(item.productId || item.id);
        count++;
      }
    });
    notify(`Added ${count} items from this order to your basket!`, 'success');
  };

  return (
    <div className="orders-main-container">

      {/* Out for delivery support guidance notice */}
      {isOutForDelivery && (
        <div
          style={{
            marginBottom: '16px',
            padding: '14px 18px',
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Truck size={22} color="#0284c7" />
            <div>
              <b style={{ display: 'block', fontSize: '13.5px', color: '#0369a1' }}>
                Your order is currently Out for Delivery!
              </b>
              <span style={{ fontSize: '12.5px', color: '#0284c7' }}>
                {order.deliveryPerson?.name
                  ? `Rider ${order.deliveryPerson.name} is on the way with your grocery basket.`
                  : 'Online cancellation and detail modifications are closed. If you need urgent assistance, our team is available.'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setChatModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: '#059669',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              <MessageSquare size={14} />
              <span>Chat with Rider {order.deliveryPerson?.name ? `(${order.deliveryPerson.name})` : ''}</span>
            </button>
            <Link
              to={`/support?orderId=${orderLabel(order)}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: '#0284c7',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              Contact Customer Support
            </Link>
          </div>
        </div>
      )}

      {/* Top Header Card */}
      <div className="order-detail-header-card">
        <div>
          <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#10b981', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            ORDER SUMMARY
          </span>
          <h1 style={{ font: '800 20px "Manrope", sans-serif', color: '#111827', margin: '3px 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            #{orderLabel(order)}
            <button
              type="button"
              className="order-copy-btn"
              onClick={copyOrderId}
              title={copied ? 'Copied!' : 'Copy Order ID'}
            >
              {copied ? <CheckCheck size={14} color="#10b981" /> : <Copy size={13} />}
            </button>
          </h1>
          <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>
            Placed on {order.date ? new Date(order.date).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'Recent'}
          </p>
          {isDelivered && (
            <p style={{ color: '#047857', fontSize: '12.5px', margin: '4px 0 0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CheckCircle2 size={15} color="#059669" />
              Delivered on {formatDateTime(order.deliveredAt || order.date)}
              {order.deliveryPerson?.name ? ` · by ${order.deliveryPerson.name}` : ''}
            </p>
          )}
        </div>

        <div className="order-header-actions">
          <StatusBadge status={order.status} />
          {canEdit && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setEditModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '36px',
                padding: '0 12px',
                fontSize: '12.5px',
                borderRadius: '10px',
                color: '#0f766e',
                borderColor: '#99f6e4',
                background: '#f0fdfa'
              }}
            >
              <Edit2 size={13} />
              <span>Edit Details</span>
            </button>
          )}
          {canCancel && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setCancelModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '36px',
                padding: '0 12px',
                fontSize: '12.5px',
                borderRadius: '10px',
                color: '#dc2626',
                borderColor: '#fca5a5',
                background: '#fef2f2'
              }}
            >
              <XCircle size={14} />
              <span>Cancel Order</span>
            </button>
          )}
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setInvoiceModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '36px',
              padding: '0 14px',
              fontSize: '12.5px',
              fontWeight: 700,
              borderRadius: '10px',
              color: '#047857',
              borderColor: '#a7f3d0',
              background: '#ecfdf5',
              cursor: 'pointer'
            }}
          >
            <Printer size={14} color="#059669" />
            <span>Download Invoice / Bill</span>
          </button>
        </div>
      </div>

      {/* 2-Column Responsive Grid */}
      <div className="order-detail-grid-v2">
        {/* Left Column: Progress & Products */}
        <section style={{ minWidth: 0, width: '100%' }}>
          {/* Detailed Stepper */}
          <div className="order-section-card">
            <h3>
              <span>Delivery Status</span>
              {isScheduled && (
                <span className="delivery-type-pill scheduled" style={{ fontSize: '11px', padding: '2px 7px' }}>
                  📅 Scheduled
                </span>
              )}
            </h3>
            <OrderDetailTimeline status={order.status} order={order} />

            {/* Assigned Rider Card if order is out for delivery or has deliveryPerson */}
            {(isOutForDelivery || order.deliveryPerson) && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: '#ecfdf5',
                      color: '#059669',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Truck size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{order.deliveryPerson?.name || 'Assigned Delivery Partner'}</span>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, background: '#ecfdf5', color: '#059669', padding: '1px 6px', borderRadius: '6px' }}>
                        Rider
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      {[order.deliveryPerson?.vehicleType, order.deliveryPerson?.vehicleNumber].filter(Boolean).join(' · ') || 'Out on delivery vehicle'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setChatModalOpen(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      background: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
                    }}
                  >
                    <MessageSquare size={13} /> Chat with Rider
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Itemized Products */}
          <div className="order-section-card">
            <h3>
              <span>Items in this Order ({itemList.length})</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {itemList.map((item, idx) => (
                <div key={item.id || idx} style={{ borderBottom: idx < itemList.length - 1 ? '1px solid #f1f5f9' : 'none', paddingBottom: '12px', marginBottom: '8px' }}>
                  <div className="order-item-row-v2" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                    <img
                      src={item.image}
                      alt={item.name}
                      onError={e => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22%3E%3Crect width=%2260%22 height=%2260%22 fill=%22%23f3f4f6%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2220%22%3E🛒%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    <div className="order-item-info-v2">
                      <b>{item.name}</b>
                      <small>
                        {item.unit || 'Pack'} · Qty: {item.quantity || item.qty || 1} × {money(item.price || 0)}
                      </small>
                    </div>
                    <div className="order-item-price-v2">
                      {money((item.price || 0) * (item.quantity || item.qty || 1))}
                    </div>
                  </div>
                  {isDelivered && (
                    <OrderItemRateCard
                      item={item}
                      notify={notify}
                      refreshProducts={refreshProducts}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Note if present */}
          {order.deliveryInstruction && (
            <div className="order-section-card" style={{ background: '#f8fafc' }}>
              <h3 style={{ fontSize: '13.5px', marginBottom: '6px' }}>Delivery Note</h3>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#475569', fontStyle: 'italic' }}>
                "{order.deliveryInstruction}"
              </p>
            </div>
          )}
        </section>

        {/* Right Column: Address & Bill Summary */}
        <aside style={{ minWidth: 0, width: '100%' }}>
          {/* Delivery Address */}
          <div className="order-section-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Delivery Address</span>
                <MapPin size={15} color="#10b981" />
              </h3>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setEditModalOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#059669',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 6px',
                    borderRadius: '6px'
                  }}
                >
                  <Edit2 size={12} /> Edit
                </button>
              )}
            </div>
            <p style={{ margin: '0 0 4px', fontSize: '13.5px', fontWeight: 700, color: '#111827' }}>
              {customerName}
            </p>
            <p style={{ margin: '0 0 8px', fontSize: '12.5px', color: '#4b5563', lineHeight: 1.5 }}>
              {address.line}<br />
              {address.cityLine}
            </p>
            {customerMobile && (
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Phone size={12} /> +91 {customerMobile}
              </p>
            )}

            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                DELIVERY TIME
              </span>
              {isDelivered ? (
                <div style={{
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#065f46',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <CheckCircle2 size={16} color="#059669" />
                  <span>Delivered on {formatDateTime(order.deliveredAt || order.date)}</span>
                </div>
              ) : isScheduled ? (
                <div className="delivery-type-pill scheduled">
                  📅 {order.deliveryDate} · {order.deliverySlot}
                </div>
              ) : (
                <div className="delivery-type-pill instant">
                  ⚡ 10-15 Min Instant Delivery
                </div>
              )}
            </div>
          </div>

          {/* Bill Summary */}
          <div className="order-section-card">
            <h3>
              <span>Bill Summary</span>
              <span className="order-payment-method-chip">{paymentLabel(order)}</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                <span>Item Subtotal</span>
                <b>{money(itemTotal)}</b>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                <span>Delivery Fee</span>
                <b>{deliveryFee > 0 ? money(deliveryFee) : <span style={{ color: '#10b981' }}>FREE</span>}</b>
              </div>

              {(order.couponDiscount || 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                  <span>Coupon Discount</span>
                  <b>-{money(order.couponDiscount)}</b>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '10px',
                  marginTop: '4px',
                  borderTop: '1.5px solid #e5e7eb',
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#111827'
                }}
              >
                <span>Grand Total</span>
                <span style={{ color: '#10b981' }}>{money(total)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Button
              onClick={handleReorderAll}
              style={{ width: '100%', height: '44px', fontSize: '13.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}
            >
              <RotateCcw size={15} /> Re-order all items
            </Button>

            <button
              type="button"
              onClick={() => setInvoiceModalOpen(true)}
              style={{
                width: '100%',
                height: '42px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                borderRadius: '10px',
                color: '#047857',
                background: '#ecfdf5',
                border: '1.5px solid #a7f3d0',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(16,185,129,0.1)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#d1fae5';
                e.currentTarget.style.borderColor = '#6ee7b7';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#ecfdf5';
                e.currentTarget.style.borderColor = '#a7f3d0';
              }}
            >
              <Printer size={15} color="#059669" />
              <span>Download Invoice / Bill</span>
            </button>

            {canEdit && (
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                style={{
                  width: '100%',
                  height: '40px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  borderRadius: '10px',
                  color: '#0f766e',
                  background: '#f0fdfa',
                  border: '1px solid #99f6e4',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Edit2 size={14} />
                <span>Edit Order Details</span>
              </button>
            )}

            {canCancel && (
              <button
                type="button"
                onClick={() => setCancelModalOpen(true)}
                style={{
                  width: '100%',
                  height: '40px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  borderRadius: '10px',
                  color: '#dc2626',
                  background: '#fef2f2',
                  border: '1px solid #fca5a5',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <XCircle size={15} />
                <span>Cancel this order</span>
              </button>
            )}

            <Link
              to={`/support?orderId=${orderLabel(order)}`}
              className="btn btn-outline"
              style={{ width: '100%', height: '40px', fontSize: '12.5px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px', textDecoration: 'none' }}
            >
              Need help with this order?
            </Link>
          </div>
        </aside>
      </div>

      <CancelOrderModal
        order={order}
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onCancelled={handleCancelOrder}
        onOpenEdit={() => setEditModalOpen(true)}
      />

      <EditOrderDetailsModal
        order={order}
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onUpdated={handleUpdateDetails}
      />

      <DeliveryChatModal
        order={order}
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        role="CUSTOMER"
      />

      <OrderPrintModal
        open={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        order={order}
        storeSettings={storeSettings}
        initialMode="a4"
      />
    </div>
  );
}

function OrderDetailTimeline({ status, order }) {
  const isDelivered = status === 'Delivered';
  const deliveredTimestampText = order?.deliveredAt ? formatDateTime(order.deliveredAt) : null;
  const deliveryPersonName = order?.deliveryPerson?.name;

  const steps = [
    { key: 'New', label: 'Order Placed', desc: order?.date ? `Placed on ${formatDateTime(order.date)}` : 'Received & logged' },
    { key: 'Confirmed', label: 'Confirmed', desc: 'Accepted by store' },
    { key: 'Packing', label: 'Packing', desc: 'Packed at local hub' },
    { key: 'Out for Delivery', label: 'Out for Delivery', desc: deliveryPersonName ? `Out with ${deliveryPersonName}` : 'Rider on the way' },
    {
      key: 'Delivered',
      label: 'Delivered',
      desc: isDelivered && deliveredTimestampText
        ? `Delivered on ${deliveredTimestampText}${deliveryPersonName ? ` · by ${deliveryPersonName}` : ''}`
        : 'Completed'
    }
  ];

  let currentIdx = 0;
  if (status === 'New') currentIdx = 0;
  else if (status === 'Confirmed') currentIdx = 1;
  else if (status === 'Packing') currentIdx = 2;
  else if (status === 'Out for Delivery') currentIdx = 3;
  else if (status === 'Delivered') currentIdx = 4;
  else if (status === 'Cancelled') currentIdx = -1;

  if (status === 'Cancelled') {
    return (
      <div style={{ padding: '14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', color: '#b91c1c' }}>
        <AlertCircle size={20} />
        <div>
          <b style={{ display: 'block', fontSize: '13.5px' }}>Order Cancelled</b>
          <span style={{ fontSize: '12px' }}>This order was cancelled and deducted stock has been restored.</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
      {steps.map((s, idx) => {
        const isDone = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        const isLast = idx === steps.length - 1;

        return (
          <div key={s.key} style={{ display: 'flex', gap: '14px', position: 'relative' }}>
            {/* Vertical connector line */}
            {!isLast && (
              <div
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '30px',
                  bottom: '-12px',
                  width: '2px',
                  background: idx < currentIdx ? '#10b981' : '#e2e8f0',
                  zIndex: 1
                }}
              />
            )}

            {/* Circle Icon Indicator */}
            <div
              className={isCurrent ? 'timeline-active-pulse' : ''}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: isCurrent ? '#10b981' : isDone ? '#10b981' : '#f1f5f9',
                color: isDone ? '#ffffff' : '#94a3b8',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                zIndex: 2,
                boxShadow: isCurrent ? '0 0 0 3px #d1fae5' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {idx < currentIdx ? (
                <Check size={15} strokeWidth={2.5} />
              ) : isCurrent ? (
                <Clock size={15} />
              ) : (
                <span style={{ fontSize: '11px', fontWeight: 800 }}>{idx + 1}</span>
              )}
            </div>

            {/* Step Copy */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, paddingTop: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ fontSize: '13.5px', color: isDone ? '#0f172a' : '#94a3b8' }}>
                  {s.label}
                </b>
                {isCurrent && (
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center' }}>
                    <span className="live-pulse-dot" /> Current Phase
                  </span>
                )}
              </div>
              <small style={{ fontSize: '11.5px', color: isDone ? (s.key === 'Delivered' && isDelivered ? '#059669' : '#64748b') : '#cbd5e1', fontWeight: s.key === 'Delivered' && isDelivered ? 600 : 400 }}>
                {s.desc}
              </small>
              {s.key === 'Delivered' && isDelivered && order?.deliveryProof?.cloudinaryUrl && (
                <div style={{ marginTop: '4px' }}>
                  <a
                    href={order.deliveryProof.cloudinaryUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '11.5px', color: '#0284c7', textDecoration: 'underline', fontWeight: 600 }}
                  >
                    View Proof Photo
                  </a>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
