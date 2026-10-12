import {api} from './httpClient';
import {mediaUrl} from '../utils/media';
const upload=(path,file,category)=>{const body=new FormData();if(category)body.append('category',category);body.append('image',file);return api.upload(path,body)};
export const adminService={
 dashboard:()=>api.get('/admin/dashboard'),
 products:async()=>{const rows=[];let page=1,result;do{result=await api.get(`/admin/products?page=${page++}&limit=100`);rows.push(...result.products)}while(page<=result.pagination.pages);return rows},
 productsPage:query=>api.get(`/admin/products?${new URLSearchParams(query)}`),
 product:id=>api.get(`/admin/products/${id}`),
 productVariants:id=>api.get(`/admin/products/${id}/variants`),
 addProductVariant:(id,value)=>api.post(`/admin/products/${id}/variants`,value),
 uploadProductImage:(file,category)=>upload('/admin/uploads/products',file,category),
 createProduct:value=>api.post('/admin/products',value),updateProduct:(id,value)=>api.patch(`/admin/products/${id}`,value),updateProductStatus:(id,status)=>api.patch(`/admin/products/${id}/status`,{status}),deleteProduct:id=>api.delete(`/admin/products/${id}`),deleteAllProducts:()=>api.delete('/admin/products/all'),
 previewProductImport:rows=>api.post('/admin/products/import/preview',{rows}),
 importProducts:rows=>api.post('/admin/products/import',{rows}),
 updateCouponStatus:(id,status)=>api.patch(`/admin/coupons/${id}/status`,{status}),
 categories:()=>api.get('/admin/categories'),createCategory:value=>api.post('/admin/categories',value),updateCategory:(id,value)=>api.patch(`/admin/categories/${id}`,value),deleteCategory:id=>api.delete(`/admin/categories/${id}`),
 orders:async status=>{const rows=[];let page=1,result;do{result=await api.get(`/admin/orders?${new URLSearchParams({page:page++,limit:100,...(status&&{status})})}`);rows.push(...result.orders)}while(page<=result.pagination.pages);return rows},
 ordersPage:query=>api.get(`/admin/orders?${new URLSearchParams(query)}`),order:id=>api.get(`/admin/orders/${id}`),updateOrderStatus:(id,status)=>api.patch(`/admin/orders/${id}/status`,{status}),
 reorderCategories:ids=>api.post('/admin/categories/reorder',{ids}),reorderBanners:ids=>api.post('/admin/banners/reorder',{ids}),
 customers:q=>api.get(`/admin/customers${q?`?q=${encodeURIComponent(q)}`:''}`),
 updateCustomerStatus:(id,status)=>api.patch(`/admin/customers/${id}/status`,{status}),
 inventory:()=>api.get('/admin/inventory').then(rows=>rows.map(row=>({...row,image:mediaUrl(row.image)}))),updateStock:(id,value)=>api.patch(`/admin/inventory/${id}`,value),
 coupons:()=>api.get('/admin/coupons'),createCoupon:value=>api.post('/admin/coupons',value),updateCoupon:(id,value)=>api.patch(`/admin/coupons/${id}`,value),deleteCoupon:id=>api.delete(`/admin/coupons/${id}`),
 banners:()=>api.get('/admin/banners').then(rows=>rows.map(row=>({...row,image:mediaUrl(row.image)}))),uploadBannerImage:file=>upload('/admin/uploads/banners',file),createBanner:value=>api.post('/admin/banners',value),updateBanner:(id,value)=>api.patch(`/admin/banners/${id}`,value),updateBannerStatus:(id,status)=>api.patch(`/admin/banners/${id}/status`,{status}),deleteBanner:id=>api.delete(`/admin/banners/${id}`),
 delivery:()=>api.get('/admin/delivery'),createDeliveryZone:value=>api.post('/admin/delivery',value),updateDeliveryZone:(id,value)=>api.patch(`/admin/delivery/${id}`,value),updateDeliveryStatus:(id,status)=>api.patch(`/admin/delivery/${id}/status`,{status}),deleteDeliveryZone:id=>api.delete(`/admin/delivery/${id}`),
 updateDeliveryDefaults:value=>api.patch('/admin/delivery/defaults',value),
 support:()=>api.get('/admin/support'),replyTicket:(id,value)=>api.patch(`/admin/support/${id}`,value),
 settings:()=>api.get('/admin/settings'),uploadStoreLogo:file=>upload('/admin/uploads/settings/logo',file),saveSettings:value=>api.put('/admin/settings',value)
};
