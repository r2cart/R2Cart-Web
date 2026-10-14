import {api} from './httpClient';

const save=session=>{
 localStorage.setItem('grocify-access-token',session.accessToken);
 if(session.refreshToken)localStorage.setItem('grocify-refresh-token',session.refreshToken);
 localStorage.setItem('grocify-user',JSON.stringify(session.user));
 return session.user;
};

const saveAdmin=session=>{
 localStorage.setItem('grocify-admin-access-token',session.accessToken);
 if(session.refreshToken)localStorage.setItem('grocify-admin-refresh-token',session.refreshToken);
 localStorage.setItem('grocify-admin-user',JSON.stringify(session.user));
 return session.user;
};

const saveDelivery=session=>{
 localStorage.setItem('grocify-delivery-access-token',session.accessToken);
 if(session.refreshToken)localStorage.setItem('grocify-delivery-refresh-token',session.refreshToken);
 localStorage.setItem('grocify-delivery-user',JSON.stringify(session.user));
 localStorage.setItem('grocify-delivery','true');
 return session.user;
};

export const authService={
 login:credentials=>api.post('/auth/login',credentials).then(save),
 requestOtp:payload=>api.post('/auth/request-otp',payload),
 verifyOtp:payload=>api.post('/auth/verify-otp',payload).then(save),
 requestPasswordReset:email=>api.post('/auth/forgot-password',{email}),
 resetPassword:payload=>api.post('/auth/reset-password',payload),
 adminLogin:credentials=>api.post('/admin/auth/login',credentials).then(session=>{const user=saveAdmin(session);localStorage.setItem('grocify-admin','true');return user}),
 deliveryLogin:credentials=>api.post('/delivery/auth/login',credentials).then(session=>{const user=saveDelivery(session);return user}),
 me:()=>api.get('/auth/me'),
 async logout(){
  try{
   const refreshToken=localStorage.getItem('grocify-refresh-token');
   await api.post('/auth/logout',{refreshToken}).catch(()=>{});
  }finally{
   localStorage.removeItem('grocify-access-token');
   localStorage.removeItem('grocify-refresh-token');
   localStorage.removeItem('grocify-user');
  }
 },
 async adminLogout(){
  try{
   const refreshToken=localStorage.getItem('grocify-admin-refresh-token');
   await api.post('/auth/logout',{refreshToken}).catch(()=>{});
  }finally{
   localStorage.removeItem('grocify-admin-access-token');
   localStorage.removeItem('grocify-admin-refresh-token');
   localStorage.removeItem('grocify-admin-user');
   localStorage.removeItem('grocify-admin');
  }
 },
 async deliveryLogout(){
  try{
   const refreshToken=localStorage.getItem('grocify-delivery-refresh-token');
   await api.post('/auth/logout',{refreshToken}).catch(()=>{});
  }finally{
   localStorage.removeItem('grocify-delivery-access-token');
   localStorage.removeItem('grocify-delivery-refresh-token');
   localStorage.removeItem('grocify-delivery-user');
   localStorage.removeItem('grocify-delivery');
  }
 }
};
