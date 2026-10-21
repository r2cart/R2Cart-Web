import { api } from './httpClient';

export const deliveryService = {
  getMyOrders: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    const qs = query.toString();
    return api.get(`/delivery-portal/my-orders${qs ? `?${qs}` : ''}`);
  },

  getOrderDetails: (id) => api.get(`/delivery-portal/orders/${id}`),

  updateStatus: (id, payload) => api.patch(`/delivery-portal/orders/${id}/status`, payload),

  uploadProof: (id, formData) => api.upload(`/delivery-portal/orders/${id}/upload-proof`, formData),

  completeDelivery: (id, payload) => api.post(`/delivery-portal/orders/${id}/complete-delivery`, payload),

  reportFailure: (id, payload) => api.post(`/delivery-portal/orders/${id}/report-failure`, payload),

  updateDutyStatus: (payload) => api.patch('/delivery-portal/duty-status', payload),

  getMyCodSummary: () => api.get('/delivery-portal/cod-summary'),

  getMyProfile: () => api.get('/delivery-portal/profile'),
  getDeliveryChat: (id) => api.get(`/delivery-portal/orders/${id}/chat`),
  sendDeliveryChatMessage: (id, message) => api.post(`/delivery-portal/orders/${id}/chat`, { message })
};
