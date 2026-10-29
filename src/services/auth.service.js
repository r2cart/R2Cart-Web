import {api} from './httpClient';

// ─── Token Storage Strategy (BUG-03 Fix) ──────────────────────────────────
// Access tokens  → sessionStorage  (JS-readable but clears on tab close,
//                                   much lower XSS blast radius)
// Refresh tokens → HttpOnly Cookie  (set by backend, NOT stored here)
// User profile   → localStorage     (non-sensitive, keeps UX continuity)
//
// MIGRATION SHIM: existing localStorage access tokens are silently moved to
// sessionStorage on first page load so no user is ever force-logged out.
// ──────────────────────────────────────────────────────────────────────────
(function migrateOnce() {
  if (typeof window === 'undefined') return;
  ['r2cart-access-token','r2cart-admin-access-token','r2cart-delivery-access-token'].forEach(key => {
    const val = localStorage.getItem(key);
    if (val && !sessionStorage.getItem(key)) sessionStorage.setItem(key, val);
    localStorage.removeItem(key);
  });
  // Refresh tokens are now HttpOnly cookie-only — remove stale copies
  ['r2cart-refresh-token','r2cart-admin-refresh-token','r2cart-delivery-refresh-token'].forEach(key => {
    localStorage.removeItem(key);
  });
})();

const setTok  = (k, v) => sessionStorage.setItem(k, v);
const dropTok = k      => sessionStorage.removeItem(k);

const save = session => {
  if (session.accessToken) setTok('r2cart-access-token', session.accessToken);
  localStorage.setItem('r2cart-user', JSON.stringify(session.user));

  const isDelivery = session.user?.role === 'DELIVERY_PERSON' || session.user?.staffRole === 'DELIVERY_PERSON';
  const isAdmin    = ['SUPER_ADMIN','ADMIN','MANAGER'].includes(session.user?.role) ||
                     ['SUPER_ADMIN','ADMIN','MANAGER'].includes(session.user?.staffRole);

  if (isDelivery) {
    if (session.accessToken) setTok('r2cart-delivery-access-token', session.accessToken);
    localStorage.setItem('r2cart-delivery-user', JSON.stringify(session.user));
    localStorage.setItem('r2cart-delivery', 'true');
  }
  if (isAdmin) {
    if (session.accessToken) setTok('r2cart-admin-access-token', session.accessToken);
    localStorage.setItem('r2cart-admin-user', JSON.stringify(session.user));
    localStorage.setItem('r2cart-admin', 'true');
  }
  return session.user;
};

const saveAdmin = session => {
  if (session.accessToken) {
    setTok('r2cart-admin-access-token', session.accessToken);
    setTok('r2cart-access-token', session.accessToken);
  }
  localStorage.setItem('r2cart-admin-user', JSON.stringify(session.user));
  localStorage.setItem('r2cart-user', JSON.stringify(session.user));
  localStorage.setItem('r2cart-admin', 'true');

  if (session.user?.role === 'DELIVERY_PERSON' || session.user?.staffRole === 'DELIVERY_PERSON') {
    if (session.accessToken) setTok('r2cart-delivery-access-token', session.accessToken);
    localStorage.setItem('r2cart-delivery-user', JSON.stringify(session.user));
    localStorage.setItem('r2cart-delivery', 'true');
  }
  return session.user;
};

const saveDelivery = session => {
  if (session.accessToken) {
    setTok('r2cart-delivery-access-token', session.accessToken);
    setTok('r2cart-access-token', session.accessToken);
  }
  localStorage.setItem('r2cart-delivery-user', JSON.stringify(session.user));
  localStorage.setItem('r2cart-user', JSON.stringify(session.user));
  localStorage.setItem('r2cart-delivery', 'true');
  return session.user;
};

export const resolveRoleRedirect = (user, defaultPath = '/') => {
  if (!user) return defaultPath;
  const role = user.role || user.staffRole;
  if (role === 'SUPER_ADMIN') return '/super-admin/dashboard';
  if (role === 'ADMIN' || role === 'MANAGER') return '/admin/dashboard';
  if (role === 'DELIVERY_PERSON') return '/delivery/dashboard';
  return defaultPath;
};

export const authService = {
  login:               credentials => api.post('/auth/login', credentials).then(save),
  requestOtp:          payload     => api.post('/auth/request-otp', payload),
  verifyOtp:           payload     => api.post('/auth/verify-otp', payload).then(save),
  requestPasswordReset:email       => api.post('/auth/forgot-password', {email}),
  resetPassword:       payload     => api.post('/auth/reset-password', payload),
  adminLogin:          credentials => api.post('/admin/auth/login', credentials).then(saveAdmin),
  superAdminLogin:     credentials => api.post('/super-admin/auth/login', credentials).then(saveAdmin),
  deliveryLogin:       credentials => api.post('/delivery/auth/login', credentials).then(saveDelivery),
  me: () => api.get('/auth/me'),

  async logout() {
    try {
      // HttpOnly cookie sent automatically — no token needed in body
      await api.post('/auth/logout', {}).catch(() => {});
    } finally {
      dropTok('r2cart-access-token');
      localStorage.removeItem('r2cart-user');
    }
  },

  async adminLogout() {
    try {
      await api.post('/auth/logout', {}).catch(() => {});
    } finally {
      dropTok('r2cart-admin-access-token');
      dropTok('r2cart-access-token');
      localStorage.removeItem('r2cart-admin-user');
      localStorage.removeItem('r2cart-admin');
    }
  },

  async deliveryLogout() {
    try {
      await api.post('/auth/logout', {}).catch(() => {});
    } finally {
      dropTok('r2cart-delivery-access-token');
      dropTok('r2cart-access-token');
      localStorage.removeItem('r2cart-delivery-user');
      localStorage.removeItem('r2cart-delivery');
    }
  },
};
