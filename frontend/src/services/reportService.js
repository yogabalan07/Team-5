import api from './api';

const reportService = {
    getStockReport: async () => {
        const response = await api.get('/reports/stock');
        return response.data;
    },

    getSummary: async () => {
        const response = await api.get('/reports/summary');
        return response.data;
    },

    getSalesReport: async (startDate, endDate) => {
        const response = await api.get(`/reports/sales?startDate=${startDate}&endDate=${endDate}`);
        return response.data;
    },

    getPurchaseReport: async (startDate, endDate) => {
        const response = await api.get(`/reports/purchases?startDate=${startDate}&endDate=${endDate}`);
        return response.data;
    },

    getSalesByCustomer: async (customerId) => {
        const response = await api.get(`/reports/customer/${customerId}`);
        return response.data;
    },

    getPurchasesBySupplier: async (supplierId) => {
        const response = await api.get(`/reports/supplier/${supplierId}`);
        return response.data;
    },

    getMonthlySummary: async (year, month) => {
        const response = await api.get(`/reports/monthly?year=${year}&month=${month}`);
        return response.data;
    },

    getProfitLossReport: async (startDate, endDate) => {
        const response = await api.get(`/reports/profit-loss?startDate=${startDate}&endDate=${endDate}`);
        return response.data;
    }
};

export default reportService;