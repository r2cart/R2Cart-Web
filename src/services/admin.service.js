import {api} from './httpClient';
const upload=(path,file)=>{const body=new FormData();body.append('image',file);return api.upload(path,body)};
export const adminService={
 dashboard:()=>api.get('/admin/dashboard'),
 products:()=>api.get('/products?includeInactive=true&limit=50'),
 uploadProductImage:file=>upload('/admin/uploads/products',file),
 createProduct:value=>api.post('/admin/products',value),updateProduct:(id,value)=>api.patch(`/admin/products/${id}`,value),updateProductStatus:(id,status)=>api.patch(`/admin/products/${id}/status`,{status}),deleteProduct:id=>api.delete(`/admin/products/${id}`),
 updateCouponStatus:(id,status)=>api.patch(`/admin/coupons/${id}/status`,{status}),
 categories:async()=>{try{return await api.get('/admin/categories')}catch(error){if(error.status===404)return api.get('/categories');throw error}},createCategory:value=>api.post('/admin/categories',value),updateCategory:(id,value)=>api.patch(`/admin/categories/${id}`,value),deleteCategory:id=>api.delete(`/admin/categories/${id}`),
 orders:status=>api.get(`/admin/orders${status?`?status=${status}`:''}`),order:id=>api.get(`/admin/orders/${id}`),updateOrderStatus:(id,status)=>api.patch(`/admin/orders/${id}/status`,{status}),
 customers:q=>api.get(`/admin/customers${q?`?q=${encodeURIComponent(q)}`:''}`),
 inventory:()=>api.get('/admin/inventory'),updateStock:(id,value)=>api.patch(`/admin/inventory/${id}`,value),
 coupons:()=>api.get('/admin/coupons'),createCoupon:value=>api.post('/admin/coupons',value),updateCoupon:(id,value)=>api.patch(`/admin/coupons/${id}`,value),deleteCoupon:id=>api.delete(`/admin/coupons/${id}`),
 banners:()=>api.get('/admin/banners'),uploadBannerImage:file=>upload('/admin/uploads/banners',file),createBanner:value=>api.post('/admin/banners',value),updateBanner:(id,value)=>api.patch(`/admin/banners/${id}`,value),updateBannerStatus:(id,status)=>api.patch(`/admin/banners/${id}/status`,{status}),deleteBanner:id=>api.delete(`/admin/banners/${id}`),
 delivery:()=>api.get('/admin/delivery'),saveDelivery:value=>api.put('/admin/delivery',value),
 support:()=>api.get('/admin/support'),replyTicket:(id,value)=>api.patch(`/admin/support/${id}`,value),
 settings:()=>api.get('/admin/settings'),saveSettings:value=>api.put('/admin/settings',value)
};
