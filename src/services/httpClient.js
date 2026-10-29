import {env} from '../config/env';

export class ApiError extends Error{
 constructor(message,status,data){super(message);this.name='ApiError';this.status=status;this.data=data}
}

let refreshCustomerPromise=null;
let refreshAdminPromise=null;
let refreshDeliveryPromise=null;

const getStoredToken = key => {
  try {
    return sessionStorage.getItem(key) || localStorage.getItem(key) || null;
  } catch {
    return null;
  }
};

const isDeliveryPath=path=>path.startsWith('/delivery-portal')||path.startsWith('/delivery/auth')||(typeof window!=='undefined'&&window.location.pathname.startsWith('/delivery'));
const isAdminPath=path=>path.startsWith('/admin')||path.startsWith('/super-admin')||(typeof window!=='undefined'&&(window.location.pathname.startsWith('/admin')||window.location.pathname.startsWith('/super-admin')||window.location.pathname.includes('administrator')));
const isAuthEndpoint=path=>path.includes('/login')||path.includes('/refresh')||path.includes('/logout')||path.includes('/otp')||path.includes('/password')||path.includes('/bootstrap');

const tokenKey=path=>{
 if(isDeliveryPath(path)){
  return getStoredToken('r2cart-delivery-access-token')?'r2cart-delivery-access-token':(getStoredToken('r2cart-admin-access-token')?'r2cart-admin-access-token':'r2cart-access-token');
 }
 return isAdminPath(path)?'r2cart-admin-access-token':'r2cart-access-token';
};
// refreshKey is no longer used for storage — HttpOnly cookies handle refresh tokens
// Kept for backward compat with any external callers
const refreshKey=path=>isAdminPath(path)?'r2cart-admin-refresh-token':'r2cart-refresh-token';
const userKey=path=>{
 if(isDeliveryPath(path)){
  return localStorage.getItem('r2cart-delivery-user')?'r2cart-delivery-user':(localStorage.getItem('r2cart-admin-user')?'r2cart-admin-user':'r2cart-user');
 }
 return isAdminPath(path)?'r2cart-admin-user':'r2cart-user';
};

const headersFor=(path,options)=>{
 const token=getStoredToken(tokenKey(path));
 return {
  ...(options.body instanceof FormData?{}:{'Content-Type':'application/json'}),
  ...(token?{Authorization:`Bearer ${token}`}:{}),
  ...options.headers
 };
};

async function parse(response){
 const data=response.status===204?null:await response.json();
 return {data,response};
}

async function refreshSession(role = 'CUSTOMER'){
 const activeAccKey = role === 'ADMIN'
   ? 'r2cart-admin-access-token'
   : role === 'DELIVERY'
   ? 'r2cart-delivery-access-token'
   : 'r2cart-access-token';
 const activeUsrKey = role === 'ADMIN'
   ? 'r2cart-admin-user'
   : role === 'DELIVERY'
   ? 'r2cart-delivery-user'
   : 'r2cart-user';

 const doRefresh=async()=>{
  const refreshEndpoint=`${env.apiBaseUrl}/auth/refresh`;
  // HttpOnly cookie (r2cart_refresh / r2cart_admin_refresh / r2cart_delivery_refresh) is sent automatically
  // via credentials:'include' — no body/header token needed (BUG-03 fix)
  const res=await fetch(refreshEndpoint,{
   method:'POST',
   credentials:'include',
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({ role })
  });

  const payload=await res.json();
  if(!res.ok){
   // Only clear credentials if the refresh token is explicitly rejected as invalid or expired
   // DO NOT clear on 5xx or server restart during git push deployment
   if(res.status===401&&(payload?.message?.includes('invalid')||payload?.message?.includes('expired')||payload?.message?.includes('required'))){
    try { sessionStorage.removeItem(activeAccKey); } catch {}
    try { localStorage.removeItem(activeAccKey); } catch {}
    try { localStorage.removeItem(activeUsrKey); } catch {}
   }
   const refreshErrorMsg=res.status===401?'Session expired. Please sign in again.':(payload?.message||'Session refresh failed');
   throw new ApiError(refreshErrorMsg,res.status,payload);
  }

  const session=payload?.data??payload;
  if(session?.accessToken){
   try { sessionStorage.setItem(activeAccKey,session.accessToken); } catch {}
   try { localStorage.setItem(activeAccKey,session.accessToken); } catch {}
   try { localStorage.setItem('r2cart-session-active','1'); } catch {}
  }
  if(session?.user){
   try { localStorage.setItem(activeUsrKey,JSON.stringify(session.user)); } catch {}
  }
  return session;
 };

 if(role==='ADMIN'){
  if(!refreshAdminPromise){
   refreshAdminPromise=doRefresh().finally(()=>{refreshAdminPromise=null;});
  }
  return refreshAdminPromise;
 }else if(role==='DELIVERY'){
  if(!refreshDeliveryPromise){
   refreshDeliveryPromise=doRefresh().finally(()=>{refreshDeliveryPromise=null;});
  }
  return refreshDeliveryPromise;
 }else{
  if(!refreshCustomerPromise){
   refreshCustomerPromise=doRefresh().finally(()=>{refreshCustomerPromise=null;});
  }
  return refreshCustomerPromise;
 }
}

