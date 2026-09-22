// src/services/userService.js
// User management is privileged. All creates/updates/deletes go through admin
// Cloud Functions (never direct Firestore writes), which mirror the legacy
// admin-only endpoints. Profile reads come from the users collection.

import { getDocs } from '@firebase/firestore';
import { getFunctions, httpsCallable } from '@firebase/functions';
import {
  col,
  getByIdOr404,
  getPaged,
  serviceError,
  requireAuth,
} from './firestoreHelpers';
import { nowISO, ROLES } from './businessLogic';

const USERS = 'users';

function call(name) {
  const functions = getFunctions();
  return httpsCallable(functions, name);
}

function wrapError(e, fallback) {
  return serviceError((e && e.message) || fallback, 400);
}

function asProfile(docData) {
  const role = docData.role || ROLES.STAFF;
  const roleName = role.startsWith('ROLE_') ? role : `ROLE_${role}`;
  return {
    ...docData,
    id: docData.id,
    role,
    roles: [{ id: role, name: roleName }],
    isActive: docData.isActive !== false,
  };
}

function rolesFromIds(roleIds) {
  if (Array.isArray(roleIds) && roleIds.length > 0) {
    return String(roleIds[0]).replace(/^ROLE_/, '');
  }
  return ROLES.STAFF;
}

export const userService = {
  async getRoles() {
    return [
      { id: ROLES.ADMIN, name: 'ROLE_ADMIN' },
      { id: ROLES.BILLING_CLERK, name: 'ROLE_BILLING_CLERK' },
      { id: ROLES.ACCOUNTS, name: 'ROLE_ACCOUNTS' },
      { id: ROLES.PURCHASE_MANAGER, name: 'ROLE_PURCHASE_MANAGER' },
      { id: ROLES.STORE_MANAGER, name: 'ROLE_STORE_MANAGER' },
      { id: ROLES.STAFF, name: 'ROLE_STAFF' },
    ];
  },

  async getAllActive() {
    const snap = await getDocs(col(USERS));
    const map = {};
    snap.forEach((d) => {
      const data = { ...d.data(), id: d.id };
      map[data.username || data.email || d.id] = asProfile(data);
    });
    return map;
  },

  async getAll(page = 0, size = 20, search = '') {
    return getPaged(col(USERS), { page, size, search });
  },

  async getById(id) {
    const data = await getByIdOr404(col(USERS), id);
    return asProfile(data);
  },

  async create(userData) {
    requireAuth();
    try {
      const result = await call('adminCreateUser')({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        fullName: userData.fullName || '',
        phone: userData.phone || '',
        role: rolesFromIds(userData.roleIds) || userData.role || ROLES.STAFF,
        isActive: userData.isActive !== false,
      });
      return { id: (result.data && result.data.uid) || (result.data && result.data.id), ...userData };
    } catch (e) {
      throw wrapError(e, 'Could not create user');
    }
  },

  async update(id, userData) {
    requireAuth();
    try {
      const result = await call('adminUpdateUser')({
        userId: id,
        username: userData.username,
        fullName: userData.fullName,
        phone: userData.phone,
        role: rolesFromIds(userData.roleIds) || userData.role,
        isActive: userData.isActive,
      });
      return { ...result.data, id };
    } catch (e) {
      throw wrapError(e, 'Could not update user');
    }
  },

  async delete(id) {
    requireAuth();
    try {
      await call('adminDeleteUser')({ userId: id });
      return { id, deleted: true };
    } catch (e) {
      throw wrapError(e, 'Could not delete user');
    }
  },

  async resetPassword(id, newPassword) {
    requireAuth();
    try {
      await call('adminResetPassword')({ userId: id, newPassword: newPassword || 'password123' });
      return { id, reset: true };
    } catch (e) {
      throw wrapError(e, 'Could not reset password');
    }
  },

  async toggleStatus(id, isActive) {
    requireAuth();
    const next = isActive === undefined ? !(await this.getById(id)).isActive : Boolean(isActive);
    try {
      await call('toggleUserStatus')({ userId: id, isActive: next });
      return { id, isActive: next };
    } catch (e) {
      throw wrapError(e, 'Could not update user status');
    }
  },

  async getStats() {
    const snap = await getDocs(col(USERS));
    const users = [];
    snap.forEach((d) => users.push(d.data()));
    return {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.isActive !== false).length,
      admins: users.filter((u) => (u.role || '').toUpperCase() === 'ADMIN').length,
    };
  },

  async search(search, page = 0, size = 20) {
    return getPaged(col(USERS), { page, size, search });
  },

  async exportToExcel(filters = {}) {
    const { content } = await getPaged(col(USERS), { page: 0, size: 5000, search: filters.search || '' });
    const headers = ['username', 'email', 'fullName', 'phone', 'role', 'isActive', 'createdAt'];
    const csv = toCsv(content, headers);
    downloadCsv(csv, `users-${nowISO().slice(0, 10)}.csv`);
    return csv;
  },
};

function toCsv(items, keys) {
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    return /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
  };
  return [keys.join(','), ...items.map((item) => keys.map((k) => escape(item[k])).join(','))].join('\n');
}

function downloadCsv(csv, filename) {
  if (typeof window === 'undefined') return;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default userService;