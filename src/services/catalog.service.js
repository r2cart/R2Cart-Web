import {api} from './httpClient';
import {flattenProducts} from '../utils/products';
export const catalogService={
 listProducts:async query=>{const params=new URLSearchParams(query||'');params.set('limit','50');const rows=[];let page=1,batch;do{params.set('page',String(page++));batch=await api.get(`/products?${params}`);rows.push(...batch)}while(batch.length===50);return flattenProducts(rows)},
 getProduct:id=>api.get(`/products/${id}`),
 listCategories:()=>api.get('/categories'),
 listBanners:()=>api.get('/banners'),
 listDelivery:()=>api.get('/delivery'),
 getStoreSettings:()=>api.get('/settings'),
 searchProducts:query=>api.get(`/products?q=${encodeURIComponent(query)}`),
 sendContactMessage:value=>api.post('/contact',value),
 listDeliverySlots:(date)=>api.get(`/delivery-slots${date?`?date=${encodeURIComponent(date)}`:''}`),
 getActiveMarketing:()=>api.get('/marketing/active'),
 trackMarketing:(id,action)=>api.post(`/marketing/${id}/track`,{action})
};