const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

export async function request(path,options={}){
 if(!env.apiBaseUrl)throw new ApiError('API is not configured. Mock services are active.',0);
 const method=(options.method||'GET').toUpperCase();
 const isSafeToRetry=method==='GET'||options.retry===true;
 const maxRetries=isSafeToRetry?2:0;
 const isDelivery=isDeliveryPath(path);
 const isAdmin=isAdminPath(path);
 const role=isDelivery?'DELIVERY':(isAdmin?'ADMIN':'CUSTOMER');

 for(let attempt=0;attempt<=maxRetries;attempt++){
  const controller=new AbortController();
  const timeoutMs=options.body instanceof FormData?65000:path.startsWith('/admin/products/import')?75000:env.requestTimeout;
  const timeout=setTimeout(()=>controller.abort(),timeoutMs);

  try{
   let result=await parse(await fetch(`${env.apiBaseUrl}${path}`,{
    ...options,
    credentials:'include',
    headers:headersFor(path,options),
    signal:controller.signal
   }));

   // Automatic silent session recovery on 401 (skip for all auth / login / credential endpoints)
   if(result.response.status===401&&!isAuthEndpoint(path)){
    try{
     await refreshSession(role);
     result=await parse(await fetch(`${env.apiBaseUrl}${path}`,{
      ...options,
      credentials:'include',
      headers:headersFor(path,options),
      signal:controller.signal
     }));
    }catch(refreshErr){
     if(refreshErr.status>=500||refreshErr.name==='AbortError'||refreshErr instanceof TypeError){
      throw new ApiError('Server is temporarily updating. Reconnecting…',refreshErr.status||503);
     }
     throw refreshErr;
    }
   }

   // Server cold start or restart: 502/503/504
   if([502,503,504].includes(result.response.status)&&attempt<maxRetries){
    clearTimeout(timeout);
    await wait(1500*(attempt+1));
    continue;
   }

   if(!result.response.ok){
    throw new ApiError(result.data?.message||'Request failed',result.response.status,result.data);
   }
   clearTimeout(timeout);
   return result.data?.data??result.data;
  }catch(error){
   clearTimeout(timeout);
   const isNetworkOrTimeout=error.name==='AbortError'||error instanceof TypeError||error.status===408||[502,503,504].includes(error.status);
   if(isNetworkOrTimeout&&attempt<maxRetries){
    await wait(1500*(attempt+1));
    continue;
   }
   if(error.name==='AbortError')throw new ApiError('Server response timed out. Please try again.',408);
   if(error instanceof TypeError)throw new ApiError('Connecting to R2Cart server…',0);
   throw error;
  }
 }
}

export const api={
 get:(path,options={})=>request(path,options),
 post:(path,body,options={})=>request(path,{method:'POST',body:body instanceof FormData?body:JSON.stringify(body),...options}),
 upload:(path,body,options={})=>request(path,{method:'POST',body,...options}),
 put:(path,body,options={})=>request(path,{method:'PUT',body:body instanceof FormData?body:JSON.stringify(body),...options}),
 patch:(path,body,options={})=>request(path,{method:'PATCH',body:body instanceof FormData?body:JSON.stringify(body),...options}),
 delete:(path,options={})=>request(path,{method:'DELETE',...options})
};
