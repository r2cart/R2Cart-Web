import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  Building,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  Home,
  IndianRupee,
  Mail,
  MapPin,
  Package,
  Phone,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  UserCheck
} from 'lucide-react';
import { Button, ConfirmDialog, Modal, StatusBadge, money } from '../../components/ui';
import { useApp } from '../../context/AppContext';
import { adminService } from '../../services/admin.service';

const AdminTitle = ({ title, text }) => (
  <div className="admin-title">
    <div>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  </div>
);

const date = value =>
  value
    ? new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : '—';

const statusLabel = value => (value === 'ACTIVE' ? 'Active' : 'Inactive');

const orderStatus = value =>
  String(value || '')
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());

const addressLine = address =>
  [
    address.house,
    address.street,
    address.landmark,
    address.area,
    address.city,
    address.district,
    address.state,
    address.pin
  ]
    .filter(Boolean)
    .join(', ');

function getAdminUser() {
  try {
    const raw = localStorage.getItem('grocify-admin-user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

let cachedCustomersList = null;
let lastCustomersFetch = 0;

export function AdminCustomers() {
  const { notify } = useApp();
  const [params] = useSearchParams();
  const [customers, setCustomers] = useState(() => cachedCustomersList || []);
  const [selected, setSelected] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [q, setQ] = useState(() => params.get('q') || '');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(() => !cachedCustomersList);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const adminUser = getAdminUser();
  const canDelete =
    !adminUser ||
    adminUser?.role === 'SUPER_ADMIN' ||
    adminUser?.staffRole === 'SUPER_ADMIN' ||
    adminUser?.role === 'ADMIN' ||
    adminUser?.staffRole === 'ADMIN';

  useEffect(() => {
    setQ(params.get('q') || '');
  }, [params]);

  const toggle = async customer => {
    setSaving(true);
    try {
      const nextStatus = customer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await adminService.updateCustomerStatus(customer.id, nextStatus);
      await load(true);
      setSelected(prev =>
        prev && prev.id === customer.id ? { ...prev, status: nextStatus } : prev
      );
      notify('Customer account status updated');
    } catch (reason) {
      notify(reason.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const load = async (silent = false) => {
    if (!silent && !cachedCustomersList) setLoading(true);
    setError('');
    try {
      const data = await adminService.customers();
      cachedCustomersList = data;
      lastCustomersFetch = Date.now();
      setCustomers(data);
    } catch (err) {
      if (!cachedCustomersList) {
        setError(err.message);
        notify(err.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cachedCustomersList) {
      setLoading(false);
      if (Date.now() - lastCustomersFetch > 60000) {
        load(true);
      }
    } else {
      load(false);
    }
  }, []);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return customers.filter(
      customer =>
        (status === 'all' || customer.status === status) &&
        (!query ||
          [customer.name, customer.email, customer.mobile].some(value =>
            String(value || '')
              .toLowerCase()
              .includes(query)
          ))
    );
  }, [customers, q, status]);

  return (
    <>
      <AdminTitle
        title="Customers"
        text={loading && !customers.length ? 'Loading registered store customers…' : `${customers.length} registered customers in store database`}
      />

      <FilterBar q={q} setQ={setQ}>
        <select value={status} onChange={event => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="ACTIVE">Active accounts</option>
          <option value="INACTIVE">Inactive accounts</option>
        </select>
      </FilterBar>

      <div className="admin-card table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Mobile</th>
                <th>Total orders</th>
                <th>Spent · delivered orders</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && !customers.length ? (
                Array.from({ length: 8 }).map((_, idx) => (
                  <tr key={`skel-cust-${idx}`}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                        <div className="r2c-skeleton-box" style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div className="r2c-skeleton-box" style={{ width: '130px', height: '14px', borderRadius: '4px' }} />
                          <div className="r2c-skeleton-box" style={{ width: '170px', height: '11px', borderRadius: '4px' }} />
                        </div>
                      </div>
                    </td>
                    <td><div className="r2c-skeleton-box" style={{ width: '105px', height: '14px', borderRadius: '4px' }} /></td>
                    <td><div className="r2c-skeleton-box" style={{ width: '60px', height: '14px', borderRadius: '4px' }} /></td>
                    <td><div className="r2c-skeleton-box" style={{ width: '85px', height: '14px', borderRadius: '4px' }} /></td>
                    <td><div className="r2c-skeleton-box" style={{ width: '80px', height: '14px', borderRadius: '4px' }} /></td>
                    <td><div className="r2c-skeleton-box" style={{ width: '70px', height: '22px', borderRadius: '12px' }} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <div className="r2c-skeleton-box" style={{ width: '65px', height: '28px', borderRadius: '6px' }} />
                        <div className="r2c-skeleton-box" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan="7" style={{ padding: '24px', textAlign: 'center' }}>
                    <span className="text-danger" style={{ marginRight: 12 }}>{error}</span>
                    <Button variant="outline" onClick={load}>
                      Try again
                    </Button>
                  </td>
                </tr>
              ) : !list.length ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px 0', color: '#64748b' }}>
                    No customers match these filters.
                  </td>
                </tr>
              ) : (
                list.map(customer => {
                  const initials = (customer.name || customer.email || 'C')
                    .split(' ')
                    .filter(Boolean)
                    .map(p => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={customer.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: '#e6fbf3',
                              color: '#059669',
                              display: 'grid',
                              placeItems: 'center',
                              fontWeight: 800,
                              fontSize: '12px',
                              flexShrink: 0
                            }}
                          >
                            {initials}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <b style={{ color: '#0f172a', fontSize: '13px' }}>
                              {customer.name || 'Unnamed customer'}
                            </b>
                            <small style={{ color: '#64748b' }}>{customer.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>{customer.mobile || '—'}</td>
                      <td>
                        <b>{customer.totalOrders ?? customer.orders?.length ?? 0}</b>
                      </td>
                      <td>
                        <b>{money(customer.totalSpent || 0)}</b>
                      </td>
                      <td>{date(customer.createdAt)}</td>
                      <td>
                        <button
                          disabled={saving}
                          onClick={() => toggle(customer)}
                          aria-label="Toggle customer account status"
                          style={{ cursor: 'pointer' }}
                          title="Click to toggle account status"
                        >
                          <StatusBadge status={statusLabel(customer.status)} />
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            className="icon-btn"
                            onClick={() => setSelected(customer)}
                            aria-label={`View ${customer.name}`}
                            title="View customer profile"
                          >
                            <Eye size={17} />
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              className="icon-btn customer-trash-btn"
                              onClick={() => setDeletingCustomer(customer)}
                              aria-label={`Delete ${customer.name}`}
                              title="Permanently delete customer from database"
                              style={{
                                color: '#dc2626',
                                background: '#fff1f2',
                                border: '1px solid #fecaca',
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                display: 'grid',
                                placeItems: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CustomerDetails
        customer={selected}
        close={() => setSelected(null)}
        onToggle={toggle}
        saving={saving}
        canDelete={canDelete}
        onRequestDelete={customer => setDeletingCustomer(customer)}
      />

      <ConfirmDialog
        open={!!deletingCustomer}
        onClose={() => setDeletingCustomer(null)}
        onConfirm={async () => {
          await adminService.deleteCustomer(deletingCustomer.id);
          notify(`Customer "${deletingCustomer.name || deletingCustomer.email}" permanently deleted from database`);
          if (selected?.id === deletingCustomer.id) {
            setSelected(null);
          }
          await load();
        }}
        title="Permanently Delete Customer?"
        itemName={deletingCustomer?.name || deletingCustomer?.email}
        itemType="Customer Account"
        message={`Are you sure you want to permanently delete customer "${deletingCustomer?.name || deletingCustomer?.email}"? This will completely remove this account, along with all associated orders, addresses, and history from the database.`}
        warningNote="This database action is permanent and cannot be undone."
        confirmText="Permanently Delete"
        cancelText="Cancel"
      />
    </>
  );
}

function FilterBar({ q, setQ, children }) {
  return (
    <div className="filter-bar">
      <div className="filter-search">
        <Search size={16} />
        <input
          value={q}
          onChange={event => setQ(event.target.value)}
          placeholder="Search by name, email or mobile…"
        />
      </div>
      {children}
    </div>
  );
}

function CustomerDetails({
  customer,
  close,
  onToggle,
  saving,
  canDelete = true,
  onRequestDelete
}) {
  if (!customer) return null;

  const addresses = customer.addresses || [];
  const orders = [...(customer.orders || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  const initials = (customer.name || customer.email || 'C')
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const isActive = customer.status === 'ACTIVE';

  return (
    <Modal open onClose={close} title="Customer Profile" size="customer-modal">
      <div className="customer-modal-body">
        {/* HERO PROFILE CARD */}
        <div className="customer-hero-card">
          <div className="customer-avatar-wrap">
            <div className="customer-avatar">{initials}</div>
          </div>
          <h3>{customer.name || 'Unnamed Customer'}</h3>

          <div className="customer-meta-row">
            <StatusBadge status={statusLabel(customer.status)} />
            <span className="customer-joined-tag">
              <Calendar size={12} /> Member since {date(customer.createdAt)}
            </span>
          </div>

          <div className="customer-contact-chips">
            {customer.email && (
              <a href={`mailto:${customer.email}`} className="customer-chip" title="Send email">
                <Mail size={13} />
                <span>{customer.email}</span>
              </a>
            )}
            {customer.mobile ? (
              <a href={`tel:${customer.mobile}`} className="customer-chip" title="Call mobile">
                <Phone size={13} />
                <span>{customer.mobile}</span>
              </a>
            ) : (
              <span className="customer-chip" style={{ color: '#94a3b8' }}>
                <Phone size={13} />
                <span>Mobile not provided</span>
              </span>
            )}
          </div>
        </div>

        {/* METRICS / STATS GRID */}
        <div className="customer-stats-grid">
          <div className="customer-stat-box">
            <div className="customer-stat-icon green">
              <ShoppingBag size={20} />
            </div>
            <div className="customer-stat-info">
              <span className="customer-stat-label">Total Orders</span>
              <span className="customer-stat-value">
                {customer.totalOrders ?? orders.length}
              </span>
              <span className="customer-stat-sub">Lifetime orders</span>
            </div>
          </div>

          <div className="customer-stat-box">
            <div className="customer-stat-icon amber">
              <IndianRupee size={20} />
            </div>
            <div className="customer-stat-info">
              <span className="customer-stat-label">Total Spent</span>
              <span className="customer-stat-value">
                {money(customer.totalSpent || 0)}
              </span>
              <span className="customer-stat-sub">Delivered orders</span>
            </div>
          </div>
        </div>

        {/* SAVED ADDRESSES */}
        <div className="customer-section">
          <div className="customer-section-head">
            <div className="customer-section-title">
              <MapPin size={16} />
              <span>Saved Addresses</span>
              <span className="customer-count-badge">{addresses.length}</span>
            </div>
          </div>

          {addresses.length ? (
            addresses.map(address => {
              const typeLower = String(address.type || '').toLowerCase();
              const typeIcon =
                typeLower === 'work' || typeLower === 'office' ? (
                  <Building size={13} />
                ) : (
                  <Home size={13} />
                );

              return (
                <div className="customer-address-card" key={address.id}>
                  <div className="customer-address-top">
                    <span className="customer-address-type">
                      {typeIcon}
                      {address.type || 'Delivery Address'}
                    </span>
                    {address.isDefault && (
                      <span className="customer-default-pill">
                        <CheckCircle2 size={11} />
                        Default Address
                      </span>
                    )}
                  </div>
                  <p className="customer-address-text">
                    {addressLine(address) || 'Address details unavailable'}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="customer-empty-box">
              <MapPin size={22} />
              <p>No saved delivery addresses found</p>
            </div>
          )}
        </div>

        {/* RECENT ORDERS */}
        <div className="customer-section">
          <div className="customer-section-head">
            <div className="customer-section-title">
              <Package size={16} />
              <span>Recent Orders</span>
              <span className="customer-count-badge">{orders.length}</span>
            </div>
            {orders.length > 5 && (
              <span className="customer-section-sub">Showing 5 latest</span>
            )}
          </div>

          {orders.length ? (
            <div className="customer-orders-list">
              {orders.slice(0, 5).map(order => (
                <Link
                  to={`/admin/orders/${order.id}`}
                  className="customer-order-card"
                  key={order.id}
                  title="View order details"
                >
                  <div className="customer-order-left">
                    <span className="customer-order-id">
                      #{order.orderNumber || order.id}
                      <ArrowUpRight size={13} style={{ opacity: 0.7 }} />
                    </span>
                    <span className="customer-order-date">
                      <Clock size={11} /> {date(order.createdAt)}
                    </span>
                  </div>
                  <div className="customer-order-right">
                    <span className="customer-order-amount">
                      {money(order.grandTotal || 0)}
                    </span>
                    <StatusBadge status={orderStatus(order.status)} />
                    <ChevronRight size={15} className="customer-order-arrow" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="customer-empty-box">
              <Package size={22} />
              <p>No orders placed yet</p>
            </div>
          )}
        </div>
      </div>

      <div className="customer-modal-foot">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {onToggle && (
            <button
              type="button"
              className={`customer-toggle-btn ${isActive ? 'deactivate' : 'activate'}`}
              disabled={saving}
              onClick={() => onToggle(customer)}
            >
              {isActive ? (
                <>
                  <ShieldAlert size={14} />
                  <span>{saving ? 'Updating…' : 'Suspend Account'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={14} />
                  <span>{saving ? 'Updating…' : 'Activate Account'}</span>
                </>
              )}
            </button>
          )}

          {canDelete && onRequestDelete && (
            <button
              type="button"
              className="customer-delete-btn"
              onClick={() => onRequestDelete(customer)}
              title="Permanently delete customer from database"
            >
              <Trash2 size={14} />
              <span>Delete from DB</span>
            </button>
          )}
        </div>

        <Button
          variant="outline"
          onClick={close}
          style={{ height: '36px', fontSize: '13px', padding: '0 16px' }}
        >
          Close
        </Button>
      </div>
    </Modal>
  );
}
