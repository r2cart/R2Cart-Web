import {api} from './httpClient';

// Clean stale refresh tokens from localStorage (they are now HttpOnly cookies)
(function cleanStaleTokens() {
  if (typeof window === 'undefined') return;
  ['r2cart-refresh-token','r2cart-admin-refresh-token','r2cart-delivery-refresh-token'].forEach(key => {
    try { localStorage.removeItem(key); } catch {}
  });
})();

export const setTok = (k, v) => {
  try { sessionStorage.setItem(k, v); } catch {}
  try { localStorage.setItem(k, v); } catch {}
};

export const dropTok = k => {
  try { sessionStorage.removeItem(k); } catch {}
  try { localStorage.removeItem(k); } catch {}
};

export const getTok = k => {
  try {
    return sessionStorage.getItem(k) || localStorage.getItem(k) || null;
  } catch {
    return null;
  }
};

const save = session => {
  const role = session.user?.role || session.user?.staffRole;
  if (['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(role)) {
    throw new Error(
      role === 'SUPER_ADMIN'
        ? 'Super Admin accounts must sign in via their dedicated path: /r2cart/super-administrator/login'
        : 'Store administrators must sign in via their dedicated path: /r2cart/administrator/login'
    );
  }

  if (role === 'DELIVERY_PERSON') {
    if (session.accessToken) setTok('r2cart-delivery-access-token', session.accessToken);
    localStorage.setItem('r2cart-delivery-user', JSON.stringify(session.user));
    localStorage.setItem('r2cart-delivery', 'true');
    return session.user;
  }

  if (session.accessToken) setTok('r2cart-access-token', session.accessToken);
  localStorage.setItem('r2cart-user', JSON.stringify(session.user));
  localStorage.setItem('r2cart-session-active', '1');
  return session.user;
};

const saveAdmin = session => {
  if (session.accessToken) {
    setTok('r2cart-admin-access-token', session.accessToken);
  }
  localStorage.setItem('r2cart-admin-user', JSON.stringify(session.user));
  localStorage.setItem('r2cart-admin', 'true');
  const role = session.user?.role || session.user?.staffRole;
  if (role === 'DELIVERY_PERSON') {
    if (session.accessToken) {
      setTok('r2cart-delivery-access-token', session.accessToken);
    }
    localStorage.setItem('r2cart-delivery-user', JSON.stringify(session.user));
    localStorage.setItem('r2cart-delivery', 'true');
  }
  return session.user;
};

const saveDelivery = session => {
  if (session.accessToken) {
    setTok('r2cart-delivery-access-token', session.accessToken);
  }
  localStorage.setItem('r2cart-delivery-user', JSON.stringify(session.user));
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
      await api.post('/auth/logout', { role: 'CUSTOMER' }).catch(() => {});
    } finally {
      dropTok('r2cart-access-token');
      localStorage.removeItem('r2cart-user');
      localStorage.removeItem('r2cart-session-active');
    }
  },

  async adminLogout() {
    try {
      await api.post('/auth/logout', { role: 'ADMIN' }).catch(() => {});
    } finally {
      dropTok('r2cart-admin-access-token');
      localStorage.removeItem('r2cart-admin-user');
      localStorage.removeItem('r2cart-admin');
    }
  },

  async deliveryLogout() {
    try {
      await api.post('/auth/logout', { role: 'DELIVERY' }).catch(() => {});
    } finally {
      dropTok('r2cart-delivery-access-token');
      localStorage.removeItem('r2cart-delivery-user');
      localStorage.removeItem('r2cart-delivery');
    }
  },
};
