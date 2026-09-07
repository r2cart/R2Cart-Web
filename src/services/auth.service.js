import {api} from './httpClient';
const save=session=>{localStorage.setItem('grocify-access-token',session.accessToken);localStorage.setItem('grocify-user',JSON.stringify(session.user));return session.user};
const saveAdmin=session=>{localStorage.setItem('grocify-admin-access-token',session.accessToken);localStorage.setItem('grocify-admin-user',JSON.stringify(session.user));return session.user};
export const authService={
 login:credentials=>api.post('/auth/login',credentials).then(save),
 requestOtp:payload=>api.post('/auth/request-otp',payload),
 verifyOtp:payload=>api.post('/auth/verify-otp',payload).then(save),
 adminLogin:credentials=>api.post('/admin/auth/login',credentials).then(session=>{const user=saveAdmin(session);localStorage.setItem('grocify-admin','true');return user}),
 me:()=>api.get('/auth/me'),
 async logout(){try{await api.post('/auth/logout',{})}finally{localStorage.removeItem('grocify-access-token');localStorage.removeItem('grocify-user')}},
 async adminLogout(){localStorage.removeItem('grocify-admin-access-token');localStorage.removeItem('grocify-admin-user');localStorage.removeItem('grocify-admin')}
};
