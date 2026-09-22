// src/services/authService.js
//
// Firebase Authentication replaces the legacy JWT/localStorage auth.
// - Sign in / sign out / password reset go through Firebase Auth.
// - Role lives in the user's profile document AND in Firebase Auth custom
//   claims so Firestore security rules can enforce permissions.
// - localStorage['user'] / localStorage['token'] are kept as a lightweight
//   synchronous cache so existing components that read them keep working.

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  getIdToken,
  getIdTokenResult,
  onAuthStateChanged,
} from '@firebase/auth';
import { doc, getDoc } from '@firebase/firestore';
import { getFunctions, httpsCallable } from '@firebase/functions';
import { auth, db } from '../firebase/firebase';
import { isFirebaseConfigured, firebaseSetupMessage } from '../firebase/config';
import { ROLES } from './businessLogic';

const USER_KEY = 'user';
const TOKEN_KEY = 'token';

function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    // ignore storage failures
  }
}

function storageRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    // ignore storage failures
  }
}

export function isConfigured() {
  return isFirebaseConfigured();
}

export function normalizeRole(role) {
  if (!role) return null;
  const raw = String(role).trim();
  return raw.startsWith('ROLE_') ? raw : `ROLE_${raw}`;
}

export function normalizeRolesFromUser(userData) {
  let roles = [];
  if (userData.roles && Array.isArray(userData.roles)) {
    roles = userData.roles;
  } else if (userData.role) {
    roles = [{ name: normalizeRole(userData.role) }];
  }
  return roles;
}

export function buildUserObject(input) {
  const uid = input.uid || (input.userId) || null;
  const role = input.role || ROLES.STAFF;
  const roles = [{ name: normalizeRole(role) }];
  return {
    uid,
    id: uid,
    username: input.username || '',
    email: input.email || '',
    fullName: input.fullName || '',
    phone: input.phone || '',
    role: normalizeRole(role),
    roles,
    isActive: input.isActive === undefined ? true : input.isActive,
    token: input.token || storageGet(TOKEN_KEY) || '',
    createdAt: input.createdAt || null,
  };
}

function persistUser(userData) {
  storageSet(USER_KEY, JSON.stringify(userData));
  if (userData.token) storageSet(TOKEN_KEY, userData.token);
  return userData;
}

export async function loadProfile(uid) {
  if (!isConfigured() || !uid) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  const profile = snap.exists() ? snap.data() : null;
  return profile;
}

export async function refreshClaims() {
  if (!isConfigured() || !auth.currentUser) return null;
  const tokenResult = await getIdTokenResult(auth.currentUser, true);
  return tokenResult.claims;
}

// Login. Accepts an email address. Returns shaped user data.
export async function login(email, password) {
  if (!isConfigured()) throw serviceErrorFor(firebaseSetupMessage(), 500);
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  let role = ROLES.STAFF;
  let profile = null;
  let disabledClaim = false;
  try {
    const tokenResult = await getIdTokenResult(firebaseUser, true);
    if (tokenResult.claims && tokenResult.claims.role) {
      role = tokenResult.claims.role;
    }
    if (tokenResult.claims && tokenResult.claims.disabled === true) {
      disabledClaim = true;
    }
    profile = await loadProfile(firebaseUser.uid);
  } catch (e) {
    // Profile/claims may be briefly unavailable right after bootstrap; fall back.
    profile = null;
  }

  if (disabledClaim || (profile && profile.isActive === false)) {
    try { await signOut(auth); } catch (e) { /* ignore */ }
    const err = new Error('Your account is inactive. Contact an administrator.');
    err.code = 'auth/user-disabled';
    err.response = { status: 403, data: { error: err.message, message: err.message, status: 403 } };
    throw err;
  }

  const userData = buildUserObject({
    uid: firebaseUser.uid,
    username: (profile && profile.username) || firebaseUser.email || '',
    email: firebaseUser.email || '',
    fullName: (profile && profile.fullName) || '',
    phone: (profile && profile.phone) || '',
    role,
    isActive: profile ? profile.isActive !== false : true,
    token: await getIdToken(firebaseUser),
    createdAt: (profile && profile.createdAt) || null,
  });
  persistUser(userData);
  return userData;
}

