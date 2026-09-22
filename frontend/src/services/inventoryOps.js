// src/services/inventoryOps.js
// Atomic inventory operations. Every invoice / purchase / return that touches
// stock is executed inside a single Firestore transaction so a crash can never
// leave stock half-updated, and every document gets a collision-free business
// number from the counters collection.

import {
  applyStock,
  classifyStock,
  round2,
  todayKey,
  formatBusinessNumber,
  nowISO,
} from './businessLogic';
import { getCurrentUser } from './authService';
import { runTransaction } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { COLLECTIONS, docOf } from './firestoreHelpers';
import { firebaseSetupMessage } from '../firebase/config';

export const TYPE_SALES = 'SALES';
export const TYPE_PURCHASE = 'PURCHASE';
export const TYPE_SALES_RETURN = 'SALES_RETURN';
export const TYPE_PURCHASE_RETURN = 'PURCHASE_RETURN';
export const TYPE_ADJUSTMENT = 'ADJUSTMENT';

function actorName() {
  const user = getCurrentUser();
  return (user && (user.username || user.email)) || 'unknown';
}

export function ensureConfigured() {
  if (!db) {
    const err = new Error(firebaseSetupMessage());
    err.code = 'MISCONFIGURED';
    throw err;
  }
}

export async function runStockTransaction(fn) {
  ensureConfigured();
  return runTransaction(db, fn);
}

// Issued inside an active transaction. Reads the counter, increments it, writes
// it back and returns the human-readable business number.
export async function nextNumber(tx, prefix, dateISO) {
  const key = `${prefix}_${(dateISO || todayKey()).replace(/-/g, '')}`;
  const counterRef = docOf(COLLECTIONS.COUNTERS, key);
  const snap = await tx.get(counterRef);
  const next = snap.exists() ? (Number(snap.data().value) || 0) + 1 : 1;
  tx.set(counterRef, { value: next, prefix, dateKey: key, updatedAt: nowISO() }, { merge: true });
  return formatBusinessNumber(prefix, (dateISO || todayKey()).replace(/-/g, ''), next);
}

// Adds a stock movement for one line. Reads the item, applies the delta and
// writes the updated item plus a stock-transaction journal entry.
// sign: +1 for inward (purchase / return-in), -1 for outward (sales / return-out).
export async function applyStockLine(tx, {
  itemId,
  itemName = '',
  itemCode = '',
  qty,
  sign,
  type,
  referenceNumber = '',
  referenceId = '',
}) {
  const quantity = Number(qty) || 0;
  if (!itemId || quantity <= 0) return { itemId, quantity: 0 };
  const itemRef = docOf(COLLECTIONS.ITEMS, String(itemId));
  const itemSnap = await tx.get(itemRef);
  if (!itemSnap.exists()) {
    throw new Error(`Item not found while processing ${referenceNumber || 'document'}`);
  }
  const item = itemSnap.data();
  const current = Number(item.currentStock) || 0;
  const minStock = Number(item.minStock) || 0;
  const delta = sign * quantity;
  const next = applyStock(current, delta, minStock);
  const stockInfo = classifyStock(next.currentStock, next.minStock);
  if (next.insufficient) {
    const err = new Error(`Insufficient stock for ${item.name || itemName || 'Item'} (available: ${current}, required: ${quantity})`);
    err.code = 'INSUFFICIENT_STOCK';
    throw err;
  }
  tx.update(itemRef, {
    currentStock: next.currentStock,
    isLowStock: stockInfo.isLowStock,
    isOutOfStock: stockInfo.isOutOfStock,
    updatedAt: nowISO(),
  });

  const journalRef = docOf(COLLECTIONS.STOCK_TRANSACTIONS);
  tx.set(journalRef, {
    type,
    sign,
    quantity,
    itemId: String(itemId),
    itemName: item.name || itemName,
    itemCode: item.itemCode || itemCode,
    stockBefore: current,
    stockAfter: next.currentStock,
    referenceNumber,
    referenceId: referenceId || '',
    transactionDate: nowISO(),
    transactionKey: todayKey(),
    createdAt: nowISO(),
    createdBy: actorName(),
  });
  return { itemId: String(itemId), stockBefore: current, stockAfter: next.currentStock, quantity };
}

export function assertStockAvailable(current, quantity, label) {
  if (quantity > current) {
    const err = new Error(`Insufficient stock for ${label} (available: ${current}, required: ${quantity})`);
    err.code = 'INSUFFICIENT_STOCK';
    throw err;
  }
}

export function roundNumber(n) {
  return round2(n);
}

export { todayKey, nowISO };