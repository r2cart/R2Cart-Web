import {api} from './httpClient';
export const catalogService={
 listProducts:query=>api.get(`/products${query?`?${query}`:''}`),
 getProduct:id=>api.get(`/products/${id}`),
 listCategories:()=>api.get('/categories'),
 listBanners:()=>api.get('/banners'),
 searchProducts:query=>api.get(`/products?q=${encodeURIComponent(query)}`)
};