// Register a new self-service account. The registered user automatically gets
// the default STAFF role (never ADMIN); an admin must promote them.
export async function register({ username, email, password, fullName = '', phone = '' }) {
  if (!isConfigured()) throw serviceErrorFor(firebaseSetupMessage(), 500);
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  try {
    const functions = getFunctions();
    const createProfile = httpsCallable(functions, 'registerUser');
    await createProfile({ username, fullName, phone, email });
  } catch (e) {
    // The auth user was created, but profile creation failed; delete the auth
    // user so the user can retry registration cleanly.
    try {
      await firebaseUser.delete();
    } catch (cleanupErr) {
      // ignore cleanup failure
    }
    throw wrapCallableError(e, 'Registration could not be completed. Please try again.');
  }

  return { success: true, uid: firebaseUser.uid, email: firebaseUser.email };
}

export function resetPassword(email) {
  if (!isConfigured()) throw serviceErrorFor(firebaseSetupMessage(), 500);
  if (!email) return Promise.reject(serviceErrorFor('Enter your email address to reset your password', 400));
  return sendPasswordResetEmail(auth, email);
}

export function logout() {
  callSignOut();
  storageRemove(USER_KEY);
  storageRemove(TOKEN_KEY);
}

function callSignOut() {
  if (isConfigured() && auth.currentUser) {
    signOut(auth).catch(() => {});
  }
}

export function getCurrentUser() {
  try {
    const raw = storageGet(USER_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    if (!user.uid && !user.id) return null;
    return normalizeRolesFromUser(user).length ? user : { ...user, roles: normalizeRolesFromUser(user) };
  } catch (e) {
    return null;
  }
}

export function getToken() {
  return storageGet(TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getCurrentUser());
}

export function checkUser() {
  const user = getCurrentUser();
  return Promise.resolve(user ? { username: user.username, email: user.email } : null);
}

// Check if user has a specific role (exact match or without ROLE_ prefix)
export function hasRole(roleName) {
  const user = getCurrentUser();
  if (!user) return false;
  const roles = user.roles || user.authorities || [];
  return roles.some((role) => {
    const roleValue = typeof role === 'string' ? role : role.name || role.authority || role;
    return roleValue === roleName || roleValue === roleName.replace('ROLE_', '');
  });
}

export function isAdmin() {
  return hasRole('ROLE_ADMIN') || hasRole('ADMIN');
}

export function hasAnyRole(roleNames) {
  const user = getCurrentUser();
  if (!user) return false;
  const roles = user.roles || user.authorities || [];
  return roleNames.some((roleName) =>
    roles.some((role) => {
      const roleValue = typeof role === 'string' ? role : role.name || role.authority || role;
      return roleValue === roleName || roleValue === roleName.replace('ROLE_', '');
    })
  );
}

export function onAuthChange(callback) {
  if (!isConfigured()) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function refreshUserProfile() {
  const current = getCurrentUser();
  if (!current || !current.uid) return null;
  const profile = await loadProfile(current.uid);
  if (!profile) return current;
  const userData = buildUserObject({
    ...current,
    username: profile.username || current.username,
    fullName: profile.fullName || current.fullName,
    phone: profile.phone || current.phone,
    email: profile.email || current.email,
    role: profile.role || (current.role && current.role.replace(/^ROLE_/, '')) || ROLES.STAFF,
    isActive: profile.isActive !== false,
  });
  persistUser(userData);
  return userData;
}

function serviceErrorFor(message, status = 400) {
  const err = new Error(message);
  err.code = `SERVICE_${status}`;
  err.response = { status, data: { error: message, message, status } };
  return err;
}

function wrapCallableError(e, fallback) {
  const message = (e && e.message) || fallback;
  const isPermission = (e && e.code === 'functions/permission-denied') || (e && e.details && e.details.status === 'PERMISSION_DENIED');
  const status = isPermission ? 403 : 400;
  return serviceErrorFor(message, status);
}

const authService = {
  login,
  logout,
  register,
  resetPassword,
  checkUser,
  getCurrentUser,
  getToken,
  isAuthenticated,
  hasRole,
  isAdmin,
  hasAnyRole,
  onAuthChange,
  refreshUserProfile,
  loadProfile,
  refreshClaims,
};

export default authService;