import api from './api';

export const purchaseService = {
    // ==================== PURCHASE ORDER METHODS ====================
    
    /**
     * Create a new purchase order
     * POST /api/purchase-orders
     */
    createOrder: async (data) => {
        try {
            const response = await api.post('/purchase-orders', data);
            return response.data;
        } catch (error) {
            console.error('Error creating purchase order:', error);
            throw error;
        }
    },

    /**
     * Get purchase order by ID
     * GET /api/purchase-orders/{id}
     * FIXES THE 404 ERROR
     */
    getOrderById: async (id) => {
        try {
            // Changed from /purchases/order/${id} to /purchase-orders/${id}
            const response = await api.get(`/purchase-orders/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching purchase order with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Get purchase order by PO number
     * GET /api/purchase-orders/number/{poNumber}
     */
    getOrderByPoNumber: async (poNumber) => {
        try {
            // Changed from /purchases/order/${poNumber} to /purchase-orders/number/${poNumber}
            const response = await api.get(`/purchase-orders/number/${poNumber}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching purchase order with PO number ${poNumber}:`, error);
            throw error;
        }
    },

    /**
     * Get all purchase orders with pagination
     * GET /api/purchase-orders
     */
    getAllOrders: async (page = 0, size = 20) => {
        try {
            const params = { 
                page, 
                size,
                sort: 'createdAt,desc'
            };
            const response = await api.get('/purchase-orders', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching purchase orders:', error);
            throw error;
        }
    },

    /**
     * Get purchase orders by supplier
     * GET /api/purchase-orders/supplier/{supplierId}
     */
    getOrdersBySupplier: async (supplierId, page = 0, size = 20) => {
        try {
            const response = await api.get(`/purchase-orders/supplier/${supplierId}`, {
                params: { page, size },
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching purchase orders for supplier ${supplierId}:`, error);
            throw error;
        }
    },

    /**
     * Get purchase orders by date range
     * GET /api/purchase-orders/date-range
     */
    getOrdersByDateRange: async (startDate, endDate, page = 0, size = 20) => {
        try {
            const response = await api.get('/purchase-orders/date-range', {
                params: { startDate, endDate, page, size },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching purchase orders by date range:', error);
            throw error;
        }
    },

    /**
     * Get purchase orders by status
     * GET /api/purchase-orders/status/{status}
     */
    getOrdersByStatus: async (status, page = 0, size = 20) => {
        try {
            const response = await api.get(`/purchase-orders/status/${status}`, {
                params: { page, size },
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching purchase orders with status ${status}:`, error);
            throw error;
        }
    },

    /**
     * Get pending purchase orders
     * GET /api/purchase-orders/pending
     */
    getPendingOrders: async (page = 0, size = 20) => {
        try {
            const response = await api.get('/purchase-orders/pending', {
                params: { page, size },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching pending purchase orders:', error);
            throw error;
        }
    },

    /**
     * Get converted purchase orders
     * GET /api/purchase-orders/converted
     */
    getConvertedOrders: async (page = 0, size = 20) => {
        try {
            const response = await api.get('/purchase-orders/converted', {
                params: { page, size },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching converted purchase orders:', error);
            throw error;
        }
    },

    /**
     * Search purchase orders
     * GET /api/purchase-orders/search
     */
    searchOrders: async (search, page = 0, size = 20) => {
        try {
            const response = await api.get('/purchase-orders/search', {
                params: { keyword: search, page, size },
            });
            return response.data;
        } catch (error) {
            console.error(`Error searching purchase orders with term "${search}":`, error);
            throw error;
        }
    },

    /**
     * Get recent purchase orders
     * GET /api/purchase-orders/recent
     */
    getRecentOrders: async (limit = 5) => {
        try {
            const response = await api.get('/purchase-orders/recent', {
                params: { limit },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching recent purchase orders:', error);
            throw error;
        }
    },

    /**
     * Get purchase order summary
     * GET /api/purchase-orders/summary
     */
    getOrderSummary: async () => {
        try {
            const response = await api.get('/purchase-orders/summary');
            return response.data;
        } catch (error) {
            console.error('Error fetching purchase order summary:', error);
            throw error;
        }
    },

    /**
     * Update purchase order
     * PUT /api/purchase-orders/{id}
     */
    updateOrder: async (id, data) => {
        try {
            const response = await api.put(`/purchase-orders/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(`Error updating purchase order with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Convert purchase order to invoice
     * POST /api/purchase-orders/{id}/convert
     */
    convertOrderToInvoice: async (id) => {
        try {
            const response = await api.post(`/purchase-orders/${id}/convert`);
            return response.data;
        } catch (error) {
            console.error(`Error converting purchase order ${id} to invoice:`, error);
            throw error;
        }
    },

    /**
     * Delete purchase order
     * DELETE /api/purchase-orders/{id}
     */
    deleteOrder: async (id) => {
        try {
            const response = await api.delete(`/purchase-orders/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting purchase order with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Bulk delete purchase orders
     * DELETE /api/purchase-orders/bulk
     */
    bulkDeleteOrders: async (ids) => {
        try {
            const response = await api.delete('/purchase-orders/bulk', { 
                data: ids 
            });
            return response.data;
        } catch (error) {
            console.error('Error bulk deleting purchase orders:', error);
            throw error;
        }
    },

    /**
     * Export purchase orders to CSV
     * GET /api/purchase-orders/export/csv
     */
    exportOrdersToCSV: async (startDate, endDate) => {
        try {
            const response = await api.get('/purchase-orders/export/csv', {
                params: { startDate, endDate },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('Error exporting purchase orders:', error);
            throw error;
        }
    },

    // ==================== PURCHASE INVOICE METHODS ====================

    /**
     * Create a new purchase invoice
     * POST /api/purchase-invoices
     */
    createInvoice: async (data) => {
        try {
            const response = await api.post('/purchase-invoices', data);
            return response.data;
        } catch (error) {
            console.error('Error creating purchase invoice:', error);
            throw error;
        }
    },

    /**
     * Get purchase invoice by ID
     * GET /api/purchase-invoices/{id}
     */
    getInvoiceById: async (id) => {
        try {
            const response = await api.get(`/purchase-invoices/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching purchase invoice with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Get purchase invoice by invoice number
     * GET /api/purchase-invoices/number/{invoiceNo}
     */
    getInvoiceByInvoiceNo: async (invoiceNo) => {
        try {
            const response = await api.get(`/purchase-invoices/number/${invoiceNo}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching purchase invoice with invoice number ${invoiceNo}:`, error);
            throw error;
        }
    },

    /**
     * Get all purchase invoices with pagination
     * GET /api/purchase-invoices
     */
    getAllInvoices: async (page = 0, size = 20) => {
        try {
            const params = { 
                page, 
                size,
                sort: 'createdAt,desc'
            };
            const response = await api.get('/purchase-invoices', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching purchase invoices:', error);
            throw error;
        }
    },

    /**
     * Get purchase invoices by supplier
     * GET /api/purchase-invoices/supplier/{supplierId}
     */
    getInvoicesBySupplier: async (supplierId, page = 0, size = 20) => {
        try {
            const response = await api.get(`/purchase-invoices/supplier/${supplierId}`, {
                params: { page, size },
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching purchase invoices for supplier ${supplierId}:`, error);
            throw error;
        }
    },

    /**
     * Get purchase invoices by date range
     * GET /api/purchase-invoices/date-range
     */
    getInvoicesByDateRange: async (startDate, endDate, dateType = 'INVOICE_DATE', page = 0, size = 20) => {
        try {
            const response = await api.get('/purchase-invoices/date-range', {
                params: { 
                    startDate, 
                    endDate, 
                    dateType, 
                    page, 
                    size 
                },
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching purchase invoices by date range:`, error);
            throw error;
        }
    },

    /**
     * Get purchase invoices by payment status
     * GET /api/purchase-invoices/payment-status/{status}
     */
    getInvoicesByPaymentStatus: async (status, page = 0, size = 20) => {
        try {
            const response = await api.get(`/purchase-invoices/payment-status/${status}`, {
                params: { page, size },
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching purchase invoices with payment status ${status}:`, error);
            throw error;
        }
    },

    /**
     * Make payment on invoice
     * POST /api/purchase-invoices/{id}/payment
     */
    makePayment: async (id, amount) => {
        try {
            const response = await api.post(`/purchase-invoices/${id}/payment`, null, {
                params: { amount }
            });
            return response.data;
        } catch (error) {
            console.error(`Error making payment on invoice ${id}:`, error);
            throw error;
        }
    },

    /**
     * Update purchase invoice
     * PUT /api/purchase-invoices/{id}
     */
    updateInvoice: async (id, data) => {
        try {
            const response = await api.put(`/purchase-invoices/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(`Error updating purchase invoice with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Delete purchase invoice
     * DELETE /api/purchase-invoices/{id}
     */
    deleteInvoice: async (id) => {
        try {
            const response = await api.delete(`/purchase-invoices/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting purchase invoice with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Search purchase invoices
     * GET /api/purchase-invoices/search
     */
    searchInvoices: async (search, page = 0, size = 20) => {
        try {
            const response = await api.get('/purchase-invoices/search', {
                params: { keyword: search, page, size },
            });
            return response.data;
        } catch (error) {
            console.error(`Error searching purchase invoices with term "${search}":`, error);
            throw error;
        }
    },

    /**
     * Get purchase invoice summary
     * GET /api/purchase-invoices/summary
     */
    getInvoiceSummary: async () => {
        try {
            const response = await api.get('/purchase-invoices/summary');
            return response.data;
        } catch (error) {
            console.error('Error fetching purchase invoice summary:', error);
            throw error;
        }
    },

    // ==================== LEGACY SUPPORT (Optional - Remove After Testing) ====================
    
    /**
     * @deprecated Use getOrderById instead
     */
    getOrderByPoNumber: async (poNumber) => {
        console.warn('getOrderByPoNumber is deprecated, use getOrderByPoNumber instead');
        return purchaseService.getOrderByPoNumber(poNumber);
    },
};

export default purchaseService;