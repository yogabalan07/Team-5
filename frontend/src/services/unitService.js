import api from './api';

export const unitService = {
  getAll: async () => {
    const response = await api.get('/items/units');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/items/units/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/items/units', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/items/units/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/items/units/${id}`);
    return response.data;
  },
};