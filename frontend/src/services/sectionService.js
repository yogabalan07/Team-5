import api from './api';

export const sectionService = {
  getAll: async () => {
    const response = await api.get('/items/sections');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/items/sections/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/items/sections', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/items/sections/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/items/sections/${id}`);
    return response.data;
  },
};