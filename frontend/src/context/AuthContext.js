// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('AuthProvider - Token found:', !!token);
    if (token) {
      const userData = authService.getCurrentUser();
      if (userData) {
        console.log('AuthProvider - Raw userData:', userData);
        
        // ⭐ FIX: Handle both 'role' and 'roles' formats
        let roles = [];
        
        // Check for roles in different formats
        if (userData.roles && Array.isArray(userData.roles)) {
          roles = userData.roles;
        } else if (userData.role) {
          // If role is a string like "ADMIN" or "ROLE_ADMIN"
          const roleName = userData.role.startsWith('ROLE_') ? userData.role : `ROLE_${userData.role}`;
          roles = [{ name: roleName }];
        } else if (userData.authorities && Array.isArray(userData.authorities)) {
          roles = userData.authorities;
        }
        
        // Also check JWT token for roles if available
        if (userData.token) {
          try {
            const payload = JSON.parse(atob(userData.token.split('.')[1]));
            if (payload.roles && Array.isArray(payload.roles)) {
              roles = payload.roles.map(r => ({ name: r.authority || r }));
            }
          } catch (e) {
            console.log('Could not parse JWT token');
          }
        }
        
        const userWithRoles = {
          ...userData,
          roles: roles
        };
        
        console.log('AuthProvider - Processed user:', userWithRoles);
        console.log('AuthProvider - Roles:', userWithRoles.roles);
        
        setUser(userWithRoles);
        setIsAuthenticated(true);
      } else {
        console.warn('AuthProvider - No user data, logging out');
        authService.logout();
      }
    } else {
      console.warn('AuthProvider - No token found');
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      console.log('Attempting login for:', username);
      const data = await authService.login(username, password);
      console.log('Login response:', data);
      
      if (data.token) {
        // ⭐ FIX: Handle both 'role' and 'roles' formats
        let roles = [];
        
        // Check for roles in different formats
        if (data.roles && Array.isArray(data.roles)) {
          roles = data.roles;
        } else if (data.role) {
          // If role is a string like "ADMIN" or "ROLE_ADMIN"
          const roleName = data.role.startsWith('ROLE_') ? data.role : `ROLE_${data.role}`;
          roles = [{ name: roleName }];
        } else if (data.authorities && Array.isArray(data.authorities)) {
          roles = data.authorities;
        }
        
        // Also check JWT token for roles
        if (data.token) {
          try {
            const payload = JSON.parse(atob(data.token.split('.')[1]));
            if (payload.roles && Array.isArray(payload.roles)) {
              roles = payload.roles.map(r => ({ name: r.authority || r }));
            }
          } catch (e) {
            console.log('Could not parse JWT token');
          }
        }
        
        const userData = {
          ...data,
          roles: roles
        };
        
        console.log('Login - Processed user data:', userData);
        console.log('Login - Roles:', userData.roles);
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
        toast.success('Login successful!');
        return { success: true, user: userData };
      } else {
        throw new Error('No token received');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Login failed';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    toast.info('Logged out successfully');
  };

  // Helper function to check if user has a specific role
  const hasRole = (roleName) => {
    if (!user) {
      console.warn('hasRole - No user found');
      return false;
    }
    const roles = user.roles || [];
    console.log('hasRole - Checking for', roleName, 'in', roles);
    const hasRole = roles.some(role => {
      const roleNameValue = typeof role === 'string' ? role : role.name || role.authority || role;
      return roleNameValue === roleName || roleNameValue === roleName.replace('ROLE_', '');
    });
    console.log('hasRole - Result:', hasRole);
    return hasRole;
  };

  // Helper function to check if user is admin
  const isAdmin = () => {
    // Check both ROLE_ADMIN and ADMIN
    const result = hasRole('ROLE_ADMIN') || hasRole('ADMIN');
    console.log('isAdmin - Result:', result);
    return result;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated,
        loading,
        hasRole,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};