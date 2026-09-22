// src/services/firestoreHelpers.js
//
// Shared Firestore access layer used by every inventory service.
// Emulates the Spring REST contract (page shape + axios-like errors) so that
// the existing React components keep working with minimal changes.

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { getCurrentUser } from './authService';
import { db } from '../firebase/firebase';
import { firebaseSetupMessage } from '../firebase/config';
import {
  pageResponse,
  slicePage,
  sortByCreatedDesc,
  searchRange,
  todayKey,
  formatBusinessNumber,
  nowISO,
} from './businessLogic';

export const COLLECTIONS = {
  USERS: 'users',
  ROLES: 'roles',
  CUSTOMERS: 'customers',
  SUPPLIERS: 'suppliers',
  BRANDS: 'itemBrands',
  GROUPS: 'itemGroups',
  SECTIONS: 'itemSections',
  UNITS: 'units',
  TAXES: 'taxes',
  ITEMS: 'items',
  PURCHASE_ORDERS: 'purchaseOrders',
  PURCHASE_INVOICES: 'purchaseInvoices',
  SALES_INVOICES: 'salesInvoices',
  SALES_RETURNS: 'salesReturns',
  PURCHASE_RETURNS: 'purchaseReturns',
  BILL_RECEIPTS: 'billReceipts',
  BILL_PAYMENTS: 'billPayments',
  STOCK_TRANSACTIONS: 'stockTransactions',
  COUNTERS: 'counters',
};

// ---------------------------------------------------------------------------
// Errors (axios-compatible so component error handling keeps working)
// ---------------------------------------------------------------------------

export function getDb() {
  if (!db) throw serviceError(firebaseSetupMessage(), 500);
  return db;
}

export function col(name) {
  return collection(getDb(), name);
}

export function docOf(name, id) {
  return doc(getDb(), name, String(id));
}

export function serviceError(message, status = 400) {
  const err = new Error(message);
  err.code = `SERVICE_${status}`;
  err.response = { status, data: { error: message, message, status } };
  return err;
}

export function notFound(message = 'Resource not found') {
  return serviceError(message, 404);
}

export function forbidden(message = 'You do not have permission to perform this action') {
  return serviceError(message, 403);
}

export function unauthorized(message = 'Please login to continue') {
  return serviceError(message, 401);
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export function fromSnap(snap) {
  return snap.exists() ? { ...snap.data(), id: snap.id } : null;
}

export function fromQuery(snap) {
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export function currentUserId() {
  const user = getCurrentUser();
  if (!user) return null;
  return user.uid || user.id || null;
}

export function requireAuth() {
  const uid = currentUserId();
  if (!uid) throw unauthorized();
  return uid;
}

export function getRoleFromUser(user) {
  if (!user) return null;
  if (user.role) return user.role;
  if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
    const r = user.roles[0];
    const name = typeof r === 'string' ? r : r && (r.name || r.authority);
    if (name) return String(name).replace(/^ROLE_/, '');
  }
  return null;
}

// ---------------------------------------------------------------------------
// Generic listing / paging with search
// ---------------------------------------------------------------------------

// Fetches documents from a collection applying an optional prefix search on the
// "searchText" field or an order by. Returns { items, total }.
export async function fetchDocs(
  collectionRef,
  { search = '', orderByField = 'createdAt', direction = 'desc', fetchLimit = 2500 } = {}
) {
  const range = searchRange(search);
  let q;
  if (range) {
    q = query(
      collectionRef,
      where('searchText', '>=', range.start),
      where('searchText', '<=', range.end),
      limit(fetchLimit)
    );
  } else {
    q = query(collectionRef, orderBy(orderByField, direction), limit(fetchLimit));
  }
  const snap = await getDocs(q);
  const items = fromQuery(snap);
  if (range) {
    items.sort((a, b) => {
      const aT = a && a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bT = b && b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bT - aT;
    });
  }
  return { items, total: items.length };
}

export async function getPaged(collectionRef, { page = 0, size = 20, search = '', fetchLimit = 2500 } = {}) {
  const { items, total } = await fetchDocs(collectionRef, { search, fetchLimit });
  const content = slicePage(items, page, size);
  return pageResponse(content, page, size, total);
}

export async function getByIdOr404(collectionRef, id) {
  if (!id) throw notFound();
  const snap = await getDoc(doc(collectionRef, String(id)));
  const data = fromSnap(snap);
  if (!data) throw notFound();
  return data;
}

export async function getOneWhere(collectionRef, field, operator, value) {
  const snap = await getDocs(query(collectionRef, where(field, operator, value)));
  return fromQuery(snap);
}

// ---------------------------------------------------------------------------
// Atomically-issued business document numbers (INV-20240101-000001 etc.)
// The counter increment happens inside the same transaction that creates the
// document so numbers can never be duplicated even with concurrent users.
// ---------------------------------------------------------------------------

export async function issueBusinessNumber(databaseRef, prefix, dateString) {
  const db = databaseRef;
  const key = `${prefix}_${(dateString || todayKey()).replace(/-/g, '')}`;
  let result = null;
  try {
    await runTransaction(db, async (transaction) => {
      const counterRef = doc(collection(db, COLLECTIONS.COUNTERS), key);
      const counterSnap = await transaction.get(counterRef);
      const next = counterSnap.exists() ? (Number(counterSnap.data().value) || 0) + 1 : 1;
      transaction.set(counterRef, { value: next, prefix, dateKey: key, updatedAt: nowISO() }, { merge: true });
      result = formatBusinessNumber(prefix, (dateString || todayKey()).replace(/-/g, ''), next);
    });
  } catch (e) {
    if (e && e.name === 'FirebaseError' && e.code === 'resource-exhausted') {
      throw serviceError('Transaction limit reached while issuing document number');
    }
    throw e;
  }
  return result;
}

export { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, addDoc, query, where, orderBy, limit, runTransaction, serverTimestamp };