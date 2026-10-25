import {env} from '../config/env';

export class ApiError extends Error{
 constructor(message,status,data){super(message);this.name='ApiError';this.status=status;this.data=data}
}

let refreshCustomerPromise=null;
let refreshAdminPromise=null;
let refreshDeliveryPromise=null;

const isDeliveryPath=path=>path.startsWith('/delivery-portal')||path.startsWith('/delivery/auth')||(typeof window!=='undefined'&&window.location.pathname.startsWith('/delivery'));
const isAdminPath=path=>path.startsWith('/admin')||path.startsWith('/super-admin')||(typeof window!=='undefined'&&(window.location.pathname.startsWith('/admin')||window.location.pathname.startsWith('/super-admin')||window.location.pathname.includes('administrator')));

const tokenKey=path=>{
 if(isDeliveryPath(path)){
  return localStorage.getItem('grocify-delivery-access-token')?'grocify-delivery-access-token':(localStorage.getItem('grocify-admin-access-token')?'grocify-admin-access-token':'grocify-access-token');
 }
 return isAdminPath(path)?'grocify-admin-access-token':'grocify-access-token';
};
const refreshKey=path=>{
 if(isDeliveryPath(path)){
  return localStorage.getItem('grocify-delivery-refresh-token')?'grocify-delivery-refresh-token':(localStorage.getItem('grocify-admin-refresh-token')?'grocify-admin-refresh-token':'grocify-refresh-token');
 }
 return isAdminPath(path)?'grocify-admin-refresh-token':'grocify-refresh-token';
};
const userKey=path=>{
 if(isDeliveryPath(path)){
  return localStorage.getItem('grocify-delivery-user')?'grocify-delivery-user':(localStorage.getItem('grocify-admin-user')?'grocify-admin-user':'grocify-user');
 }
 return isAdminPath(path)?'grocify-admin-user':'grocify-user';
};

const headersFor=(path,options)=>{
 const token=localStorage.getItem(tokenKey(path));
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

async function refreshSession(isAdmin){
 const activeRefKey=isAdmin?'grocify-admin-refresh-token':'grocify-refresh-token';
 const activeAccKey=isAdmin?'grocify-admin-access-token':'grocify-access-token';
 const activeUsrKey=isAdmin?'grocify-admin-user':'grocify-user';
 const storedRefToken=localStorage.getItem(activeRefKey);

 const doRefresh=async()=>{
  const refreshEndpoint=`${env.apiBaseUrl}/auth/refresh`;
  const res=await fetch(refreshEndpoint,{
   method:'POST',
   credentials:'include',
   headers:{
    'Content-Type':'application/json',
    ...(storedRefToken?{'x-refresh-token':storedRefToken}:{})
   },
   body:JSON.stringify({refreshToken:storedRefToken||null})
  });

  const payload=await res.json();
  if(!res.ok){
   // Only clear credentials if the refresh token is explicitly rejected as invalid or expired
   // DO NOT clear on 5xx or server restart during git push deployment
   if(res.status===401&&(payload?.message?.includes('invalid')||payload?.message?.includes('expired')||payload?.message?.includes('required'))){
    localStorage.removeItem(activeAccKey);
    localStorage.removeItem(activeRefKey);
    localStorage.removeItem(activeUsrKey);
   }
   throw new ApiError(payload?.message||'Session refresh failed',res.status,payload);
  }

  const session=payload?.data??payload;
  if(session?.accessToken){
   localStorage.setItem(activeAccKey,session.accessToken);
  }
  if(session?.refreshToken){
   localStorage.setItem(activeRefKey,session.refreshToken);
  }
  if(session?.user){
   localStorage.setItem(activeUsrKey,JSON.stringify(session.user));
  }
  return session;
 };

 if(isAdmin){
  if(!refreshAdminPromise){
   refreshAdminPromise=doRefresh().finally(()=>{refreshAdminPromise=null;});
  }
  return refreshAdminPromise;
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
 const isAdmin=isAdminPath(path);

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

   // Automatic silent session recovery on 401
   if(result.response.status===401&&path!=='/auth/login'&&path!=='/admin/auth/login'&&path!=='/auth/refresh'&&path!=='/auth/logout'){
    try{
     await refreshSession(isAdmin);
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
