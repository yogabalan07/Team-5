// src/services/salesService.js
import api from './api';

export const salesService = {
    // ==================== SALES INVOICE METHODS ====================
    
    /**
     * Create a new sales invoice
     * POST /api/sales/invoice
     */
    createInvoice: async (data) => {
        try {
            const response = await api.post('/sales/invoice', data);
            return response.data;
        } catch (error) {
            console.error('Error creating sales invoice:', error);
            throw error;
        }
    },

    /**
     * Get sales invoice by ID
     * GET /api/sales/invoice/id/{id}
     */
    getInvoiceById: async (id) => {
        try {
            // ✅ Fixed: Use /id/ in the path
            const response = await api.get(`/sales/invoice/id/${id}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching invoice with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Get sales invoice by invoice number
     * GET /api/sales/invoice/no/{invoiceNo}
     */
    getInvoiceByInvoiceNo: async (invoiceNo) => {
        try {
            const response = await api.get(`/sales/invoice/no/${invoiceNo}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching invoice with invoice number ${invoiceNo}:`, error);
            throw error;
        }
    },

    /**
     * Get sales invoice by either ID or invoice number
     * GET /api/sales/invoice?invoiceNo=INV-001&id=123
     */
    getInvoiceByQuery: async (params) => {
        try {
            const response = await api.get('/sales/invoice', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching invoice by query:', error);
            throw error;
        }
    },

    /**
     * Get all sales invoices with pagination
     * GET /api/sales/invoices
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
            console.error('Error fetching sales invoices:', error);
            throw error;
        }
    },

    /**
     * Get sales invoices by date range
     * GET /api/sales/invoices/date-range
     */
    getInvoicesByDateRange: async (startDate, endDate, page = 0, size = 20) => {
        try {
            const response = await api.get('/sales/invoices/date-range', {
                params: { startDate, endDate, page, size },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching sales invoices by date range:', error);
            throw error;
        }
    },

    /**
     * Get sales invoices by customer
     * GET /api/sales/invoices/customer/{customerId}
     */
    getInvoicesByCustomer: async (customerId, page = 0, size = 20) => {
        try {
            const response = await api.get(`/sales/invoices/customer/${customerId}`, {
                params: { page, size },
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching sales invoices for customer ${customerId}:`, error);
            throw error;
        }
    },

    /**
     * Update sales invoice
     * PUT /api/sales/invoice/{id}
     */
    updateInvoice: async (id, data) => {
        try {
            const response = await api.put(`/sales/invoice/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(`Error updating sales invoice with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Delete sales invoice
     * DELETE /api/sales/invoice/{id}
     */
    deleteInvoice: async (id) => {
        try {
            const response = await api.delete(`/sales/invoice/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting sales invoice with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Get sales invoice summary for dashboard
     * GET /api/sales/invoices/summary
     */
    getInvoiceSummary: async () => {
        try {
            const response = await api.get('/sales/invoices/summary');
            return response.data;
        } catch (error) {
            console.error('Error fetching sales invoice summary:', error);
            throw error;
        }
    },

    /**
     * Get recent sales invoices
     * GET /api/sales/invoices/recent
     */
    getRecentInvoices: async (limit = 5) => {
        try {
            const response = await api.get('/sales/invoices/recent', {
                params: { limit },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching recent sales invoices:', error);
            throw error;
        }
    },

    /**
     * Search sales invoices
     * GET /api/sales/invoices/search
     */
    searchInvoices: async (search, page = 0, size = 20) => {
        try {
            const response = await api.get('/sales/invoices/search', {
                params: { keyword: search, page, size },
            });
            return response.data;
        } catch (error) {
            console.error(`Error searching sales invoices with term "${search}":`, error);
            throw error;
        }
    },

    // ==================== SALES RETURN METHODS ====================

    /**
     * Create a sales return
     * POST /api/returns/sales
     */
    createSalesReturn: async (data) => {
        try {
            const response = await api.post('/returns/sales', data);
            return response.data;
        } catch (error) {
            console.error('Error creating sales return:', error);
            throw error;
        }
    },

    /**
     * Get sales return by return number
     * GET /api/returns/sales/{returnNo}
     */
    getSalesReturnByReturnNo: async (returnNo) => {
        try {
            const response = await api.get(`/returns/sales/${returnNo}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching sales return with return number ${returnNo}:`, error);
            throw error;
        }
    },

    /**
     * Get sales returns by invoice number
     * GET /api/returns/sales/invoice/{invoiceNo}
     */
    getSalesReturnsByInvoice: async (invoiceNo) => {
        try {
            const response = await api.get(`/returns/sales/invoice/${invoiceNo}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching sales returns for invoice ${invoiceNo}:`, error);
            throw error;
        }
    },

    // ==================== LEGACY/ALIAS METHODS ====================

    /**
     * Alias for getInvoiceById - kept for backward compatibility
     * @deprecated Use getInvoiceById instead
     */
    getSalesInvoiceById: async (id) => {
        console.warn('⚠️ getSalesInvoiceById is deprecated, use getInvoiceById instead');
        return salesService.getInvoiceById(id);
    },

    /**
     * Alias for getInvoiceByInvoiceNo - kept for backward compatibility
     * @deprecated Use getInvoiceByInvoiceNo instead
     */
    getSalesInvoiceByInvoiceNo: async (invoiceNo) => {
        console.warn('⚠️ getSalesInvoiceByInvoiceNo is deprecated, use getInvoiceByInvoiceNo instead');
        return salesService.getInvoiceByInvoiceNo(invoiceNo);
    },
};

export default salesService;
