"use strict";

// Privileged operations for the inventory management system.
// User/profile writes never happen from the client SDK directly — everything
// goes through these callables so role assignment and account lifecycle stay
// secure and auditable.

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

const ROLES = {
  ADMIN: 'ADMIN',
  BILLING_CLERK: 'BILLING_CLERK',
  ACCOUNTS: 'ACCOUNTS',
  PURCHASE_MANAGER: 'PURCHASE_MANAGER',
  STORE_MANAGER: 'STORE_MANAGER',
  STAFF: 'STAFF',
};

const VALID_ROLES = Object.values(ROLES);

function apiError(message, code) {
  const err = new Error(message);
  err.code = code || 'internal';
  return err;
}

function caller(context, { adminOnly = false, bootstrap = false } = {}) {
  const uid = context.auth && context.auth.uid;
  if (!uid) {
    throw apiError('Authentication required', 'unauthenticated');
  }
  if (bootstrap) return { uid };
  if (adminOnly && context.auth.token && context.auth.token.role !== ROLES.ADMIN) {
    throw apiError('Admin privileges required', 'permission-denied');
  }
  return { uid };
}

async function usernameTaken(username) {
  const safe = String(username || '').trim().toLowerCase();
  if (!safe) return false;
  const snap = await db.collection('users').where('usernameLower', '==', safe).limit(1).get();
  return !snap.empty;
}

async function hasAnyAdmin() {
  const snap = await db.collection('users').where('role', '==', ROLES.ADMIN).limit(1).get();
  return !snap.empty;
}

async function setClaims(uid, { role, disabled }) {
  const authUser = await admin.auth().getUser(uid);
  await admin.auth().setCustomUserClaims(uid, {
    role: role || authUser.customClaims && authUser.customClaims.role,
    disabled: disabled === true,
  });
}

