import api from './api';

export const itemService = {
    /**
     * Get all items with pagination and search
     * Sorted by createdAt DESC (newest first)
     */
    getAll: async (page = 0, size = 20, search = '') => {
        try {
            const params = { 
                page, 
                size,
                sort: 'createdAt,desc'
            };
            if (search && search.trim()) {
                params.search = search.trim();
            }
            const response = await api.get('/items', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching items:', error);
            throw error;
        }
    },

    /**
     * Get item by ID
     */
    getById: async (id) => {
        try {
            const response = await api.get(`/items/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching item with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Get item by code
     */
    getByCode: async (code) => {
        try {
            const response = await api.get(`/items/code/${code}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching item with code ${code}:`, error);
            throw error;
        }
    },

    /**
     * Create new item
     */
    create: async (data) => {
        try {
            const payload = {
                code: data.code,
                name: data.name,
                description: data.description || '',
                brandId: data.brandId || null,
                groupId: data.groupId || null,
                sectionId: data.sectionId || null,
                unitId: data.unitId || null,
                taxId: data.taxId || null,
                purchasePrice: data.purchasePrice || 0,
                sellingPrice: data.sellingPrice || 0,
                gstRate: data.gstRate || 0,
                hsnCode: data.hsnCode || '',
                openingStock: data.openingStock || 0,
                currentStock: data.currentStock || 0,
                minStockLevel: data.minStockLevel || 0,
                maxStockLevel: data.maxStockLevel || 0,
                reorderLevel: data.reorderLevel || 0,
            };
            console.log('📤 Create payload:', payload);
            
            const response = await api.post('/items', payload);
            return response.data;
        } catch (error) {
            console.error('Error creating item:', error);
            throw error;
        }
    },

    /**
     * Update existing item
     */
    update: async (id, data) => {
        try {
            const payload = {
                code: data.code,
                name: data.name,
                description: data.description || '',
                brandId: data.brandId || null,
                groupId: data.groupId || null,
                sectionId: data.sectionId || null,
                unitId: data.unitId || null,
                taxId: data.taxId || null,
                purchasePrice: data.purchasePrice || 0,
                sellingPrice: data.sellingPrice || 0,
                gstRate: data.gstRate || 0,
                hsnCode: data.hsnCode || '',
                openingStock: data.openingStock || 0,
                currentStock: data.currentStock !== undefined ? data.currentStock : 0,
                minStockLevel: data.minStockLevel || 0,
                maxStockLevel: data.maxStockLevel || 0,
                reorderLevel: data.reorderLevel || 0,
            };
            console.log('📤 Update payload:', payload);
            
            const response = await api.put(`/items/${id}`, payload);
            console.log('✅ Update response:', response.data);
            return response.data;
        } catch (error) {
            console.error(`Error updating item with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Delete item (Hard delete)
     */
    delete: async (id) => {
        try {
            const response = await api.delete(`/items/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting item with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Get low stock items
     */
    getLowStock: async () => {
        try {
            const response = await api.get('/items/low-stock');
            return response.data;
        } catch (error) {
            console.error('Error fetching low stock items:', error);
            throw error;
        }
    },

    /**
     * Get recent items (top 10 newest)
     */
    getRecent: async () => {
        try {
            const response = await api.get('/items/recent');
            return response.data;
        } catch (error) {
            console.error('Error fetching recent items:', error);
            throw error;
        }
    },

    /**
     * Search items with pagination
     */
    search: async (search, page = 0, size = 20) => {
        try {
            const params = { 
                search: search.trim(), 
                page, 
                size,
                sort: 'createdAt,desc'
            };
            const response = await api.get('/items/search', { params });
            return response.data;
        } catch (error) {
            console.error(`Error searching items with term "${search}":`, error);
            throw error;
        }
    },

    /**
     * Update stock for an item
     */
    updateStock: async (id, newStock) => {
        try {
            const response = await api.patch(`/items/${id}/stock`, { stock: newStock });
            return response.data;
        } catch (error) {
            console.error(`Error updating stock for item ${id}:`, error);
            throw error;
        }
    },

    /**
     * Get stock transactions for an item
     */
    getStockTransactions: async (id) => {
        try {
            const response = await api.get(`/items/${id}/stock-transactions`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching stock transactions for item ${id}:`, error);
            throw error;
        }
    },

    /**
     * Get item statistics
     */
    getStats: async () => {
        try {
            const response = await api.get('/items/stats');
            return response.data;
        } catch (error) {
            console.error('Error fetching item stats:', error);
            throw error;
        }
    },

    /**
     * Bulk delete items
     */
    bulkDelete: async (ids) => {
        try {
            const response = await api.delete('/items/bulk', { 
                data: { ids } 
            });
            return response.data;
        } catch (error) {
            console.error('Error bulk deleting items:', error);
            throw error;
        }
    },

    /**
     * Export items to Excel
     */
    exportToExcel: async (filters = {}) => {
        try {
            const response = await api.post('/items/export', filters, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('Error exporting items:', error);
            throw error;
        }
    },

    /**
     * Import items from Excel
     */
    importFromExcel: async (formData) => {
        try {
            const response = await api.post('/items/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error importing items:', error);
            throw error;
        }
    }
};

export default itemService;