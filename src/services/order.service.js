import {api} from './httpClient';
export const orderService={
 list:()=>api.get('/orders'),
 get:id=>api.get(`/orders/${id}`),
 create:payload=>api.post('/checkout',payload),
 updateStatus:(id,status)=>api.patch(`/admin/orders/${id}/status`,{status})
};
