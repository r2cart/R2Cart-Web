import {api} from './httpClient';
export const customerService={
 profile:()=>api.get('/users/me'),updateProfile:value=>api.patch('/users/me',value),
 cart:()=>api.get('/cart'),setCartItem:(productId,quantity)=>api.put('/cart/items',{productId,quantity}),clearCart:()=>api.delete('/cart'),
 favorites:()=>api.get('/favorites'),addFavorite:id=>api.post(`/favorites/${id}`,{}),removeFavorite:id=>api.delete(`/favorites/${id}`),
 addresses:()=>api.get('/addresses'),addAddress:value=>api.post('/addresses',value),updateAddress:(id,value)=>api.patch(`/addresses/${id}`,value),deleteAddress:id=>api.delete(`/addresses/${id}`),setDefaultAddress:id=>api.patch(`/addresses/${id}/default`,{}),
 searchHistory:()=>api.get('/search-history'),saveSearch:query=>api.post('/search-history',{query}),removeSearch:query=>api.delete(`/search-history/${encodeURIComponent(query)}`),clearSearchHistory:()=>api.delete('/search-history'),
 coupons:()=>api.get('/coupons'),validateCoupon:code=>api.post('/coupons/validate',{code}),tickets:()=>api.get('/support'),createTicket:value=>api.post('/support',value)
};
