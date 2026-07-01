import api from './api';

export const customerService = {
    /**
     * Get all customers with pagination and search
     * Sorted by createdAt DESC (newest first)
     * @param {number} page - Page number (0-based)
     * @param {number} size - Number of items per page
     * @param {string} search - Search term (optional)
     * @returns {Promise} - Promise with paginated customer data
     */
    getAll: async (page = 0, size = 20, search = '') => {
        try {
            const params = { 
                page, 
                size,
                sort: 'createdAt,desc' // Force newest first
            };
            if (search && search.trim()) {
                params.search = search.trim();
            }
            const response = await api.get('/customers', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching customers:', error);
            throw error;
        }
    },

    /**
     * Get customer by ID
     * @param {number} id - Customer ID
     * @returns {Promise} - Promise with customer data
     */
    getById: async (id) => {
        try {
            const response = await api.get(`/customers/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching customer with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Get customer by phone number
     * @param {string} phone - Customer phone number
     * @returns {Promise} - Promise with customer data
     */
    getByPhone: async (phone) => {
        try {
            const response = await api.get(`/customers/phone/${phone}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching customer with phone ${phone}:`, error);
            throw error;
        }
    },

    /**
     * Create new customer
     * @param {Object} data - Customer data
     * @param {string} data.name - Customer name
     * @param {string} data.phone - Customer phone
     * @param {string} data.email - Customer email (optional)
     * @param {string} data.address - Customer address (optional)
     * @param {string} data.area - Customer area (optional)
     * @param {string} data.gstNo - Customer GST number (optional)
     * @param {number} data.openingBalance - Opening balance (optional)
     * @param {number} data.creditLimit - Credit limit (optional)
     * @returns {Promise} - Promise with created customer data
     */
    create: async (data) => {
        try {
            const response = await api.post('/customers', data);
            return response.data;
        } catch (error) {
            console.error('Error creating customer:', error);
            throw error;
        }
    },

    /**
     * Update existing customer
     * @param {number} id - Customer ID
     * @param {Object} data - Updated customer data
     * @returns {Promise} - Promise with updated customer data
     */
    update: async (id, data) => {
        try {
            const response = await api.put(`/customers/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(`Error updating customer with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Delete customer (soft delete - sets isActive to false)
     * @param {number} id - Customer ID
     * @returns {Promise} - Promise with deletion response
     */
    delete: async (id) => {
        try {
            const response = await api.delete(`/customers/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting customer with ID ${id}:`, error);
            console.error('Error response:', error.response);
            console.error('Error data:', error.response?.data);
            throw error;
        }
    },

    /**
     * Get recent customers (top 10 newest)
     * @returns {Promise} - Promise with list of recent customers
     */
    getRecent: async () => {
        try {
            const response = await api.get('/customers/recent');
            return response.data;
        } catch (error) {
            console.error('Error fetching recent customers:', error);
            throw error;
        }
    },

    /**
     * Search customers with pagination
     * @param {string} search - Search term
     * @param {number} page - Page number (0-based)
     * @param {number} size - Number of items per page
     * @returns {Promise} - Promise with paginated search results
     */
    search: async (search, page = 0, size = 20) => {
        try {
            const params = { 
                search: search.trim(), 
                page, 
                size,
                sort: 'createdAt,desc' // Newest first
            };
            const response = await api.get('/customers/search', { params });
            return response.data;
        } catch (error) {
            console.error(`Error searching customers with term "${search}":`, error);
            throw error;
        }
    },

    /**
     * Export customers to Excel
     * @param {Object} filters - Filter criteria (optional)
     * @returns {Promise} - Promise with blob data
     */
    exportToExcel: async (filters = {}) => {
        try {
            const response = await api.post('/customers/export', filters, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('Error exporting customers:', error);
            throw error;
        }
    },

    /**
     * Bulk import customers from Excel
     * @param {FormData} formData - Form data with Excel file
     * @returns {Promise} - Promise with import result
     */
    importFromExcel: async (formData) => {
        try {
            const response = await api.post('/customers/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error importing customers:', error);
            throw error;
        }
    },

    /**
     * Get customer statistics
     * @returns {Promise} - Promise with customer statistics
     */
    getStats: async () => {
        try {
            const response = await api.get('/customers/stats');
            return response.data;
        } catch (error) {
            console.error('Error fetching customer stats:', error);
            throw error;
        }
    },

    /**
     * Bulk delete customers (soft delete)
     * @param {number[]} ids - Array of customer IDs
     * @returns {Promise} - Promise with deletion result
     */
    bulkDelete: async (ids) => {
        try {
            const response = await api.delete('/customers/bulk', { 
                data: { ids } 
            });
            return response.data;
        } catch (error) {
            console.error('Error bulk deleting customers:', error);
            throw error;
        }
    }
};

export default customerService;