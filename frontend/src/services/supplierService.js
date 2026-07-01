import api from './api';

export const supplierService = {
    getAll: async (page = 0, size = 20, search = '') => {
        const params = { 
            page, 
            size,
            sort: 'createdAt,desc'
        };
        if (search) params.search = search;
        const response = await api.get('/suppliers', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/suppliers/${id}`);
        return response.data;
    },

    getByPhone: async (phone) => {
        const response = await api.get(`/suppliers/phone/${phone}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/suppliers', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/suppliers/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/suppliers/${id}`);
        return response.data;
    },

    getRecent: async () => {
        const response = await api.get('/suppliers/recent');
        return response.data;
    },

    search: async (search, page = 0, size = 20) => {
        const params = { 
            search, 
            page, 
            size,
            sort: 'createdAt,desc'
        };
        const response = await api.get('/suppliers/search', { params });
        return response.data;
    },
};