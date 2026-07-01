import api from './api';

export const taxService = {
  getAll: async () => {
    const response = await api.get('/items/taxes');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/items/taxes/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/items/taxes', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/items/taxes/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/items/taxes/${id}`);
    return response.data;
  },
};