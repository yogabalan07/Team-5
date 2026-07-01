import api from './api';

export const groupService = {
  getAll: async () => {
    const response = await api.get('/items/groups');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/items/groups/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/items/groups', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/items/groups/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/items/groups/${id}`);
    return response.data;
  },
};