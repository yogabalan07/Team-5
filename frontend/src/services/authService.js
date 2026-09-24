// src/services/authService.js
//
// Firebase Authentication replaces the legacy JWT/localStorage auth.
// - Sign in / sign out / password reset go through Firebase Auth.
// - Role and account status live ONLY in the user's profile document
//   (users/{uid}.role / users/{uid}.isActive), which Firestore security rules
//   treat as the source of truth. No Cloud Functions, no custom claims.
// - self-registration creates the profile client-side; the very first account
//   to register on a fresh system claims bootstrap/lock and becomes ADMIN
//   (two-commit bootstrap — see register() below for why it cannot be one
//   transaction). Orphaned auth accounts (no profile doc) are repaired by
//   ensureProfile() on login/boot so their reads are not denied by rules.
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
  runTransaction,
  serverTimestamp,
  setDoc,
  deleteDoc,
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
    // The profile read is only denied when the profile document is missing
    // (interrupted registration) or exists but is blocked (isActive != true).
    // ensureProfile repairs the former and reports the latter.
    try {
      profile = await ensureProfile(firebaseUser);
    } catch (ensureErr) {
      if (ensureErr && ensureErr.code === 'auth/user-disabled') {
        try { await signOut(auth); } catch (e2) { /* ignore */ }
      }
      throw ensureErr;
    }
  }

  if (profile && profile.isActive === false) {
    try { await signOut(auth); } catch (e) { /* ignore */ }
    throw disabledError();
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
// ADMIN (bootstrap lock claim). Every later registration is forced to the
// default STAFF role; an admin promotes people afterwards.
//
// IMPORTANT — why this runs in two commits:
// Firestore security rules evaluate get()/exists() against COMMITTED state
// only; they cannot see a bootstrap/lock write made inside the SAME
// transaction. A single transaction that wrote the lock and an ADMIN profile
// together was therefore always rejected by the users create rule (which
// get()s the lock), leaving an auth user with no profile — the exact
// production failure. So:
//   commit 1 (transaction): reserve usernames/{lower} + claim bootstrap/lock
//   commit 2:               create users/{uid} with the role the committed
//                           lock entitles us to (ADMIN for the claimant,
//                           STAFF for everyone else).
// Any partial failure is rolled back (lock/reservation released, auth user
// removed) so no orphaned state is left behind; ensureProfile() additionally
// repairs orphans if a rollback itself fails.
export async function register({ username, email, password, fullName = '', phone = '' }) {
  if (!isConfigured()) throw serviceErrorFor(firebaseSetupMessage(), 500);

  const trimmedUsername = String(username || '').trim();
  const emailLower = String(email || '').trim().toLowerCase();
  if (!trimmedUsername || !emailLower) throw serviceErrorFor('Username and email are required', 400);
  if (trimmedUsername.length < 3) throw serviceErrorFor('Username must be at least 3 characters', 400);

  const usernameLower = trimmedUsername.toLowerCase();
  registerInFlight = true;
  let firebaseUser = null;
  let role = DEFAULT_SELF_REGISTERED_ROLE;
  let claimedLock = false;
  let reservedName = false;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    firebaseUser = userCredential.user;

    const lockRef = doc(db, 'bootstrap', 'lock');
    const nameRef = doc(db, 'usernames', usernameLower);
    const profileRef = doc(db, 'users', firebaseUser.uid);

    // Commit 1: username reservation + first-admin lock claim.
    await runTransaction(db, async (transaction) => {
      claimedLock = false;
      reservedName = false;
      role = DEFAULT_SELF_REGISTERED_ROLE;
      const lockSnap = await transaction.get(lockRef);
      const nameSnap = await transaction.get(nameRef);
      if (nameSnap.exists() && nameSnap.data().uid !== firebaseUser.uid) {
        throw serviceErrorFor(`Username "${trimmedUsername}" is already taken`, 400);
      }
      if (!lockSnap.exists()) {
        transaction.set(lockRef, {
          adminUid: firebaseUser.uid,
          username: trimmedUsername,
          email: emailLower,
          createdAt: serverTimestamp(),
        });
        claimedLock = true;
        role = ROLES.ADMIN;
      } else {
        role = lockSnap.data().adminUid === firebaseUser.uid
          ? ROLES.ADMIN
          : DEFAULT_SELF_REGISTERED_ROLE;
      }
      if (!nameSnap.exists()) {
        transaction.set(nameRef, {
          uid: firebaseUser.uid,
          username: trimmedUsername,
          usernameLower,
          createdAt: serverTimestamp(),
        });
        reservedName = true;
      } else {
        reservedName = true; // already ours from a previous attempt
      }
    });

    // Commit 2: the profile. The lock is committed now, so the ADMIN create
    // rule's get(bootstrap/lock) succeeds for the claimant; everyone else is
    // forced STAFF by the same rule.
    await setDoc(profileRef, {
      uid: firebaseUser.uid,
      username: trimmedUsername,
      usernameLower,
      email: emailLower,
      fullName: String(fullName || ''),
      phone: String(phone || ''),
      role,
      isActive: true,
      searchText: buildSearchText(trimmedUsername, fullName, emailLower),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    // Roll back partial state BEFORE removing the auth identity: the rules
    // only let the claimant release bootstrap/lock / a username reservation
    // while their profile does not exist.
    await rollbackPartialRegistration(firebaseUser && firebaseUser.uid, {
      releaseLock: claimedLock,
      releaseUsername: reservedName ? usernameLower : null,
    });
    if (firebaseUser) {
      try {
        await firebaseUser.delete();
      } catch (cleanupErr) {
        // ignore cleanup failure; ensureProfile() repairs the orphan on login
      }
    }
    throw wrapFirestoreError(e, 'Registration could not be completed. Please try again.');
  } finally {
    registerInFlight = false;
  }

  return { success: true, uid: firebaseUser.uid, email: firebaseUser.email, role };
}

// ---------------------------------------------------------------------------
// Self-heal / provisioning.
//
// Any signed-in auth user without a profile document is an orphan (an
// interrupted registration) — security rules correctly deny them every read
// because isEnabled() get()s users/{uid}. ensureProfile() completes the
// registration the rules already allow: claim the bootstrap lock if the
// system still has none (first orphan becomes ADMIN, exactly like first
// registration), then create the profile. Inactive users (profile exists,
// isActive=false) are never repaired — their profile create is denied and
// the denial is surfaced as auth/user-disabled.
// ---------------------------------------------------------------------------

let registerInFlight = false;
const provisioning = new Map();

export function ensureProfile(firebaseUser, hints = {}) {
  const uid = firebaseUser && firebaseUser.uid;
  if (!uid || !isConfigured()) return Promise.resolve(null);
  if (provisioning.has(uid)) return provisioning.get(uid);
  const task = doEnsureProfile(firebaseUser, hints).finally(() => provisioning.delete(uid));
  provisioning.set(uid, task);
  return task;
}

async function doEnsureProfile(firebaseUser, hints = {}) {
  const uid = firebaseUser.uid;
  const email = String(firebaseUser.email || '').toLowerCase();

  // If a registration is still writing the profile in this tab, wait for it
  // instead of racing it.
  if (registerInFlight) {
    for (let i = 0; i < 20; i += 1) {
      try {
        const midSnap = await getDoc(doc(db, 'users', uid));
        if (midSnap.exists()) return midSnap.data();
      } catch (e) {
        // still missing (denied)
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  // Existing readable profile?
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) return snap.data();
  } catch (e) {
    // denied: missing OR inactive — decided by the create attempt below
  }

  // Claim the bootstrap lock if this is still a virgin system. The rules
  // make this create-only and only for accounts without a profile, so a
  // blocked (inactive) account can never steal the claim.
  const lockRef = doc(db, 'bootstrap', 'lock');
  let lockSnap = await getDoc(lockRef);
  if (!lockSnap.exists()) {
    try {
      await setDoc(lockRef, {
        adminUid: uid,
        username: String(hints.username || email || '').trim(),
        email,
        createdAt: serverTimestamp(),
      });
      lockSnap = await getDoc(lockRef);
    } catch (e) {
      // Lost the race or blocked by rules — read the committed winner.
      lockSnap = await getDoc(lockRef).catch(() => null);
    }
  }
  const isLockHolder = Boolean(lockSnap && lockSnap.exists() && lockSnap.data().adminUid === uid);
  const role = isLockHolder ? ROLES.ADMIN : DEFAULT_SELF_REGISTERED_ROLE;

  // Choose a username not reserved by somebody else.
  const base = String(hints.username || (email.split('@')[0] || '') || 'user').trim() || 'user';
  let username = base;
  let usernameLower = base.toLowerCase();
  for (let i = 0; i < 6; i += 1) {
    const nameSnap = await getDoc(doc(db, 'usernames', usernameLower)).catch(() => null);
    if (!nameSnap || !nameSnap.exists() || nameSnap.data().uid === uid) break;
    username = `${base}${i + 2}`;
    usernameLower = username.toLowerCase();
  }

  const profileRef = doc(db, 'users', uid);
  try {
    await runTransaction(db, async (transaction) => {
      const nameRef = doc(db, 'usernames', usernameLower);
      const nameSnap = await transaction.get(nameRef);
      if (nameSnap.exists() && nameSnap.data().uid !== uid) {
        throw serviceErrorFor(`Username "${username}" is already taken`, 400);
      }
      if (!nameSnap.exists()) {
        transaction.set(nameRef, {
          uid,
          username,
          usernameLower,
          createdAt: serverTimestamp(),
        });
      }
      transaction.set(profileRef, {
        uid,
        username,
        usernameLower,
        email,
        fullName: String(hints.fullName || ''),
        phone: String(hints.phone || ''),
        role,
        isActive: true,
        searchText: buildSearchText(username, hints.fullName || '', email),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  } catch (e) {
    const code = (e && e.code) || '';
    if (code === 'SERVICE_400') throw e;
    if (code === 'permission-denied' || code === 'PERMISSION_DENIED') {
      // The profile document exists but is not readable => isActive != true.
      const stillDenied = await getDoc(doc(db, 'users', uid)).then(() => false, () => true);
      if (stillDenied) throw disabledError();
    }
    throw wrapFirestoreError(e, 'Could not finish setting up your account. Please try again.');
  }

  const finalSnap = await getDoc(doc(db, 'users', uid));
  return finalSnap.exists() ? finalSnap.data() : null;
}

async function rollbackPartialRegistration(uid, { releaseLock, releaseUsername }) {
  if (!uid) return;
  try {
    if (releaseLock) await deleteDoc(doc(db, 'bootstrap', 'lock'));
  } catch (e) {
    // best effort: another attempt may already hold it, or a profile exists
  }
  try {
    if (releaseUsername) {
      const nameSnap = await getDoc(doc(db, 'usernames', releaseUsername));
      if (nameSnap.exists() && nameSnap.data().uid === uid) {
        await deleteDoc(doc(db, 'usernames', releaseUsername));
      }
    }
  } catch (e) {
    // best effort; admins can clean a dangling reservation
  }
}

function disabledError() {
  const err = new Error('Your account is inactive. Contact an administrator.');
  err.code = 'auth/user-disabled';
  err.response = { status: 403, data: { error: err.message, message: err.message, status: 403 } };
  return err;
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
  ensureProfile,
};

export default authService;