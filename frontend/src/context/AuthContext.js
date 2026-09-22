// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';
import { isFirebaseConfigured } from '../firebase/config';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let unsub;
    let cancelled = false;

    const finish = (userData) => {
      if (cancelled) return;
      setUser(userData);
      setIsAuthenticated(Boolean(userData));
      setLoading(false);
    };

    if (!isFirebaseConfigured()) {
      // Not configured yet (dev / pre-deploy). Fall back to the cached user so
      // the UI still boots; every authenticated call will show a setup message.
      const cached = authService.getCurrentUser();
      finish(cached);
      return () => { cancelled = true; };
    }

    unsub = authService.onAuthChange(async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          authService.logout();
          finish(null);
          return;
        }
        let profile = null;
        try {
          profile = await authService.loadProfile(firebaseUser.uid);
        } catch (e) {
          // profile may lag right after first sign-in
        }
        if (cancelled) return;
        const userData = authService.buildUserObject({
          uid: firebaseUser.uid,
          username: (profile && profile.username) || firebaseUser.email || '',
          email: firebaseUser.email || '',
          fullName: (profile && profile.fullName) || '',
          phone: (profile && profile.phone) || '',
          role: (profile && profile.role) || undefined,
          isActive: profile ? profile.isActive !== false : true,
          token: '',
        });
        userData.roles = [{ name: userData.role }];
        storagePersistUser(userData);
        finish(userData);
      } catch (err) {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      let roles = [];
      if (data.roles && Array.isArray(data.roles)) {
        roles = data.roles;
      } else if (data.role) {
        const roleName = data.role.startsWith('ROLE_') ? data.role : `ROLE_${data.role}`;
        roles = [{ name: roleName }];
      }
      const userData = { ...data, roles };
      setUser(userData);
      setIsAuthenticated(true);
      toast.success('Login successful!');
      return { success: true, user: userData };
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Login failed. Check your email and password.';
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

  const hasRole = (roleName) => {
    if (!user) return false;
    const roles = user.roles || [];
    return roles.some((role) => {
      const roleNameValue = typeof role === 'string' ? role : role.name || role.authority || role;
      return roleNameValue === roleName || roleNameValue === roleName.replace('ROLE_', '');
    });
  };

  const isAdmin = () => {
    return hasRole('ROLE_ADMIN') || hasRole('ADMIN');
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

function storagePersistUser(userData) {
  try {
    localStorage.setItem('user', JSON.stringify(userData));
  } catch (e) {
    // ignore storage failures
  }
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};