async function writeProfile(uid, profile) {
  await db.collection('users').doc(uid).set({
    uid,
    username: profile.username || '',
    usernameLower: String(profile.username || '').trim().toLowerCase(),
    email: String(profile.email || '').toLowerCase(),
    fullName: profile.fullName || '',
    phone: profile.phone || '',
    role: profile.role || ROLES.STAFF,
    isActive: profile.isActive !== false,
    createdAt: profile.createdAt || admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function requireAdminUid(uid) {
  const profile = await db.collection('users').doc(uid).get();
  const role = (profile.exists && profile.data().role) || null;
  if (role !== ROLES.ADMIN) {
    throw apiError('Admin privileges required', 'permission-denied');
  }
  return role;
}

// ---------------------------------------------------------------------------
// Self-registration. Always creates a STAFF-level account; admins are never
// granted at registration time.
// ---------------------------------------------------------------------------
exports.registerUser = functions.https.onCall(async (data, context) => {
  const { uid } = caller(context);
  const username = String(data.username || '').trim();
  const email = String(data.email || '').trim().toLowerCase();
  if (!username || !email) throw apiError('Username and email are required', 'invalid-argument');
  if (await usernameTaken(username)) throw apiError(`Username "${username}" is already taken`, 'already-exists');

  await writeProfile(uid, {
    username,
    email: data.email,
    fullName: data.fullName || '',
    phone: data.phone || '',
    role: ROLES.STAFF,
    isActive: true,
  });
  await setClaims(uid, { role: ROLES.STAFF, disabled: false });
  return { uid, role: ROLES.STAFF };
});

// ---------------------------------------------------------------------------
// First-admin bootstrap. Only callable while NO admin exists in the system.
// ---------------------------------------------------------------------------
exports.bootstrapAdmin = functions.https.onCall(async (data, context) => {
  caller(context, { bootstrap: true });
  if (await hasAnyAdmin()) {
    throw apiError('An admin already exists. Use the users module instead.', 'permission-denied');
  }

  const username = String(data.username || '').trim();
  const email = String(data.email || '').trim();
  const password = String(data.password || '');
  if (!email || !username || password.length < 6) {
    throw apiError('A valid email, username and password (6+ chars) are required', 'invalid-argument');
  }

  const created = await admin.auth().createUser({ email, password, displayName: data.fullName || username });
  await writeProfile(created.uid, {
    username,
    email,
    fullName: data.fullName || '',
    phone: data.phone || '',
    role: ROLES.ADMIN,
    isActive: true,
  });
  await setClaims(created.uid, { role: ROLES.ADMIN, disabled: false });
  return { uid: created.uid, role: ROLES.ADMIN };
});

// ---------------------------------------------------------------------------
// Role management (ADMIN only)
// ---------------------------------------------------------------------------
exports.setUserRole = functions.https.onCall(async (data, context) => {
  caller(context, { adminOnly: true });
  const role = String(data.role || '');
  if (!VALID_ROLES.includes(role)) throw apiError(`Invalid role: ${role}`, 'invalid-argument');
  const userId = String(data.userId || '');
  if (!userId) throw apiError('userId is required', 'invalid-argument');
  await setClaims(userId, { role });
  await db.collection('users').doc(userId).update({ role, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  return { userId, role };
});

// ---------------------------------------------------------------------------
// Admin user lifecycle (ADMIN only)
// ---------------------------------------------------------------------------
exports.adminCreateUser = functions.https.onCall(async (data, context) => {
  caller(context, { adminOnly: true });
  const username = String(data.username || '').trim();
  const email = String(data.email || '').trim().toLowerCase();
  const password = String(data.password || '');
  const role = String(data.role || ROLES.STAFF);
  if (!email || username.length < 3 || password.length < 6) {
    throw apiError('A valid username, email and password (6+ chars) are required', 'invalid-argument');
  }
  if (!VALID_ROLES.includes(role)) throw apiError(`Invalid role: ${role}`, 'invalid-argument');
  if (await usernameTaken(username)) throw apiError(`Username "${username}" is already taken`, 'already-exists');

  const created = await admin.auth().createUser({ email, password, displayName: data.fullName || username });
  await writeProfile(created.uid, {
    username,
    email,
    fullName: data.fullName || '',
    phone: data.phone || '',
    role,
    isActive: data.isActive !== false,
  });
  await setClaims(created.uid, { role, disabled: data.isActive === false });
  return { uid: created.uid, role };
});

exports.adminUpdateUser = functions.https.onCall(async (data, context) => {
  caller(context, { adminOnly: true });
  const userId = String(data.userId || '');
  if (!userId) throw apiError('userId is required', 'invalid-argument');

  const ref = db.collection('users').doc(userId);
  const doc = await ref.get();
  if (!doc.exists) throw apiError('User not found', 'not-found');

  const update = {};
  if (data.username && data.username !== doc.data().username) {
    const requested = String(data.username).trim();
    const taken = await db.collection('users').where('usernameLower', '==', requested.toLowerCase()).limit(1).get();
    if (!taken.empty && taken.docs[0].id !== userId) {
      throw apiError(`Username "${requested}" is already taken`, 'already-exists');
    }
    update.username = requested;
    update.usernameLower = requested.toLowerCase();
  }
  if (data.fullName !== undefined) update.fullName = data.fullName;
  if (data.phone !== undefined) update.phone = data.phone;
  if (data.email !== undefined) update.email = String(data.email).trim().toLowerCase();
  if (data.isActive !== undefined) update.isActive = Boolean(data.isActive);
  const roleChanged = data.role && VALID_ROLES.includes(data.role) && data.role !== doc.data().role;
  if (roleChanged) update.role = data.role;
  update.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  await ref.update(update);
  if (roleChanged || data.isActive !== undefined) {
    await setClaims(userId, {
      role: roleChanged ? data.role : doc.data().role,
      disabled: data.isActive !== undefined ? data.isActive === false : doc.data().isActive === false,
    });
  }
  return { userId };
});

exports.adminDeleteUser = functions.https.onCall(async (data, context) => {
  const { uid } = caller(context, { adminOnly: true });
  const userId = String(data.userId || '');
  if (!userId) throw apiError('userId is required', 'invalid-argument');
  if (userId === uid) throw apiError('You cannot delete your own account', 'invalid-argument');

  const doc = await db.collection('users').doc(userId).get();
  if (doc.exists && doc.data().role === ROLES.ADMIN) {
    const adminCount = await db.collection('users').where('role', '==', ROLES.ADMIN).get();
    if (adminCount.size <= 1) throw apiError('Cannot delete the last admin account', 'invalid-argument');
  }

  await admin.auth().deleteUser(userId).catch((e) => {
    if (!e.message.includes('no user record')) throw e;
  });
  await db.collection('users').doc(userId).delete();
  return { userId, deleted: true };
});

exports.adminResetPassword = functions.https.onCall(async (data, context) => {
  caller(context, { adminOnly: true });
  const userId = String(data.userId || '');
  const newPassword = String(data.newPassword || 'password123');
  if (newPassword.length < 6) throw apiError('Password must be at least 6 characters', 'invalid-argument');
  await admin.auth().updateUser(userId, { password: newPassword });
  return { userId, reset: true };
});

exports.toggleUserStatus = functions.https.onCall(async (data, context) => {
  const { uid } = caller(context, { adminOnly: true });
  const userId = String(data.userId || '');
  if (!userId) throw apiError('userId is required', 'invalid-argument');
  if (userId === uid) throw apiError('You cannot deactivate your own account', 'invalid-argument');

  const ref = db.collection('users').doc(userId);
  const doc = await ref.get();
  if (!doc.exists) throw apiError('User not found', 'not-found');

  const next = data.isActive === undefined ? doc.data().isActive === false : Boolean(data.isActive);
  if (!next && doc.data().role === ROLES.ADMIN) {
    const adminCount = await db.collection('users').where('role', '==', ROLES.ADMIN).get();
    if (adminCount.size <= 1) throw apiError('Cannot deactivate the last admin account', 'invalid-argument');
  }

  await ref.update({ isActive: next, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  await setClaims(userId, { role: doc.data().role, disabled: !next });
  return { userId, isActive: next };
});

// Keep the admin requirement server-side as well: a stale custom claim should
// never let a revoked admin keep managing users.
exports.requireAdminUid = functions.https.onCall(async (data, context) => {
  const { uid } = caller(context);
  await requireAdminUid(uid);
  return { ok: true };
});