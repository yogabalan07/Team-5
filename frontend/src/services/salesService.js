import api from './api';

export const salesService = {
    /**
     * Create a new sales invoice
     */
    createInvoice: async (data) => {
        try {
            console.log('📤 Creating invoice:', JSON.stringify(data, null, 2));
            const response = await api.post('/sales/invoice', data);
            console.log('✅ Invoice created:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error creating invoice:', error);
            console.error('❌ Response:', error.response?.data);
            throw error;
        }
    },

    /**
     * Get invoice by ID
     */
    getInvoiceById: async (id) => {
        try {
            const response = await api.get(`/sales/invoice/${id}`);
            console.log('📦 Invoice data:', response.data);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching invoice with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Get invoice by invoice number
     */
    getInvoiceByNo: async (invoiceNo) => {
        try {
            const response = await api.get(`/sales/invoice/number/${invoiceNo}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching invoice with number ${invoiceNo}:`, error);
            throw error;
        }
    },

    /**
     * Get all invoices with pagination
     */
    getAllInvoices: async (page = 0, size = 20) => {
        try {
            const params = { 
                page, 
                size,
                sort: 'createdAt,desc'
            };
            const response = await api.get('/sales/invoices', { params });
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching invoices:', error);
            throw error;
        }
    },

    /**
     * Get invoices by date range
     */
    getInvoicesByDateRange: async (startDate, endDate, page = 0, size = 20) => {
        try {
            const response = await api.get('/sales/invoices/date-range', {
                params: { startDate, endDate, page, size },
            });
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching invoices by date range:', error);
            throw error;
        }
    },

    /**
     * Get invoices by customer
     */
    getInvoicesByCustomer: async (customerId, page = 0, size = 20) => {
        try {
            const response = await api.get(`/sales/invoices/customer/${customerId}`, {
                params: { page, size },
            });
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching invoices for customer ${customerId}:`, error);
            throw error;
        }
    },

    /**
     * Update invoice
     */
    updateInvoice: async (id, data) => {
        try {
            console.log('📤 Updating invoice:', id);
            console.log('📤 Update data:', JSON.stringify(data, null, 2));
            
            const response = await api.put(`/sales/invoice/${id}`, data);
            console.log('✅ Invoice updated:', response.data);
            return response.data;
        } catch (error) {
            console.error(`❌ Error updating invoice with ID ${id}:`, error);
            console.error('❌ Response data:', error.response?.data);
            console.error('❌ Response status:', error.response?.status);
            throw error;
        }
    },

    /**
     * Delete invoice
     */
    deleteInvoice: async (id) => {
        try {
            const response = await api.delete(`/sales/invoice/${id}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error deleting invoice with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Search invoices
     */
    search: async (search, page = 0, size = 20) => {
        try {
            const response = await api.get('/sales/invoices/search', {
                params: { search, page, size },
            });
            return response.data;
        } catch (error) {
            console.error(`❌ Error searching invoices with term "${search}":`, error);
            throw error;
        }
    },

    /**
     * Get invoice statistics
     */
    getStats: async () => {
        try {
            const response = await api.get('/sales/stats');
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching sales stats:', error);
            throw error;
        }
    },

    /**
     * Export invoices to Excel
     */
    exportToExcel: async (filters = {}) => {
        try {
            const response = await api.post('/sales/export', filters, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('❌ Error exporting invoices:', error);
            throw error;
        }
    }
};

export default salesService;