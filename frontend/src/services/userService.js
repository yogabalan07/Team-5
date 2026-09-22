// src/services/userService.js
// User management on the Spark plan (no Cloud Functions, no Admin SDK).
//
// Reads come straight from the users collection. Admin mutations are direct
// Firestore writes that the security rules restrict to ADMIN accounts.
//
// Spark limitations (enforced by the rules + client guards):
//   - Accounts cannot be DELETED (deleting an auth identity needs the Admin
//     SDK). Deactivate (isActive=false) instead — the rules then block the
//     whole system for that user.
//   - Accounts cannot be CREATED by an admin (creating an auth identity needs
//     the Admin SDK). Users self-register (STAFF) and an admin promotes them.
//   - Passwords cannot be set by an admin (needs the Admin SDK). The admin can
//     trigger the Firebase "reset password" email instead.

import { getDocs } from '@firebase/firestore';
import { sendPasswordResetEmail } from '@firebase/auth';
import {
  col,
  docOf,
  getByIdOr404,
  getPaged,
  serviceError,
  requireAuth,
  currentUserId,
  updateDoc,
  serverTimestamp,
} from './firestoreHelpers';
import { auth } from '../firebase/firebase';
import { nowISO, ROLES, buildSearchText } from './businessLogic';

const USERS = 'users';
const VALID_ROLES = Object.values(ROLES);

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

// Number of ADMIN profiles that are NOT the given user (optionally only
// active ones). Used client-side to keep the system from losing its last
// admin; the security rules additionally forbid an admin from demoting or
// deactivating themselves.
async function otherAdminCount(excludeUid, onlyActive = false) {
  const snap = await getDocs(col(USERS));
  let count = 0;
  snap.forEach((d) => {
    const data = d.data();
    if (data.role === 'ADMIN' && d.id !== excludeUid) {
      if (!onlyActive || data.isActive !== false) count += 1;
    }
  });
  return count;
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

  // Admin "create user" is not possible on Spark (creating a Firebase Auth
  // identity requires the Admin SDK). Users self-register as STAFF; an admin
  // then promotes them via `update`.
  async create() {
    requireAuth();
    throw serviceError(
      'New accounts cannot be created from here on the free plan. Have the user register from the Register page (STAFF), then promote their role here.'
    );
  },

  async update(id, userData) {
    requireAuth();
    const target = await getByIdOr404(col(USERS), id);
    const targetProfile = asProfile(target);
    const nextRole = (rolesFromIds(userData.roleIds) || userData.role || targetProfile.role || ROLES.STAFF)
      .replace(/^ROLE_/, '');
    if (!VALID_ROLES.includes(nextRole)) {
      throw serviceError(`Invalid role: ${nextRole}`);
    }
    const nextActive = userData.isActive === undefined ? targetProfile.isActive : Boolean(userData.isActive);

    // Self-service guards (mirror the legacy functions). The rules also block
    // self-demotion and self-deactivation anyway.
    if (id === currentUserId()) {
      if (nextRole !== ROLES.ADMIN) {
        throw serviceError('You cannot remove your own ADMIN role.');
      }
      if (!nextActive) {
        throw serviceError('You cannot deactivate your own account.');
      }
    } else if (targetProfile.role === ROLES.ADMIN && (nextRole !== ROLES.ADMIN || !nextActive)) {
      if (otherAdminCount(id) <= 0) {
        throw serviceError('Cannot remove the last active admin account.');
      }
    }

    const username = userData.username !== undefined && userData.username !== null
      ? String(userData.username).trim()
      : targetProfile.username;
    if (String(username || '').length < 3) {
      throw serviceError('Username must be at least 3 characters');
    }
    const fullName = userData.fullName !== undefined ? userData.fullName : targetProfile.fullName || '';
    const phone = userData.phone !== undefined ? userData.phone : targetProfile.phone || '';
    const email = userData.email !== undefined ? String(userData.email).trim().toLowerCase() : targetProfile.email || '';

    const payload = {
      username,
      usernameLower: username.toLowerCase(),
      fullName,
      phone,
      email,
      role: nextRole,
      isActive: nextActive,
      searchText: buildSearchText(username, fullName, email),
      updatedAt: serverTimestamp(),
    };

    await updateDoc(docOf(USERS, id), payload);
    return { id, ...payload, roles: [{ id: nextRole, name: `ROLE_${nextRole}` }] };
  },

  // Accounts cannot be DELETED on Spark (deleting the auth identity needs the
  // Admin SDK). Deactivate instead.
  async delete() {
    requireAuth();
    throw serviceError('Accounts cannot be deleted on the free plan. Use Deactivate instead.');
  },

  // Admins can't set another user's password on Spark (needs the Admin SDK).
  // Trigger the Firebase "reset password" email; the user picks the new
  // password from the link Firebase sends.
  async resetPassword(id) {
    requireAuth();
    const target = await getByIdOr404(col(USERS), id);
    const email = (target && target.email) || '';
    if (!email) {
      throw serviceError('This user has no email address; password reset could not be sent.');
    }
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e) {
      throw serviceError('Could not send password reset email. Firebase only sends these for registered auth accounts.');
    }
    return { id, reset: true, email, message: `Password reset email sent to ${email}` };
  },

  async toggleStatus(id, isActive) {
    requireAuth();
    const target = await getByIdOr404(col(USERS), id);
    const targetProfile = asProfile(target);
    const next = isActive === undefined ? targetProfile.isActive === false : Boolean(isActive);

    if (id === currentUserId()) {
      throw serviceError('You cannot deactivate your own account.');
    }
    if (!next && targetProfile.role === ROLES.ADMIN && otherAdminCount(id, true) <= 0) {
      throw serviceError('Cannot deactivate the last active admin account.');
    }

    await updateDoc(docOf(USERS, id), { isActive: next, updatedAt: serverTimestamp() });
    return { id, isActive: next };
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