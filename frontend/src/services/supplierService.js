import api from './api';

const supplierService = {
    getAllSuppliers: async () => {
        const response = await api.get('/suppliers');
        return response.data;
    },

    getSupplierById: async (id) => {
        const response = await api.get(`/suppliers/${id}`);
        return response.data;
    },

    getSupplierByCode: async (code) => {
        const response = await api.get(`/suppliers/code/${code}`);
        return response.data;
    },

    createSupplier: async (supplier) => {
        const response = await api.post('/suppliers', supplier);
        return response.data;
    },

    updateSupplier: async (id, supplier) => {
        const response = await api.put(`/suppliers/${id}`, supplier);
        return response.data;
    },

    deleteSupplier: async (id) => {
        await api.delete(`/suppliers/${id}`);
    },

    searchSuppliers: async (query) => {
        const response = await api.get(`/suppliers/search?query=${query}`);
        return response.data;
    }
};

export default supplierService;