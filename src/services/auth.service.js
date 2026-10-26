import {api} from './httpClient';

const save=session=>{
 localStorage.setItem('r2cart-access-token',session.accessToken);
 if(session.refreshToken)localStorage.setItem('r2cart-refresh-token',session.refreshToken);
 localStorage.setItem('r2cart-user',JSON.stringify(session.user));

 const isDelivery = session.user?.role === 'DELIVERY_PERSON' || session.user?.staffRole === 'DELIVERY_PERSON';
 const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session.user?.role) || ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(session.user?.staffRole);

 if (isDelivery) {
  localStorage.setItem('r2cart-delivery-access-token', session.accessToken);
  if (session.refreshToken) localStorage.setItem('r2cart-delivery-refresh-token', session.refreshToken);
  localStorage.setItem('r2cart-delivery-user', JSON.stringify(session.user));
  localStorage.setItem('r2cart-delivery', 'true');
 }

 if (isAdmin) {
  localStorage.setItem('r2cart-admin-access-token', session.accessToken);
  if (session.refreshToken) localStorage.setItem('r2cart-admin-refresh-token', session.refreshToken);
  localStorage.setItem('r2cart-admin-user', JSON.stringify(session.user));
  localStorage.setItem('r2cart-admin', 'true');
 }

 return session.user;
};

const saveAdmin=session=>{
 localStorage.setItem('r2cart-admin-access-token',session.accessToken);
 if(session.refreshToken)localStorage.setItem('r2cart-admin-refresh-token',session.refreshToken);
 localStorage.setItem('r2cart-admin-user',JSON.stringify(session.user));
 localStorage.setItem('r2cart-admin','true');

 // Also save generic user session
 localStorage.setItem('r2cart-access-token',session.accessToken);
 if(session.refreshToken)localStorage.setItem('r2cart-refresh-token',session.refreshToken);
 localStorage.setItem('r2cart-user',JSON.stringify(session.user));

 if (session.user?.role === 'DELIVERY_PERSON' || session.user?.staffRole === 'DELIVERY_PERSON') {
  localStorage.setItem('r2cart-delivery-access-token', session.accessToken);
  if (session.refreshToken) localStorage.setItem('r2cart-delivery-refresh-token', session.refreshToken);
  localStorage.setItem('r2cart-delivery-user', JSON.stringify(session.user));
  localStorage.setItem('r2cart-delivery', 'true');
 }

 return session.user;
};

const saveDelivery=session=>{
 localStorage.setItem('r2cart-delivery-access-token',session.accessToken);
 if(session.refreshToken)localStorage.setItem('r2cart-delivery-refresh-token',session.refreshToken);
 localStorage.setItem('r2cart-delivery-user',JSON.stringify(session.user));
 localStorage.setItem('r2cart-delivery','true');

 // Also save generic user session
 localStorage.setItem('r2cart-access-token',session.accessToken);
 if(session.refreshToken)localStorage.setItem('r2cart-refresh-token',session.refreshToken);
 localStorage.setItem('r2cart-user',JSON.stringify(session.user));

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

export const authService={
 login:credentials=>api.post('/auth/login',credentials).then(save),
 requestOtp:payload=>api.post('/auth/request-otp',payload),
 verifyOtp:payload=>api.post('/auth/verify-otp',payload).then(save),
 requestPasswordReset:email=>api.post('/auth/forgot-password',{email}),
 resetPassword:payload=>api.post('/auth/reset-password',payload),
 adminLogin:credentials=>api.post('/admin/auth/login',credentials).then(saveAdmin),
 superAdminLogin:credentials=>api.post('/super-admin/auth/login',credentials).then(saveAdmin),
 deliveryLogin:credentials=>api.post('/delivery/auth/login',credentials).then(saveDelivery),
 me:()=>api.get('/auth/me'),
 async logout(){
  try{
   const refreshToken=localStorage.getItem('r2cart-refresh-token');
   await api.post('/auth/logout',{refreshToken}).catch(()=>{});
  }finally{
   localStorage.removeItem('r2cart-access-token');
   localStorage.removeItem('r2cart-refresh-token');
   localStorage.removeItem('r2cart-user');
  }
 },
 async adminLogout(){
  try{
   const refreshToken=localStorage.getItem('r2cart-admin-refresh-token');
   await api.post('/auth/logout',{refreshToken}).catch(()=>{});
  }finally{
   localStorage.removeItem('r2cart-admin-access-token');
   localStorage.removeItem('r2cart-admin-refresh-token');
   localStorage.removeItem('r2cart-admin-user');
   localStorage.removeItem('r2cart-admin');
  }
 },
 async deliveryLogout(){
  try{
   const refreshToken=localStorage.getItem('r2cart-delivery-refresh-token');
   await api.post('/auth/logout',{refreshToken}).catch(()=>{});
  }finally{
   localStorage.removeItem('r2cart-delivery-access-token');
   localStorage.removeItem('r2cart-delivery-refresh-token');
   localStorage.removeItem('r2cart-delivery-user');
   localStorage.removeItem('r2cart-delivery');
  }
 }
};
