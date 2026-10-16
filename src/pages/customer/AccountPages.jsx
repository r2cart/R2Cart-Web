import { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  ShoppingBag,
  MapPin,
  Heart,
  Tag,
  Headphones,
  LogOut,
  Edit3,
  Check,
  X,
  ShieldCheck,
  Mail,
  Phone,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AddressForm } from '../../layouts/CustomerLayout';
import { Badge, Button, ConfirmDialog, Modal } from '../../components/ui';
import { customerService } from '../../services/customer.service';
import { addressPayload, addressView } from '../../utils/address';

const accountMenuItems = [
  { to: '/account', label: 'My Profile', icon: User, desc: 'Personal details & info' },
  { to: '/orders', label: 'My Orders', icon: ShoppingBag, desc: 'Track & view past orders' },
  { to: '/account/addresses', label: 'Saved Addresses', icon: MapPin, desc: 'Delivery locations' },
  { to: '/favorites', label: 'Favourites', icon: Heart, desc: 'Saved grocery items' },
  { to: '/coupons', label: 'Offers & Coupons', icon: Tag, desc: 'Exclusive store discounts' },
  { to: '/support', label: 'Help & Support', icon: Headphones, desc: 'FAQs & customer care' }
];

export function AccountShell({ children }) {
  const { user, logout, notify } = useApp();
  const nav = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const activeItem = accountMenuItems.find(m => m.to === location.pathname) || { label: 'My Account' };
  const userInitial = (user?.name || user?.email || 'U').trim()[0]?.toUpperCase() || 'U';

  const handleLogout = async () => {
    try {
      await logout();
      notify('Signed out successfully');
      nav('/');
    } catch {
      notify('Signed out');
      nav('/');
    }
  };

  return (
    <div className="account-page-wrapper">
      {/* Breadcrumbs */}
      <nav className="account-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span className="sep">/</span>
        <Link to="/account">My account</Link>
        {activeItem.to !== '/account' && (
          <>
            <span className="sep">/</span>
            <span className="current">{activeItem.label}</span>
          </>
        )}
      </nav>

      {/* Grid Layout: Sidebar + Main Content */}
      <div className="account-grid-layout">
        {/* Left Sidebar */}
        <aside className="account-sidebar-card">
          {/* User Hero Preview */}
          <div className="account-sidebar-hero">
            <div className="account-avatar-wrapper">
              <div className="account-avatar-circle">
                {userInitial}
              </div>
              <span className="account-avatar-badge" title="Verified Customer">
                <ShieldCheck size={13} />
              </span>
            </div>
            <div className="account-hero-info">
              <div className="account-hero-name-row">
                <h2>{user?.name || 'Customer'}</h2>
                <span className="account-verified-pill">
                  <ShieldCheck size={11} />
                  Verified
                </span>
              </div>
              <p>{user?.email || 'Member'}</p>
              {user?.mobile && (
                <span className="account-hero-phone">📞 +91 {user.mobile}</span>
              )}
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="account-sidebar-nav" aria-label="Account navigation">
            {accountMenuItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  to={item.to}
                  key={item.to}
                  className={`account-nav-item ${isActive ? 'active' : ''}`}
                >
                  <i><Icon size={17} /></i>
                  <span className="label">{item.label}</span>
                  <ChevronRight size={15} className="chevron" />
                </NavLink>
              );
            })}
          </nav>

          {/* Sidebar Footer / Logout */}
          <div className="account-sidebar-footer">
            <button
              type="button"
              className="account-logout-btn"
              onClick={() => setShowLogoutConfirm(true)}
            >
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </div>
        </aside>

        {/* Right Content */}
        <section className="account-main-content">
          {children}
        </section>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Sign out of R2Cart?"
        message="You will need to sign in again to access your saved addresses and order history."
        onConfirm={handleLogout}
      />
    </div>
  );
}

