import {api} from './httpClient';
export const orderService={
 list:()=>api.get('/orders'),
 get:id=>api.get(`/orders/${id}`),
 create:payload=>api.post('/checkout',payload),
 cancel:(id,reason)=>api.patch(`/orders/${id}/cancel`,{reason}),
 updateDetails:(id,payload)=>api.patch(`/orders/${id}/details`,payload),
 updateStatus:(id,status)=>api.patch(`/admin/orders/${id}/status`,{status})
};
