import api from './api';

const reportService = {
    getStockReport: async (params) => {
        const response = await api.post('/reports/stock', params);
        return response.data;
    },

    getSalesReport: async (params) => {
        const response = await api.post('/reports/sales', params);
        return response.data;
    },

    getPurchaseReport: async (params) => {
        const response = await api.post('/reports/purchases', params);
        return response.data;
    },

    getSummary: async () => {
        const response = await api.get('/reports/summary');
        return response.data;
    }
};

export default reportService;