export function AccountPage() {
  const { user, setUser, notify, orderList, addressList } = useApp();
  const nav = useNavigate();
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(user || { name: '', email: '', mobile: '' });
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  if (!user) {
    return (
      <div className="container page" style={{ padding: '60px 16px', textAlign: 'center' }}>
        <div className="fatal-state" style={{ margin: '0 auto', maxWidth: '460px', background: '#fff', padding: '40px 28px', borderRadius: '20px', border: '1px solid #e5e7eb', boxShadow: '0 12px 36px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>👤</span>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px', color: '#111827' }}>Sign in to view your profile</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 24px', lineHeight: 1.5 }}>
            Access your orders, saved addresses, exclusive coupons, and account preferences.
          </p>
          <Button onClick={() => nav('/login')} style={{ width: '100%', height: '46px', fontSize: '15px' }}>
            Sign in to R2Cart
          </Button>
        </div>
      </div>
    );
  }

  const cancel = () => {
    setForm(user || { name: '', email: '', mobile: '' });
    setEdit(false);
  };

  const save = async event => {
    event.preventDefault();
    if (form.name.trim().length < 2) return notify('Enter a valid full name', 'error');
    if (!/^\d{10}$/.test(form.mobile || '')) return notify('Enter a valid 10-digit mobile number', 'error');

    setSaving(true);
    try {
      const updated = await customerService.updateProfile({
        name: form.name.trim(),
        mobile: form.mobile
      });
      setUser(updated);
      setForm(updated);
      setEdit(false);
      notify('Profile updated successfully');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const orderCount = orderList?.length || 0;
  const addressCount = addressList?.length || 0;

  return (
    <AccountShell>
      {/* Welcome Banner */}
      <div className="account-welcome-box">
        <div className="account-welcome-header">
          <div>
            <h1>Welcome back, {user.name?.split(' ')[0] || 'Friend'} 👋</h1>
            <p>
              Your personal dashboard for fast grocery delivery. Manage your details, addresses, and view recent orders below.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} /> 100% Secure Account
            </span>
          </div>
        </div>
      </div>

      {/* Quick Metrics / Shortcuts */}
      <div className="account-metrics-grid">
        <Link to="/orders" className="account-metric-card">
          <div className="account-metric-icon green">
            <ShoppingBag size={22} />
          </div>
          <div className="account-metric-info">
            <b>{orderCount} {orderCount === 1 ? 'Order' : 'Orders'}</b>
            <span>Track shipments & past items</span>
          </div>
        </Link>

        <Link to="/account/addresses" className="account-metric-card">
          <div className="account-metric-icon blue">
            <MapPin size={22} />
          </div>
          <div className="account-metric-info">
            <b>{addressCount} {addressCount === 1 ? 'Address' : 'Addresses'}</b>
            <span>Manage delivery locations</span>
          </div>
        </Link>

        <Link to="/coupons" className="account-metric-card">
          <div className="account-metric-icon amber">
            <Tag size={22} />
          </div>
          <div className="account-metric-info">
            <b>Offers & Deals</b>
            <span>Available checkout coupons</span>
          </div>
        </Link>
      </div>

      {/* Main Profile Information Card */}
      <div className="account-main-card">
        <div className="account-card-top">
          <div>
            <h2>Personal Information</h2>
            <p>Keep your contact details up to date for smooth deliveries and order confirmations.</p>
          </div>
          {!edit ? (
            <Button
              variant="outline"
              onClick={() => setEdit(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '38px', fontSize: '13px' }}
            >
              <Edit3 size={15} /> Edit profile
            </Button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="ghost"
                onClick={cancel}
                disabled={saving}
                style={{ height: '38px', fontSize: '13px', padding: '0 14px' }}
              >
                <X size={15} /> Cancel
              </Button>
              <Button
                onClick={save}
                disabled={saving}
                style={{ height: '38px', fontSize: '13px', padding: '0 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Check size={15} /> {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          )}
        </div>

        <div className="account-card-body">
          <form onSubmit={save}>
            <div className="account-fields-grid">
              {/* Full Name */}
              <div className="account-field-group">
                <label className="account-field-label">
                  <span>Full Name {edit && <span className="req">*</span>}</span>
                </label>
                <div className="account-field-wrapper">
                  <span className="account-field-icon">
                    <User size={18} />
                  </span>
                  <input
                    className="account-input"
                    required
                    disabled={!edit}
                    value={form.name || ''}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter your full name"
                    autoFocus={edit}
                  />
                </div>
                <span className="account-field-hint">
                  Your primary name displayed on receipts and delivery invoices.
                </span>
              </div>

              {/* Email Address */}
              <div className="account-field-group">
                <label className="account-field-label">
                  <span>Email Address</span>
                </label>
                <div className="account-field-wrapper">
                  <span className="account-field-icon">
                    <Mail size={18} />
                  </span>
                  <input
                    className="account-input"
                    disabled
                    value={form.email || ''}
                    placeholder="name@example.com"
                  />
                  <span className="account-field-badge verified" title="Verified email">
                    <Check size={12} /> Verified
                  </span>
                </div>
                <span className="account-field-hint">
                  Email is verified and securely linked to your account.
                </span>
              </div>

              {/* Mobile Number */}
              <div className="account-field-group full">
                <label className="account-field-label">
                  <span>Mobile Phone Number {edit && <span className="req">*</span>}</span>
                </label>
                <div className="account-field-wrapper">
                  <span className="account-field-icon">
                    <Phone size={18} />
                  </span>
                  <span className="account-field-badge country">
                    🇮🇳 +91
                  </span>
                  <input
                    className="account-input has-prefix"
                    required
                    inputMode="numeric"
                    maxLength="10"
                    disabled={!edit}
                    value={form.mobile || ''}
                    onChange={e => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="10-digit mobile number"
                  />
                  {!edit && form.mobile && (
                    <span className="account-field-badge verified">
                      <Check size={12} /> OTP Verified
                    </span>
                  )}
                </div>
                <span className="account-field-hint">
                  Used by our delivery partners for live coordination and order drop-off verification.
                </span>
              </div>
            </div>

            {/* Bottom Form Actions (visible only when editing) */}
            {edit && (
              <div className="account-form-actions">
                <Button disabled={saving} style={{ padding: '10px 24px', fontSize: '14px' }}>
                  {saving ? 'Saving changes…' : 'Save changes'}
                </Button>
                <Button type="button" variant="ghost" onClick={cancel} disabled={saving} style={{ padding: '10px 18px', fontSize: '14px' }}>
                  Cancel
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>


      {/* Danger Zone: Sign out card */}
      <div className="account-danger-card">
        <div className="account-danger-info">
          <i><LogOut size={20} /></i>
          <div>
            <b>Sign out of this device</b>
            <p>Safely log out from this browser session. Your cart and saved addresses remain safely saved.</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowLogoutModal(true)}
          style={{
            borderColor: '#fca5a5',
            color: '#dc2626',
            background: '#ffffff',
            fontWeight: 700,
            padding: '8px 18px',
            fontSize: '13px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <LogOut size={15} /> Sign out
        </Button>
      </div>

      {/* Sign out confirmation */}
      <ConfirmDialog
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Sign out of your account?"
        message="Are you sure you want to sign out from this device? You can sign back in anytime with your email or mobile."
        onConfirm={async () => {
          const { logout } = await import('../../services/auth.service').then(m => ({ logout: m.authService.logout }));
          try { await logout(); } catch {}
          localStorage.removeItem('grocify-access-token');
          window.location.assign('/');
        }}
      />
    </AccountShell>
  );
}

export function AddressesPage() {
  const { addressList, setAddressList, notify, user } = useApp();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async value => {
    if (!user) return notify('Please sign in to save an address', 'error');
    setSaving(true);
    try {
      const payload = addressPayload(value);
      const saved = editing.id ? await customerService.updateAddress(editing.id, payload) : await customerService.addAddress(payload);
      const normalized = addressView(saved);
      setAddressList(items => editing.id ? items.map(item => item.id === editing.id ? normalized : item) : [normalized, ...items]);
      setEditing(null);
      notify(editing.id ? 'Address updated' : 'Address saved to your account');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await customerService.deleteAddress(deleting.id);
      setAddressList(items => items.filter(item => item.id !== deleting.id));
      setDeleting(null);
      notify('Address deleted');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const makeDefault = async id => {
    try {
      await customerService.setDefaultAddress(id);
      setAddressList(items => items.map(item => ({ ...item, default: item.id === id, isDefault: item.id === id })));
      notify('Default address updated');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  return (
    <AccountShell>
      <div className="account-main-card">
        <div className="account-card-top">
          <div>
            <h2>Saved Delivery Addresses</h2>
            <p>Manage the residential and office locations where your groceries are delivered.</p>
          </div>
          <Button onClick={() => setEditing({})} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '38px', fontSize: '13px' }}>
            + Add new address
          </Button>
        </div>

        <div className="account-card-body">
          {!addressList?.length ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: '#6b7280' }}>
              <MapPin size={36} style={{ color: '#10b981', margin: '0 auto 12px', display: 'block', opacity: 0.6 }} />
              <b style={{ fontSize: '15px', display: 'block', color: '#111827', marginBottom: '4px' }}>No saved addresses yet</b>
              <p style={{ fontSize: '13px', margin: '0 0 16px' }}>Add your home or work address for quick one-tap checkout.</p>
              <Button variant="outline" onClick={() => setEditing({})}>Add an address</Button>
            </div>
          ) : (
            <div className="address-grid manage">
              {addressList.map(a => (
                <div className={`address-card ${a.default ? 'default' : ''}`} key={a.id}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="address-type">{a.type}</span>
                    {a.default && <Badge tone="green">Default</Badge>}
                  </div>
                  <b>{a.name}</b>
                  <p>{a.line}<br />{a.cityLine || a.city}</p>
                  <small style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginTop: '4px' }}>📞 +91 {a.mobile}</small>
                  <div className="row gap" style={{ marginTop: '16px' }}>
                    <button onClick={() => setEditing(a)}>Edit</button>
                    <button onClick={() => setDeleting(a)}>Delete</button>
                    {!a.default && <button onClick={() => makeDefault(a.id)}>Set default</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={!!editing} onClose={() => !saving && setEditing(null)} title={editing?.id ? 'Edit address' : 'Add new address'} size="location-modal">
        <div className="modal-body">
          {editing && <AddressForm initial={editing} onCancel={() => setEditing(null)} onSave={save} />}
          {saving && <p className="muted">Saving address…</p>}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete this address?"
        message="Are you sure you want to remove this delivery address? You can always add it back later."
        onConfirm={remove}
      />
    </AccountShell>
  );
}
