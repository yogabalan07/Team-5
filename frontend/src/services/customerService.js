import api from './api';

const customerService = {
    getAllCustomers: async () => {
        const response = await api.get('/customers');
        return response.data;
    },

    getCustomerById: async (id) => {
        const response = await api.get(`/customers/${id}`);
        return response.data;
    },

    createCustomer: async (customer) => {
        const response = await api.post('/customers', customer);
        return response.data;
    },

    updateCustomer: async (id, customer) => {
        const response = await api.put(`/customers/${id}`, customer);
        return response.data;
    },

    deleteCustomer: async (id) => {
        await api.delete(`/customers/${id}`);
    },

    searchCustomers: async (query) => {
        const response = await api.get(`/customers/search?query=${query}`);
        return response.data;
    }
};

export default customerService;