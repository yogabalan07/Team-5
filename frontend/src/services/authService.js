// src/services/authService.js
import api from './api';

export const authService = {
  login: async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      console.log('Login API response:', response.data);
      
      if (response.data.token) {
        // ⭐ FIX: Handle both 'role' and 'roles' formats
        let roles = [];
        
        // Check for roles in different formats
        if (response.data.roles && Array.isArray(response.data.roles)) {
          roles = response.data.roles;
        } else if (response.data.role) {
          // If role is a string like "ADMIN" or "ROLE_ADMIN"
          const roleName = response.data.role.startsWith('ROLE_') ? response.data.role : `ROLE_${response.data.role}`;
          roles = [{ name: roleName }];
        } else if (response.data.authorities && Array.isArray(response.data.authorities)) {
          roles = response.data.authorities;
        }
        
        // Also check JWT token for roles
        if (response.data.token) {
          try {
            const payload = JSON.parse(atob(response.data.token.split('.')[1]));
            if (payload.roles && Array.isArray(payload.roles)) {
              roles = payload.roles.map(r => ({ name: r.authority || r }));
            }
          } catch (e) {
            console.log('Could not parse JWT token');
          }
        }
        
        const userData = {
          ...response.data,
          roles: roles
        };
        
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
      }
      return response.data;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        
        // ⭐ FIX: Ensure roles is properly set
        if (!user.roles || user.roles.length === 0) {
          // Check for role field
          if (user.role) {
            const roleName = user.role.startsWith('ROLE_') ? user.role : `ROLE_${user.role}`;
            user.roles = [{ name: roleName }];
          } else if (user.authorities) {
            user.roles = user.authorities;
          } else {
            user.roles = [];
          }
        }
        
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  register: async (username, password) => {
    try {
      const response = await api.post('/auth/register', { username, password });
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  resetPassword: async () => {
    try {
      const response = await api.post('/auth/reset-password');
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  checkUser: async () => {
    try {
      const response = await api.get('/auth/check-user');
      return response.data;
    } catch (error) {
      console.error('Check user error:', error);
      throw error;
    }
  },

  // Check if user has a specific role
  hasRole: (roleName) => {
    const user = authService.getCurrentUser();
    if (!user) return false;
    const roles = user.roles || user.authorities || [];
    return roles.some(role => {
      const roleValue = typeof role === 'string' ? role : role.name || role.authority || role;
      return roleValue === roleName || roleValue === roleName.replace('ROLE_', '');
    });
  },

  // Check if user is admin
  isAdmin: () => {
    return authService.hasRole('ROLE_ADMIN') || authService.hasRole('ADMIN');
  },

  // Check if user has any of the given roles
  hasAnyRole: (roleNames) => {
    const user = authService.getCurrentUser();
    if (!user) return false;
    const roles = user.roles || user.authorities || [];
    return roleNames.some(roleName => 
      roles.some(role => {
        const roleValue = typeof role === 'string' ? role : role.name || role.authority || role;
        return roleValue === roleName || roleValue === roleName.replace('ROLE_', '');
      })
    );
  }
};

export default authService;