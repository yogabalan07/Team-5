// src/services/authService.js
//
// Firebase Authentication replaces the legacy JWT/localStorage auth.
// - Sign in / sign out / password reset go through Firebase Auth.
// - Role and account status live ONLY in the user's profile document
//   (users/{uid}.role / users/{uid}.isActive), which Firestore security rules
//   treat as the source of truth. No Cloud Functions, no custom claims.
// - self-registration creates the profile client-side; the very first account
//   to register on a fresh system becomes the ADMIN (atomic bootstrap).
// - localStorage['user'] / localStorage['token'] are kept as a lightweight
//   synchronous cache so existing components that read them keep working.

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  getIdToken,
  onAuthStateChanged,
} from '@firebase/auth';
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  limit,
  runTransaction,
  serverTimestamp,
} from '@firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { isFirebaseConfigured, firebaseSetupMessage } from '../firebase/config';
import { ROLES, DEFAULT_SELF_REGISTERED_ROLE, buildSearchText } from './businessLogic';

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

// Login. Accepts an email address. Returns shaped user data. Role and status
// come from the Firestore profile (not auth claims).
export async function login(email, password) {
  if (!isConfigured()) throw serviceErrorFor(firebaseSetupMessage(), 500);
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  let profile = null;
  try {
    profile = await loadProfile(firebaseUser.uid);
  } catch (e) {
    // Profile may be briefly unavailable right after bootstrap; fall back.
    profile = null;
  }

  if (profile && profile.isActive === false) {
    try { await signOut(auth); } catch (e) { /* ignore */ }
    const err = new Error('Your account is inactive. Contact an administrator.');
    err.code = 'auth/user-disabled';
    err.response = { status: 403, data: { error: err.message, message: err.message, status: 403 } };
    throw err;
  }

  const role = (profile && profile.role) || DEFAULT_SELF_REGISTERED_ROLE;
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

// Register a new self-service account.
//
// The FIRST account ever registered on a fresh system becomes the system
// ADMIN (atomic bootstrap). Every later registration is forced to the
// default STAFF role; an admin promotes people afterwards.
//
// This runs as a single Firestore transaction so two concurrent first
// registrations cannot both win the role: the winner secures bootstrap/lock
// (server-side serialized) and creates the matching ADMIN profile; the loser
// is created as STAFF.
export async function register({ username, email, password, fullName = '', phone = '' }) {
  if (!isConfigured()) throw serviceErrorFor(firebaseSetupMessage(), 500);

  const trimmedUsername = String(username || '').trim();
  const emailLower = String(email || '').trim().toLowerCase();
  if (!trimmedUsername || !emailLower) throw serviceErrorFor('Username and email are required', 400);

  const existing = await getDocs(query(collection(db, 'users'), where('usernameLower', '==', trimmedUsername.toLowerCase()), limit(1)));
  if (!existing.empty) throw serviceErrorFor(`Username "${trimmedUsername}" is already taken`, 400);

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  let role = DEFAULT_SELF_REGISTERED_ROLE;
  try {
    await runTransaction(db, async (transaction) => {
      const lockRef = doc(db, 'bootstrap', 'lock');
      const profileRef = doc(db, 'users', firebaseUser.uid);
      const lockSnap = await transaction.get(lockRef);
      const firstAdmin = !lockSnap.exists();
      if (firstAdmin) {
        transaction.set(lockRef, {
          adminUid: firebaseUser.uid,
          username: trimmedUsername,
          email: emailLower,
          createdAt: serverTimestamp(),
        });
        role = ROLES.ADMIN;
      }
      transaction.set(profileRef, {
        uid: firebaseUser.uid,
        username: trimmedUsername,
        usernameLower: trimmedUsername.toLowerCase(),
        email: emailLower,
        fullName: String(fullName || ''),
        phone: String(phone || ''),
        role,
        isActive: true,
        searchText: buildSearchText(trimmedUsername, fullName, emailLower),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  } catch (e) {
    // The auth user was created, but profile creation failed; delete the auth
    // user so the user can retry registration cleanly.
    try {
      await firebaseUser.delete();
    } catch (cleanupErr) {
      // ignore cleanup failure
    }
    throw wrapFirestoreError(e, 'Registration could not be completed. Please try again.');
  }

  return { success: true, uid: firebaseUser.uid, email: firebaseUser.email, role };
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

function wrapFirestoreError(e, fallback) {
  const message = (e && e.message) || fallback;
  const code = (e && e.code) || '';
  const isPermission = code === 'permission-denied' || code === 'PERMISSION_DENIED';
  const isUnavailable = code === 'unavailable' || code === 'aborted' || code === 'resource-exhausted';
  const status = isPermission ? 403 : isUnavailable ? 503 : 400;
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
};

export default authService;