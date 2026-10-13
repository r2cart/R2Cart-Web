import {env} from '../config/env';

export class ApiError extends Error{
 constructor(message,status,data){super(message);this.name='ApiError';this.status=status;this.data=data}
}

let refreshRequest=null;
const tokenKey=path=>{if(path.startsWith('/admin'))return 'grocify-admin-access-token';if(path.startsWith('/notifications')&&localStorage.getItem('grocify-admin-access-token')&&!localStorage.getItem('grocify-access-token'))return 'grocify-admin-access-token';return 'grocify-access-token'};
const headersFor=(path,options)=>{const token=localStorage.getItem(tokenKey(path));return {...(options.body instanceof FormData?{}:{'Content-Type':'application/json'}),...(token?{Authorization:`Bearer ${token}`}:{}) ,...options.headers}};
async function parse(response){const data=response.status===204?null:await response.json();return{data,response}}
async function refreshSession(){
 if(!refreshRequest)refreshRequest=fetch(`${env.apiBaseUrl}/auth/refresh`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'}}).then(async response=>{const payload=await response.json();if(!response.ok)throw new ApiError(payload?.message||'Your session has expired',response.status,payload);const session=payload?.data??payload;localStorage.setItem('grocify-access-token',session.accessToken);localStorage.setItem('grocify-user',JSON.stringify(session.user));return session}).finally(()=>{refreshRequest=null});
 return refreshRequest;
}

export async function request(path,options={}){
 if(!env.apiBaseUrl)throw new ApiError('API is not configured. Mock services are active.',0);
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),options.body instanceof FormData?65000:path.startsWith('/admin/products/import')?75000:env.requestTimeout);
 try{
  let result=await parse(await fetch(`${env.apiBaseUrl}${path}`,{...options,credentials:'include',headers:headersFor(path,options),signal:controller.signal}));
  if(result.response.status===401&&!path.startsWith('/admin')&&(path==='/auth/me'||!path.startsWith('/auth/'))){
   try{await refreshSession();result=await parse(await fetch(`${env.apiBaseUrl}${path}`,{...options,credentials:'include',headers:headersFor(path,options),signal:controller.signal}))}
   catch(error){const admin=path.startsWith('/admin');localStorage.removeItem(admin?'grocify-admin-access-token':'grocify-access-token');localStorage.removeItem(admin?'grocify-admin-user':'grocify-user');throw error}
  }
  if(!result.response.ok)throw new ApiError(result.data?.message||'Request failed',result.response.status,result.data);
  return result.data?.data??result.data;
 }catch(error){if(error.name==='AbortError')throw new ApiError('Server response timed out. Please try again.',408);if(error instanceof TypeError)throw new ApiError('Cannot connect to R2Cart server. Make sure the backend is running.',0);throw error}finally{clearTimeout(timeout)}
}

export const api={get:path=>request(path),post:(path,body)=>request(path,{method:'POST',body:JSON.stringify(body)}),upload:(path,body)=>request(path,{method:'POST',body}),put:(path,body)=>request(path,{method:'PUT',body:JSON.stringify(body)}),patch:(path,body)=>request(path,{method:'PATCH',body:JSON.stringify(body)}),delete:path=>request(path,{method:'DELETE'})};
