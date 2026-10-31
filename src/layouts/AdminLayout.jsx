import { useEffect, useMemo, useState } from 'react';
import AdminNavbarActions from '../components/admin/AdminNavbarActions';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  Boxes,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  Megaphone,
  Menu,
  Package,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Tags,
  TrendingUp,
  Truck,
  Users,
  X
} from 'lucide-react';
import { Logo } from './CustomerLayout';
import { authService } from '../services/auth.service';
import { BRAND } from '../config/brand';
import { subscribeToPush, getNotificationPermission, enableOrderAlerts } from '../services/pushNotification.service';
import { hasPermission } from '../utils/permissions';
import { Button } from '../components/ui';
import { useLanguage } from '../context/LanguageContext';

const NAV_LINKS = [
  { path: '/dashboard', label: 'Dashboard', key: 'dashboard', icon: LayoutDashboard, perm: ['reports.view_basic', 'reports.view_financial'] },
  { path: '/analytics', label: 'Business Analytics', key: 'businessAnalytics', icon: TrendingUp, perm: ['analytics.view', 'reports.view_financial'] },
  { path: '/products', label: 'Products', key: 'productsManage', icon: ShoppingBasket, perm: 'products.view' },
  { path: '/categories', label: 'Categories', key: 'categoriesManage', icon: Tags, perm: ['categories.manage', 'products.view'] },
  { path: '/orders', label: 'Orders', key: 'ordersManage', icon: Package, perm: 'orders.view' },
  { path: '/customers', label: 'Customers', key: 'customersManage', icon: Users, perm: 'customers.view_limited' },
  { path: '/delivery', label: 'Delivery Hub', key: 'deliveryHub', icon: Truck, perm: ['delivery.view', 'delivery.assign'] },
  { path: '/inventory', label: 'Smart Inventory', key: 'inventoryManage', icon: Boxes, perm: 'inventory.view' },
  { path: '/scheduling', label: 'Store Operations', key: 'storeOperations', icon: CalendarClock, perm: 'scheduling.manage' },
  { path: '/emergency', label: 'Emergency Pause', key: 'emergencyPause', icon: ShieldAlert, superOnly: true },
  { path: '/marketing', label: 'Marketing & Promos', key: 'marketingManage', icon: Megaphone, perm: 'coupons.manage' },
  { path: '/ranking', label: 'Product Ranking', key: 'productRanking', icon: Sparkles, superOnly: true },
  { path: '/security', label: 'Security & Staff', key: 'securityStaffRole', icon: ShieldCheck, superOnly: true },
  { path: '/banners', label: 'Banners', key: 'bannersManage', icon: ImageIcon, perm: 'banners.manage' },
  { path: '/policies', label: 'Policies & CMS', key: 'policiesManage', icon: FileText, superOnly: true },
  { path: '/support', label: 'Support', key: 'customerSupport', icon: Bell, perm: 'support.manage' },
  { path: '/settings', label: 'Settings', key: 'storeSettings', icon: Settings, superOnly: true }
];

