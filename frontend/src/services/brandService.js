import api from './api';

export const brandService = {
    getAll: async () => {
        const response = await api.get('/items/brands');
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/items/brands/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/items/brands', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/items/brands/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/items/brands/${id}`);
        return response.data;
    },
};