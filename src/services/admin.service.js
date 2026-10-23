import {api} from './httpClient';
import {mediaUrl} from '../utils/media';

const upload = (path, file, category) => {
  const body = new FormData();
  if (category) body.append('category', category);
  body.append('image', file);
  return api.upload(path, body);
};

export const adminService = {
  dashboard: () => api.get('/admin/dashboard'),
  products: async () => {
    const rows = [];
    let page = 1, result;
    do {
      result = await api.get(`/admin/products?page=${page++}&limit=100`);
      rows.push(...result.products);
    } while (page <= result.pagination.pages);
    return rows;
  },
  productsPage: query => api.get(`/admin/products?${new URLSearchParams(query)}`),
  product: id => api.get(`/admin/products/${id}`),
  productVariants: id => api.get(`/admin/products/${id}/variants`),
  addProductVariant: (id, value) => api.post(`/admin/products/${id}/variants`, value),
  uploadProductImage: (file, category) => upload('/admin/uploads/products', file, category),
  createProduct: value => api.post('/admin/products', value),
  updateProduct: (id, value) => api.patch(`/admin/products/${id}`, value),
  updateProductStatus: (id, status) => api.patch(`/admin/products/${id}/status`, { status }),
  deleteProduct: id => api.delete(`/admin/products/${id}`),
  deleteAllProducts: () => api.delete('/admin/products/all'),
  previewProductImport: rows => api.post('/admin/products/import/preview', { rows }),
  importProducts: rows => api.post('/admin/products/import', { rows }),
  updateCouponStatus: (id, status) => api.patch(`/admin/coupons/${id}/status`, { status }),
  categories: () => api.get('/admin/categories'),
  createCategory: value => api.post('/admin/categories', value),
  updateCategory: (id, value) => api.patch(`/admin/categories/${id}`, value),
  deleteCategory: id => api.delete(`/admin/categories/${id}`),
  orders: async status => {
    const rows = [];
    let page = 1, result;
    do {
      result = await api.get(`/admin/orders?${new URLSearchParams({ page: page++, limit: 100, ...(status && { status }) })}`);
      rows.push(...result.orders);
    } while (page <= result.pagination.pages);
    return rows;
  },
  ordersPage: query => api.get(`/admin/orders?${new URLSearchParams(query)}`),
  order: id => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, status, note) => api.patch(`/admin/orders/${id}/status`, { status, note }),
  modifyOrderItem: (orderId, itemId, payload) => api.patch(`/admin/orders/${orderId}/items/${itemId}`, payload),
  reorderCategories: ids => api.post('/admin/categories/reorder', { ids }),
  reorderBanners: ids => api.post('/admin/banners/reorder', { ids }),
  customers: q => api.get(`/admin/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  updateCustomerStatus: (id, status) => api.patch(`/admin/customers/${id}/status`, { status }),
  deleteCustomer: id => api.delete(`/admin/customers/${id}`),

  // ==========================================
  // 1. DELIVERY MANAGEMENT (VILLAGES & AREAS)
  // ==========================================
  getVillages: (query = {}) => api.get(`/admin/delivery/villages?${new URLSearchParams(query)}`),
  getVillagePreview: (query = {}) => api.get(`/admin/delivery/villages/preview?${new URLSearchParams(query)}`),
  createVillage: value => api.post('/admin/delivery/villages', value),
  updateVillage: (id, value) => api.patch(`/admin/delivery/villages/${id}`, value),
  updateVillageStatus: (id, status) => api.patch(`/admin/delivery/villages/${id}/status`, { status }),
  pauseVillage: (id, isPaused, reason) => api.patch(`/admin/delivery/villages/${id}/pause`, { isPaused, reason }),
  deleteVillage: id => api.delete(`/admin/delivery/villages/${id}`),

  getDeliveryAreas: () => api.get('/admin/delivery/areas'),
  createDeliveryArea: value => api.post('/admin/delivery/areas', value),
  updateDeliveryArea: (id, value) => api.patch(`/admin/delivery/areas/${id}`, value),
  updateDeliveryAreaStatus: (id, status) => api.patch(`/admin/delivery/areas/${id}/status`, { status }),
  pauseDeliveryArea: (id, isPaused) => api.patch(`/admin/delivery/areas/${id}/pause`, { isPaused }),
  deleteDeliveryArea: id => api.delete(`/admin/delivery/areas/${id}`),

  getDeliveryConfig: () => api.get('/admin/delivery/config'),
  updateDeliveryConfig: value => api.patch('/admin/delivery/config', value),

  // Legacy fallback
  delivery: () => api.get('/admin/delivery'),
  createDeliveryZone: value => api.post('/admin/delivery', value),
  updateDeliveryZone: (id, value) => api.patch(`/admin/delivery/${id}`, value),
  updateDeliveryStatus: (id, status) => api.patch(`/admin/delivery/${id}/status`, { status }),
  deleteDeliveryZone: id => api.delete(`/admin/delivery/${id}`),
  updateDeliveryDefaults: value => api.patch('/admin/delivery/defaults', value),

  // ==========================================
  // 2. SMART INVENTORY MANAGEMENT
  // ==========================================
  inventory: () => api.get('/admin/inventory').then(rows => rows.map(row => ({ ...row, image: mediaUrl(row.image) }))),
  inventoryOverview: (query = {}) => api.get(`/admin/inventory/overview?${new URLSearchParams(query)}`),
  adjustStock: payload => api.post('/admin/inventory/adjust', payload),
  updateExpiry: payload => api.patch('/admin/inventory/expiry', payload),
  getInventoryLogs: (query = {}) => api.get(`/admin/inventory/logs?${new URLSearchParams(query)}`),
  toggleAutoHideOOS: autoHideOutOfStock => api.patch('/admin/inventory/auto-hide', { autoHideOutOfStock }),
  updateStock: (id, value) => api.patch(`/admin/inventory/${id}`, value),

  // ==========================================
  // 3. STORE OPERATIONS & ORDER SCHEDULING
  // ==========================================
  getStoreSchedule: () => api.get('/admin/scheduling/store-hours'),
  updateStoreHours: value => api.patch('/admin/scheduling/store-hours', value),
  getOperationsPreview: (query = {}) => {
    const clean = Object.fromEntries(Object.entries(query).filter(([_, v]) => Boolean(v) && v !== 'undefined'));
    const qs = new URLSearchParams(clean).toString();
    return api.get(`/admin/scheduling/preview${qs ? `?${qs}` : ''}`);
  },
  getSeasonalSchedules: () => api.get('/admin/scheduling/seasonal'),
  saveSeasonalSchedule: value => api.post('/admin/scheduling/seasonal', value),
  deleteSeasonalSchedule: id => api.delete(`/admin/scheduling/seasonal/${id}`),
  getSpecialDays: () => api.get('/admin/scheduling/special-days'),
  saveSpecialDay: value => api.post('/admin/scheduling/special-days', value),
  deleteSpecialDay: id => api.delete(`/admin/scheduling/special-days/${id}`),
  updateHolidays: holidays => api.patch('/admin/scheduling/holidays', { holidays }),
  pauseOrders: (isPaused, message) => api.post('/admin/scheduling/pause-orders', { isPaused, message }),
  getDeliverySlots: () => api.get('/admin/scheduling/slots'),
  createDeliverySlot: value => api.post('/admin/scheduling/slots', value),
  updateDeliverySlot: (id, value) => api.patch(`/admin/scheduling/slots/${id}`, value),
  updateDeliverySlotStatus: (id, status) => api.patch(`/admin/scheduling/slots/${id}/status`, { status }),
  deleteDeliverySlot: id => api.delete(`/admin/scheduling/slots/${id}`),
  getScheduledOrders: (query = {}) => api.get(`/admin/scheduling/orders?${new URLSearchParams(query)}`),

  // ==========================================
  // EMERGENCY MANAGEMENT (DEDICATED MODULE)
  // ==========================================
  getEmergencyStatus: () => api.get('/admin/emergency/status'),
  activateEmergency: payload => api.post('/admin/emergency/activate', payload),
  deactivateEmergency: () => api.post('/admin/emergency/deactivate'),
  getEmergencyHistory: (query = {}) => api.get(`/admin/emergency/history?${new URLSearchParams(query)}`),

  // ==========================================
  // 4. MARKETING & PROMOTIONS
  // ==========================================
  getCampaigns: (query = {}) => api.get(`/admin/marketing/campaigns?${new URLSearchParams(query)}`),
  createCampaign: value => api.post('/admin/marketing/campaigns', value),
  updateCampaign: (id, value) => api.patch(`/admin/marketing/campaigns/${id}`, value),
  updateCampaignStatus: (id, status) => api.patch(`/admin/marketing/campaigns/${id}/status`, { status }),
  deleteCampaign: id => api.delete(`/admin/marketing/campaigns/${id}`),
  getCouponUsages: (query = {}) => api.get(`/admin/marketing/coupons/usages?${new URLSearchParams(query)}`),
  getMarketingPerformance: () => api.get('/admin/marketing/performance'),

  // Coupons & Banners
  coupons: () => api.get('/admin/coupons'),
  createCoupon: value => api.post('/admin/coupons', value),
  updateCoupon: (id, value) => api.patch(`/admin/coupons/${id}`, value),
  deleteCoupon: id => api.delete(`/admin/coupons/${id}`),
  banners: () => api.get('/admin/banners').then(rows => rows.map(row => ({ ...row, image: mediaUrl(row.image) }))),
  uploadBannerImage: file => upload('/admin/uploads/banners', file),
  createBanner: value => api.post('/admin/banners', value),
  updateBanner: (id, value) => api.patch(`/admin/banners/${id}`, value),
  updateBannerStatus: (id, status) => api.patch(`/admin/banners/${id}/status`, { status }),
  deleteBanner: id => api.delete(`/admin/banners/${id}`),

  // ==========================================
  // 5. ADMIN SECURITY & AUDIT TRAIL
  // ==========================================
  getStaff: (query = {}) => api.get(`/admin/security/staff?${new URLSearchParams(query)}`),
  createStaff: value => api.post('/admin/security/staff', value),
  updateStaff: (id, value) => api.patch(`/admin/security/staff/${id}`, value),
  deleteStaff: id => api.delete(`/admin/security/staff/${id}`),
  getAuditLogs: (query = {}) => api.get(`/admin/security/audit-logs?${new URLSearchParams(query)}`),
  getLoginHistory: (query = {}) => api.get(`/admin/security/login-history?${new URLSearchParams(query)}`),

  // ==========================================
  // DELIVERY ASSIGNMENTS, POD VERIFICATION & COD SETTLEMENT
  // ==========================================
  getDeliveryStaff: (query = {}) => api.get(`/admin/delivery-assignments/staff?${new URLSearchParams(query)}`),
  getUnassignedOrders: (query = {}) => api.get(`/admin/delivery-assignments/unassigned-orders?${new URLSearchParams(query)}`),
  getDeliveryAssignments: (query = {}) => api.get(`/admin/delivery-assignments?${new URLSearchParams(query)}`),
  assignDeliveryOrder: payload => api.post('/admin/delivery-assignments/assign', payload),
  reassignDeliveryOrder: payload => api.post('/admin/delivery-assignments/reassign', payload),

  getDeliveryVerifications: (query = {}) => api.get(`/admin/delivery-verifications?${new URLSearchParams(query)}`),
  verifyDeliveryProof: (id, payload) => api.patch(`/admin/delivery-verifications/${id}`, payload),

  getCodCollections: (query = {}) => api.get(`/admin/cod-collections?${new URLSearchParams(query)}`),
  settleCodCollections: payload => api.post('/admin/cod-settlements', payload),
  getCodSettlements: (query = {}) => api.get(`/admin/cod-settlements?${new URLSearchParams(query)}`),

  // Support & Settings
  support: () => api.get('/admin/support'),
  replyTicket: (id, value) => api.patch(`/admin/support/${id}`, value),
  settings: () => api.get('/admin/settings'),
  uploadStoreLogo: file => upload('/admin/uploads/settings/logo', file),
  saveSettings: value => api.put('/admin/settings', value),
  setEmergencyPause: payload => api.post('/admin/store/emergency-pause', payload),
  getProfile: () => api.get('/admin/profile'),
  updateProfile: value => api.patch('/admin/profile', value),
  changePassword: (currentPassword, password) => api.patch('/admin/profile/password', { currentPassword, password }),

  // Homepage Product Ranking (Super Admin)
  getHomepageRankingConfig: () => api.get('/admin/homepage-ranking'),
  saveHomepageRankingDraft: value => api.put('/admin/homepage-ranking/draft', value),
  previewHomepageRanking: (target = 'draft') => api.get(`/admin/homepage-ranking/preview?target=${target}`),
  publishHomepageRanking: payload => api.post('/admin/homepage-ranking/publish', payload),
  getHomepageRankingHistory: () => api.get('/admin/homepage-ranking/history'),
  rollbackHomepageRanking: payload => api.post('/admin/homepage-ranking/rollback', payload),
  refreshHomepageRankingCache: () => api.post('/admin/homepage-ranking/refresh-cache')
};
