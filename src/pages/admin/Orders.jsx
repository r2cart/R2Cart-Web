function getAdminUser() {
  try {
    return JSON.parse(localStorage.getItem('grocify-admin-user')) || null;
  } catch {
    return null;
  }
}
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Printer, AlertTriangle, FileText, Receipt, Truck, Camera, ExternalLink } from 'lucide-react';
import { Button, Pagination, StatusBadge, money } from '../../components/ui';
import { useApp } from '../../context/AppContext';
import { adminService } from '../../services/admin.service';
import { addressText } from '../../utils/address';
import { OrderPrintModal } from '../../components/admin/OrderPrintView';
import { ModifyOrderItemModal } from '../../components/admin/ModifyOrderItemModal';
import '../../components/admin/order-print.css';
import { hasPermission } from '../../utils/permissions';

const statuses = ['New', 'Confirmed', 'Packing', 'Out for Delivery', 'Delivered', 'Cancelled'];
const date = value => new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

export function AdminOrders() {
  const [tab, setTab] = useState('All');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    adminService.ordersPage({ page, limit: 20, ...(tab !== 'All' && { status: tab }) }).then(value => {
      if (active) { setResult(value); setError(''); }
    }).catch(reason => {
      if (active) { setError(reason.message); setResult(null); }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [tab, page, refresh]);

  return (
    <>
      <div className="admin-title">
        <div>
          <h1>Orders</h1>
          <p>Live fulfilment queue from the database.</p>
        </div>
        <Button variant="outline" disabled={loading} onClick={() => setRefresh(value => value + 1)}>Refresh</Button>
      </div>
      <div className="tabs admin-tabs">
        {['All', ...statuses].map(value => (
          <button className={tab === value ? 'active' : ''} onClick={() => { setTab(value); setPage(1); }} key={value}>
            {value}
          </button>
        ))}
      </div>
      <div className="admin-card table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {['Order & Schedule', 'Customer', 'Mobile', 'Items', 'Total', 'Payment', 'Status', 'Action'].map(label => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8">Loading orders…</td></tr>
              ) : error ? (
                <tr><td colSpan="8"><p role="alert">{error}</p><Button variant="outline" onClick={() => setRefresh(value => value + 1)}>Try again</Button></td></tr>
              ) : !result?.orders.length ? (
                <tr><td colSpan="8">No orders in this status.</td></tr>
              ) : result.orders.map(order => (
                <tr key={order.id}>
                  <td>
                    <b>#{order.orderNumber}</b>
                    <small>{date(order.date)}</small>
                    <div style={{ marginTop: '5px' }}>
                      {order.deliveryType === 'SCHEDULED' ? (
                        <span className="schedule-badge">📅 {order.deliveryDate} · {order.deliverySlot}</span>
                      ) : (
                        <span className="instant-badge">⚡ Instant</span>
                      )}
                    </div>
                  </td>
                  <td>{order.customer || 'Customer unavailable'}</td>
                  <td>{order.mobile || '—'}</td>
                  <td>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                  <td><b>{money(order.total)}</b></td>
                  <td>{order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}</td>
                  <td><StatusBadge status={order.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Link className="icon-btn" aria-label="View order" to={`/admin/orders/${order.id}`}>
                        <Eye />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {!loading && result?.pagination.pages > 1 && (
        <Pagination page={page} setPage={setPage} total={result.pagination.pages} />
      )}
    </>
  );
}

export function AdminOrderDetails() {
  const { id } = useParams();
  const { notify, refreshProducts, storeSettings } = useApp();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);

  // Enterprise Print & OOS Handling state
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [modifyItemModal, setModifyItemModal] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setOrder(null);
    adminService.order(id).then(value => {
      if (active) { setOrder(value); setStatus(value.status); setError(''); }
    }).catch(reason => {
      if (active) setError(reason.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [id, reload]);

  const save = async () => {
    setSaving(true);
    try {
      const value = await adminService.updateOrderStatus(id, status);
      setOrder(value);
      setStatus(value.status);
      await refreshProducts();
      window.dispatchEvent(new Event('grocify:orders-updated'));
      window.dispatchEvent(new Event('grocify:products-updated'));
      notify('Order status saved');
    } catch (reason) {
      notify(reason.message, 'error');
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
      window.dispatchEvent(new Event('grocify:orders-updated'));
      window.dispatchEvent(new Event('grocify:products-updated'));
      notify('Order items and total updated successfully');
    } catch (err) {
      notify(err.message || 'Failed to update order item', 'error');
      throw err;
    }
  };

  if (loading) return <div className="admin-card modal-body">Loading order details…</div>;
  if (error || !order) return (
    <div className="admin-card bulk-error">
      <p role="alert">{error || 'Order not found'}</p>
      <Button variant="outline" onClick={() => setReload(value => value + 1)}>Try again</Button>
      <Link className="back-link" to="/admin/orders">Back to orders</Link>
    </div>
  );

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

  return (
    <>
      <Link className="back-link" to="/admin/orders"><ArrowLeft /> Back to orders</Link>
      <div className="admin-title">
        <div>
          <h1>Order #{order.orderNumber}</h1>
          <p>Placed {date(order.date)} · India time</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            onClick={() => setPrintModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={16} />
            <span>Print Slip / Invoice</span>
          </Button>
          {isScheduled ? (
            <span className="schedule-badge">📅 {order.deliveryDate} · {order.deliverySlot}</span>
          ) : (
            <span className="instant-badge">⚡ Instant</span>
          )}
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="admin-order-grid">
        <section>
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0 }}>Order items</h3>
              {!terminal && (
                <small style={{ color: '#94a3b8', fontSize: '12px' }}>
                  Click &apos;Adjust&apos; if any item is out of stock
                </small>
              )}
            </div>

            {order.items.map(item => (
              <div className="admin-order-item" key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  {item.image && <img src={item.image} alt="" style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }} />}
                  <span>
                    <b>{item.name}</b>
                    <small>{item.unit} · Quantity {item.quantity} {item.sku ? `· ${item.sku}` : ''}</small>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <strong>{money(item.price * item.quantity)}</strong>
                  {!terminal && !isOutForDelivery && canUpdateStatus && (
                    <button
                      type="button"
                      onClick={() => setModifyItemModal(item)}
                      title="Out of stock / Reduce quantity"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        background: 'rgba(239, 68, 68, 0.08)',
                        color: '#ef4444',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <AlertTriangle size={13} />
                      <span>Adjust</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="admin-card">
            <h3>Bill breakdown</h3>
            {[
              ['Items at MRP', order.itemTotal],
              ['Product savings', -order.productDiscount],
              ['Coupon savings', -order.couponDiscount],
              ['Delivery fee', order.deliveryFee]
            ].map(([label, value]) => (
              <p className="between" key={label}>
                <span>{label}</span>
                <b>{money(value)}</b>
              </p>
            ))}
            {order.coupon && <p>Coupon: {order.coupon.code}</p>}
            <p className="grand between">
              <span>Order total</span>
              <b>{money(order.total)}</b>
            </p>
          </div>

          <div className="admin-card">
            <h3>Order history</h3>
            {order.history.length ? order.history.map(event => (
              <div className="message-box" key={event.id}>
                <b>{event.status.replaceAll('_', ' ')}</b>
                <small>{date(event.createdAt)}</small>
                <p>{event.note}</p>
              </div>
            )) : (
              <p className="muted">No status history recorded.</p>
            )}
          </div>
        </section>

        <aside>
          <div className="admin-card">
            <h3>Print & Fulfilment Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              <Button
                variant="outline"
                className="wide"
                onClick={() => setPrintModalOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Printer size={16} />
                <span>1-Click Thermal / A4 Print</span>
              </Button>
            </div>

            <h3>Update status</h3>
            {canUpdateStatus || canCancel ? (
              <>
                <select
                  className="wide-select"
                  value={status}
                  disabled={saving || terminal}
                  onChange={event => setStatus(event.target.value)}
                >
                  {allowedStatuses.map(value => <option key={value}>{value}</option>)}
                </select>
                <Button
                  className="wide"
                  disabled={saving || terminal || status === order.status}
                  onClick={save}
                >
                  {saving ? 'Saving…' : 'Save status'}
                </Button>
              </>
            ) : (
              <p className="muted" style={{ fontSize: '13px', color: '#94a3b8' }}>
                Your staff account lacks permission to change order fulfillment status.
              </p>
            )}
            {isOutForDelivery && (
              <p className="muted" style={{ fontSize: '12px', color: '#0369a1', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '8px 12px', borderRadius: '8px', marginTop: '10px' }}>
                🚚 <b>Out for Delivery:</b> Order is currently in transit. Cancellation and item adjustments are disabled.
              </p>
            )}
            {terminal && <p className="muted">This order is finalised.</p>}
          </div>

          <div className="admin-card">
            <h3>Delivery schedule</h3>
            {isScheduled ? (
              <div className="schedule-badge" style={{ display: 'inline-flex', fontSize: '12px', padding: '6px 12px', marginBottom: '14px' }}>
                📅 Scheduled: {order.deliveryDate} · {order.deliverySlot}
              </div>
            ) : (
              <div className="instant-badge" style={{ display: 'inline-flex', fontSize: '12px', padding: '6px 12px', marginBottom: '14px' }}>
                ⚡ Instant Delivery
              </div>
            )}
            <h3>Customer</h3>
            <p><b>{order.customer}</b><br />{order.mobile || '—'}<br />{order.user?.email || '—'}</p>
            <h3>Delivery address</h3>
            <p>{address.line}<br />{address.cityLine}</p>
            <p>{order.deliveryInstruction || 'No delivery instructions.'}</p>
            <h3>Payment</h3>
            <p>{order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod} · {order.paymentStatus}</p>
          </div>

          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={18} style={{ color: '#38bdf8' }} />
                <span>Delivery Fulfilment & POD</span>
              </h3>
              <Link to="/admin/delivery" style={{ fontSize: '12px', color: '#38bdf8', textDecoration: 'none' }}>
                Portal →
              </Link>
            </div>

            {order.deliveryAssignments?.length > 0 ? (
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                    {order.deliveryAssignments[0].deliveryPerson?.name || 'Staff Assigned'}
                  </span>
                  <span className="badge" style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 8px', borderRadius: '4px' }}>
                    {order.deliveryAssignments[0].status?.replace('_', ' ')}
                  </span>
                </div>
                {order.deliveryAssignments[0].deliveryPerson?.mobile && (
                  <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                    📞 <a href={`tel:${order.deliveryAssignments[0].deliveryPerson.mobile}`} style={{ color: '#38bdf8' }}>{order.deliveryAssignments[0].deliveryPerson.mobile}</a>
                  </p>
                )}
                {order.deliveryAssignments[0].deliveryPerson?.vehicleType && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                    🛵 {order.deliveryAssignments[0].deliveryPerson.vehicleType} {order.deliveryAssignments[0].deliveryPerson.vehicleNumber ? `· ${order.deliveryAssignments[0].deliveryPerson.vehicleNumber}` : ''}
                  </p>
                )}
              </div>
            ) : (
              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.2)', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: '#eab308' }}>⚠️ No delivery driver assigned yet.</span>
                <div style={{ marginTop: '8px' }}>
                  <Link to="/admin/delivery" className="btn btn-outline" style={{ display: 'inline-block', fontSize: '11px', padding: '4px 10px' }}>
                    Assign Driver Now
                  </Link>
                </div>
              </div>
            )}

            {order.deliveryProofs?.length > 0 && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={14} /> Proof of Delivery (Cloudinary)
                </h4>
                {order.deliveryProofs.map(proof => (
                  <div key={proof.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px', marginBottom: '8px' }}>
                    <a href={proof.cloudinaryUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={proof.cloudinaryUrl}
                        alt="POD"
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)' }}
                      />
                    </a>
                    <div style={{ flex: 1, minWidth: 0, fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: '#f8fafc' }}>{proof.recipientName || 'Recipient'}</span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: proof.verificationStatus === 'VERIFIED' ? 'rgba(34, 197, 94, 0.15)' : proof.verificationStatus === 'FLAGGED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                          color: proof.verificationStatus === 'VERIFIED' ? '#22c55e' : proof.verificationStatus === 'FLAGGED' ? '#ef4444' : '#eab308'
                        }}>
                          {proof.verificationStatus}
                        </span>
                      </div>
                      {proof.recipientPhone && <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>📱 {proof.recipientPhone}</div>}
                      {proof.notes && <div style={{ color: '#cbd5e1', fontSize: '11px', marginTop: '2px' }}>{proof.notes}</div>}
                      <a href={proof.cloudinaryUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#38bdf8', fontSize: '11px', marginTop: '4px' }}>
                        View Full Photo <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {order.codCollection && (
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>COD Collected:</span>
                  <span style={{ fontWeight: 600, color: '#22c55e' }}>{money(order.codCollection.collectedAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ color: '#94a3b8' }}>Settlement:</span>
                  <span style={{ fontWeight: 600, color: order.codCollection.settlementStatus === 'SETTLED' ? '#22c55e' : '#eab308' }}>
                    {order.codCollection.settlementStatus}
                  </span>
                </div>
              </div>
            )}
          </div>
        </aside>
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
    </>
  );
}