function getStoredUser() {
  try {
    const raw = sessionStorage.getItem('r2cart-admin-user') || localStorage.getItem('r2cart-admin-user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getRoutePermissionRequirement(pathname, basePath) {
  const sub = pathname.replace(basePath, '');
  if (
    sub.startsWith('/ranking') ||
    sub.startsWith('/security') ||
    sub.startsWith('/settings') ||
    sub.startsWith('/emergency') ||
    sub.startsWith('/policies')
  ) {
    return { superOnly: true, label: 'Super Admin Security & System Settings' };
  }
  if (sub.startsWith('/products')) return { perm: 'products.view', label: 'Products Management' };
  if (sub.startsWith('/categories')) return { perm: 'categories.manage', label: 'Categories Management' };
  if (sub.startsWith('/orders')) return { perm: 'orders.view', label: 'Orders Fulfillment' };
  if (sub.startsWith('/customers')) return { perm: 'customers.view_limited', label: 'Customer Relations' };
  if (sub.startsWith('/delivery')) return { perm: ['delivery.view', 'delivery.assign'], label: 'Delivery Hub' };
  if (sub.startsWith('/inventory')) return { perm: 'inventory.view', label: 'Smart Inventory' };
  if (sub.startsWith('/scheduling') || sub.startsWith('/operations')) return { perm: 'scheduling.manage', label: 'Store Scheduling' };
  if (sub.startsWith('/marketing') || sub.startsWith('/coupons')) return { perm: 'coupons.manage', label: 'Marketing & Promos' };
  if (sub.startsWith('/banners')) return { perm: 'banners.manage', label: 'Store Banners' };
  if (sub.startsWith('/support')) return { perm: 'support.manage', label: 'Customer Support' };
  if (sub.startsWith('/dashboard')) return { perm: ['reports.view_basic', 'reports.view_financial'], label: 'Dashboard & Reports' };
  return null;
}

export default function AdminLayout({ children }) {
  const { lang, t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [perm, setPerm] = useState(() => getNotificationPermission());
  const [orderAlert, setOrderAlert] = useState(null);
  const [user, setUser] = useState(getStoredUser);
  const [authRefreshing, setAuthRefreshing] = useState(true);

  const nav = useNavigate();
  const location = useLocation();

  const isSuperUser = user?.role === 'SUPER_ADMIN' || user?.staffRole === 'SUPER_ADMIN';
  const isSuperPath = location.pathname.startsWith('/super-admin');
  const loginUrl = isSuperPath ? '/r2cart/super-administrator/login' : '/r2cart/administrator/login';
  const basePath = isSuperUser ? '/super-admin' : '/admin';
  const showBack = location.pathname !== `${basePath}/dashboard`;

  // Always refresh permissions and active status from authenticated backend source
  useEffect(() => {
    let mounted = true;
    const token = sessionStorage.getItem('r2cart-admin-access-token') || localStorage.getItem('r2cart-admin-access-token');
    if (!token) {
      window.location.replace(loginUrl);
      return;
    }

    authService
      .me()
      .then(freshUser => {
        if (!mounted) return;
        if (!freshUser || freshUser.status !== 'ACTIVE' || freshUser.isStaffActive === false) {
          authService.adminLogout().finally(() => {
            window.location.replace(`${loginUrl}?error=deactivated`);
          });
          return;
        }

        if (freshUser.role === 'DELIVERY_PERSON' || freshUser.staffRole === 'DELIVERY_PERSON') {
          window.location.replace('/delivery/dashboard');
          return;
        }
        if (freshUser.role === 'CUSTOMER') {
          window.location.replace('/');
          return;
        }

        setUser(freshUser);
        localStorage.setItem('r2cart-admin-user', JSON.stringify(freshUser));
        setAuthRefreshing(false);
      })
      .catch(err => {
        if (!mounted) return;
        // If server is restarting during push deployment (5xx, 0, network timeout), do NOT log out!
        if (!err.status || err.status >= 500 || err.status === 408 || err.name === 'AbortError') {
          setAuthRefreshing(false);
          return;
        }
        // If account explicitly deactivated by Super Admin
        if (err.status === 403 && String(err.message || '').toLowerCase().includes('deactivated')) {
          authService.adminLogout().finally(() => {
            window.location.replace(`${loginUrl}?error=deactivated`);
          });
          return;
        }
        // If temporary 401 but refresh token exists, do NOT nuke the session
        const refToken = localStorage.getItem('r2cart-admin-refresh-token');
        if (refToken) {
          setAuthRefreshing(false);
          return;
        }
        authService.adminLogout().finally(() => {
          window.location.replace(loginUrl);
        });
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Handle URL syncing between /super-admin and /admin prefixes based on verified role
  useEffect(() => {
    if (isSuperUser && location.pathname.startsWith('/admin/')) {
      nav(location.pathname.replace(/^\/admin/, '/super-admin'), { replace: true });
    } else if (!isSuperUser && location.pathname.startsWith('/super-admin')) {
      nav(location.pathname.replace(/^\/super-admin/, '/admin'), { replace: true });
    }
  }, [isSuperUser, location.pathname, nav]);

  // Notifications and Order Alerts
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      subscribeToPush({ role: 'ADMIN' }).catch(() => {});
    }

    const handleOrderAlert = e => {
      if (e.detail) {
        setOrderAlert(e.detail);
      }
    };
    const handlePermEnabled = () => {
      setPerm('granted');
    };
    window.addEventListener('r2cart:new-order-alert', handleOrderAlert);
    window.addEventListener('r2cart:notifications-enabled', handlePermEnabled);
    return () => {
      window.removeEventListener('r2cart:new-order-alert', handleOrderAlert);
      window.removeEventListener('r2cart:notifications-enabled', handlePermEnabled);
    };
  }, []);

  const handleEnableAlerts = async () => {
    const res = await enableOrderAlerts({ role: 'ADMIN', onStatusChange: setPerm });
    if (res.success) {
      setPerm('granted');
    } else if (res.reason === 'permission_denied') {
      alert(res.message || 'Notifications are blocked in your browser. Please allow notifications in your browser settings.');
    }
  };

  const adminName = user?.name || 'Administrator';
  const adminRole = user?.role === 'SUPER_ADMIN' || user?.staffRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';
  const assignedCategoryIds = Array.isArray(user?.assignedCategoryIds) ? user.assignedCategoryIds : [];
  const isCategoryScoped = !isSuperUser && (user?.staffRole === 'CATEGORY_ADMIN' || assignedCategoryIds.length > 0);

  // Check if current user is authorized to access the active page
  const pageAuthorization = useMemo(() => {
    if (!user) return { allowed: true };
    if (isSuperUser) return { allowed: true };

    const sub = location.pathname.replace(basePath, '');
    if (isCategoryScoped && (sub.startsWith('/delivery') || sub.startsWith('/scheduling') || sub.startsWith('/emergency') || sub.startsWith('/banners'))) {
      return {
        allowed: false,
        reason: 'Storewide delivery dispatch, fleet operations, and store schedules are managed globally by store managers.'
      };
    }

    const req = getRoutePermissionRequirement(location.pathname, basePath);
    if (!req) return { allowed: true };

    if (req.superOnly) {
      return {
        allowed: false,
        reason: 'This section is strictly reserved for the Platform Super Admin (Store Owner).'
      };
    }

    const perms = Array.isArray(req.perm) ? req.perm : [req.perm];
    const hasAny = perms.some(p => hasPermission(user, p));
    if (!hasAny) {
      return {
        allowed: false,
        reason: `Your staff account lacks permission to view ${req.label} (${perms.join(' or ')}). Contact Super Admin to request access.`
      };
    }

    return { allowed: true };
  }, [user, isSuperUser, isCategoryScoped, location.pathname, basePath]);

  // Filter visible links according to authorized permissions
  const visibleLinks = useMemo(() => {
    return NAV_LINKS.filter(link => {
      if (isSuperUser) return true;
      if (link.superOnly) return false;
      // Category Admins are completely isolated from global store operations & delivery fleet
      if (isCategoryScoped && (link.path === '/delivery' || link.path === '/scheduling' || link.path === '/banners' || link.path === '/emergency')) {
        return false;
      }
      if (!link.perm) return true;
      const perms = Array.isArray(link.perm) ? link.perm : [link.perm];
      return perms.some(p => hasPermission(user, p));
    });
  }, [user, isSuperUser, isCategoryScoped]);
  const adminInitials =
    (user?.name || 'Admin')
      .trim()
      .split(/\s+/)
      .map(x => x[0])
      .filter(Boolean)
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'AD';

  return (
    <div className={`admin-shell ${collapsed ? 'collapsed' : ''}`}>
      <div className={`admin-overlay ${mobile ? 'show' : ''}`} onClick={() => setMobile(false)} />
      <aside className={`admin-sidebar ${mobile ? 'mobile-show' : ''}`}>
        <div className="admin-brand">
          <Logo />
          <button onClick={() => setMobile(false)}>
            <X />
          </button>
        </div>
        <div className="workspace-label">
          {adminRole === 'SUPER_ADMIN'
            ? (lang === 'hi' ? '★ सुपर एडमिन वर्कस्पेस' : 'SUPER ADMIN WORKSPACE')
            : isCategoryScoped
              ? `🏷️ CATEGORY WORKSPACE`
              : (lang === 'hi' ? 'स्टाफ एडमिन वर्कस्पेस' : 'RESTRICTED ADMIN WORKSPACE')}
        </div>
        <nav>
          {visibleLinks.map(({ path: subPath, label, key, icon: Icon }) => (
            <NavLink
              to={`${basePath}${subPath}`}
              key={subPath}
              onClick={() => setMobile(false)}
            >
              <Icon />
              <span>{t(key || label, label)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="admin-user">
          <div>{adminInitials}</div>
          <span>
            <b>{adminName}</b>
            <small
              style={{
                color: adminRole === 'SUPER_ADMIN' ? '#f87171' : isCategoryScoped ? '#7c3aed' : '#89a494',
                fontWeight: adminRole === 'SUPER_ADMIN' ? 700 : 400
              }}
            >
              {adminRole === 'SUPER_ADMIN' ? '★ Super Administrator' : isCategoryScoped ? '🏷️ Category Admin' : 'Staff Administrator'}
            </small>
          </span>
          <button
            onClick={async () => {
              await authService.adminLogout();
              nav(loginUrl);
            }}
            aria-label="Sign out"
          >
            ↗
          </button>
        </div>
      </aside>

      <div className="admin-content">
        {/* Floating Order Banner */}
        {orderAlert && (
          <aside
            role="alert"
            aria-live="assertive"
            style={{
              position: 'fixed',
              top: '18px',
              right: '24px',
              zIndex: 99999,
              maxWidth: '460px',
              width: 'calc(100vw - 48px)',
              background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
              border: '2px solid #10b981',
              boxShadow: '0 20px 40px -5px rgba(0, 0, 0, 0.6), 0 0 30px rgba(16, 185, 129, 0.45)',
              borderRadius: '14px',
              padding: '16px 18px',
              color: '#fff'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  flexShrink: 0
                }}
              >
                🚨
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <strong style={{ fontSize: '13px', color: '#6ee7b7', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    New Order Received!
                  </strong>
                  <button
                    onClick={() => setOrderAlert(null)}
                    style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '2px 4px', fontSize: '16px', lineHeight: 1 }}
                    aria-label="Dismiss banner"
                  >
                    ✕
                  </button>
                </div>
                <div style={{ fontSize: '13px', marginTop: '4px', color: '#f3f4f6', lineHeight: 1.4 }}>
                  Order <b>#{orderAlert.orderNumber}</b>
                  {orderAlert.total ? ` · ₹${orderAlert.total}` : ''}
                  {orderAlert.customerName ? ` by ${orderAlert.customerName}` : ''}
                </div>
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      const url = orderAlert.url || `${basePath}/orders`;
                      setOrderAlert(null);
                      nav(url);
                    }}
                    style={{ background: '#10b981', color: '#022c22', fontWeight: 700, fontSize: '12px', padding: '7px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>View Order</span>
                    <span>→</span>
                  </button>
                  <button
                    onClick={() => setOrderAlert(null)}
                    style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#e5e7eb', fontWeight: 500, fontSize: '12px', padding: '7px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)', cursor: 'pointer' }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}

        {perm !== 'granted' && perm !== 'unsupported' && (
          <div style={{ background: 'linear-gradient(90deg, #148542, #0d5f2e)', color: '#fff', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 500, zIndex: 10 }}>
            <span>🔔 <b>Turn on Order Alerts:</b> Get instant sound alerts and notifications when customer orders arrive.</span>
            <button
              onClick={handleEnableAlerts}
              style={{ background: '#fff', color: '#148542', border: 'none', borderRadius: '6px', padding: '5px 12px', fontWeight: 600, cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap', marginLeft: '12px' }}
            >
              Enable Alerts
            </button>
          </div>
        )}

        <header className="admin-header">
          <div className="row gap">
            <button className="mobile-menu" onClick={() => setMobile(true)}>
              <Menu />
            </button>
            {showBack && (
              <button
                className="admin-back"
                onClick={() => (location.key !== 'default' ? nav(-1) : nav(`${basePath}/dashboard`))}
                title="Go back"
              >
                <ArrowLeft />
              </button>
            )}
            <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <ChevronRight /> : <ChevronLeft />}
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <b>
                  {BRAND.name} {adminRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                </b>
                {adminRole === 'SUPER_ADMIN' ? (
                  <span style={{ fontSize: '10px', fontWeight: 800, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', padding: '1px 6px', borderRadius: '4px', letterSpacing: '0.5px' }}>
                    SUPER ADMIN
                  </span>
                ) : isCategoryScoped ? (
                  <span style={{ fontSize: '10px', fontWeight: 800, background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe', padding: '1px 6px', borderRadius: '4px', letterSpacing: '0.5px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    🏷️ CATEGORY ADMIN
                  </span>
                ) : (
                  <span style={{ fontSize: '10px', fontWeight: 700, background: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb', padding: '1px 6px', borderRadius: '4px', letterSpacing: '0.5px' }}>
                    RESTRICTED STAFF
                  </span>
                )}
              </div>
              <small>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</small>
            </div>
          </div>
          <AdminNavbarActions />
        </header>

        <main className="admin-main">
          {pageAuthorization.allowed ? (
            children
          ) : (
            <div
              className="admin-card"
              style={{
                textAlign: 'center',
                padding: '60px 24px',
                maxWidth: '540px',
                margin: '40px auto',
                background: '#fff',
                borderRadius: '16px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.06)'
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px'
                }}
              >
                <ShieldAlert size={36} />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>
                Access Restricted
              </h2>
              <p style={{ color: '#4b5563', fontSize: '14.5px', lineHeight: 1.6, marginBottom: '24px' }}>
                {pageAuthorization.reason}
              </p>
              <Button onClick={() => nav(`${basePath}/dashboard`)}>
                Return to Dashboard
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
