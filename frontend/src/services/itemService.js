import api from './api';

const itemService = {
    getAllItems: async () => {
        const response = await api.get('/items');
        return response.data;
    },

    getItemById: async (id) => {
        const response = await api.get(`/items/${id}`);
        return response.data;
    },

    getItemByCode: async (code) => {
        const response = await api.get(`/items/code/${code}`);
        return response.data;
    },

    createItem: async (item) => {
        const response = await api.post('/items', item);
        return response.data;
    },

    updateItem: async (id, item) => {
        const response = await api.put(`/items/${id}`, item);
        return response.data;
    },

    deleteItem: async (id) => {
        await api.delete(`/items/${id}`);
    },

    getLowStockItems: async () => {
        const response = await api.get('/items/low-stock');
        return response.data;
    },

    getOutOfStockItems: async () => {
        const response = await api.get('/items/out-of-stock');
        return response.data;
    },

    searchItems: async (query) => {
        const response = await api.get(`/items/search?query=${query}`);
        return response.data;
    },

    updateStock: async (id, quantity) => {
        const response = await api.patch(`/items/${id}/stock?quantity=${quantity}`);
        return response.data;
    }
};

export default itemService;