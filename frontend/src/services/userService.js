// src/services/userService.js
import api from './api';

export const userService = {
    // Get all users with pagination
    getAll: async (page = 0, size = 10, search = '') => {
        try {
            const response = await api.get('/users', {
                params: { page, size, search, sort: 'createdAt,desc' }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },

    // Get user by ID
    getById: async (id) => {
        try {
            const response = await api.get(`/users/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching user:', error);
            throw error;
        }
    },

    // Create user
    create: async (data) => {
        try {
            console.log('📤 Creating user with data:', data);
            const response = await api.post('/users', data);
            console.log('✅ User created:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error creating user:', error);
            console.error('❌ Response data:', error.response?.data);
            console.error('❌ Response status:', error.response?.status);
            throw error;
        }
    },

    // Update user
    update: async (id, data) => {
        try {
            console.log('📤 Updating user with data:', data);
            const response = await api.put(`/users/${id}`, data);
            console.log('✅ User updated:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error updating user:', error);
            console.error('❌ Response data:', error.response?.data);
            console.error('❌ Response status:', error.response?.status);
            throw error;
        }
    },

    // Delete user
    delete: async (id) => {
        try {
            const response = await api.delete(`/users/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    },

    // Toggle user status
    toggleStatus: async (id) => {
        try {
            const response = await api.patch(`/users/${id}/toggle-status`);
            return response.data;
        } catch (error) {
            console.error('Error toggling user status:', error);
            throw error;
        }
    },

    // Reset password
    resetPassword: async (id) => {
        try {
            const response = await api.post(`/users/${id}/reset-password`);
            return response.data;
        } catch (error) {
            console.error('Error resetting password:', error);
            throw error;
        }
    },

    // Get all roles
    getRoles: async () => {
        try {
            const response = await api.get('/users/roles');
            return response.data;
        } catch (error) {
            console.error('Error fetching roles:', error);
            throw error;
        }
    }
};

export default userService;