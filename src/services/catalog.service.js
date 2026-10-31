import {api} from './httpClient';
import {flattenProducts} from '../utils/products';

export const catalogService = {
  listProducts: async query => {
    const params = new URLSearchParams(query || '');
    params.set('limit', '100');
    const rows = [];
    let page = 1, batch;
    do {
      params.set('page', String(page++));
      batch = await api.get(`/products?${params}`);
      rows.push(...batch);
    } while (batch.length === 100);
    return flattenProducts(rows);
  },
  getProduct: id => api.get(`/products/${id}`),
  listCategories: () => api.get('/categories'),
  listBanners: () => api.get('/banners'),
  listDelivery: () => api.get('/delivery'),
  getStoreSettings: () => api.get('/settings'),
  searchProducts: (query, options = {}) => {
    const q = typeof query === 'string' ? query : (query?.q || '');
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (options.category && options.category !== 'all') params.set('category', options.category);
    if (options.available) params.set('available', 'true');
    if (options.sort && options.sort !== 'popular') params.set('sort', options.sort);
    if (options.page) params.set('page', String(options.page));
    if (options.limit) params.set('limit', String(options.limit));
    return api.get(`/search?${params.toString()}`);
  },
  getSuggestions: query => api.get(`/search/suggestions?q=${encodeURIComponent(query || '')}`),
  sendContactMessage: value => api.post('/contact', value),
  listDeliverySlots: (date) => api.get(`/delivery-slots${date ? `?date=${encodeURIComponent(date)}` : ''}`),
  listActiveMarketing: () => api.get('/marketing/active'),
  getActiveMarketing: () => api.get('/marketing/active'),
  trackMarketing: (id, action) => api.post(`/marketing/${id}/track`, { action }),
  getBestSellers: () => api.get('/homepage/best-sellers'),
  getTopPicks: () => api.get('/homepage/top-picks'),
  submitProductEnquiry: (id, payload) => api.post(`/products/${id}/enquire`, payload)
};
