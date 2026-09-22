// src/services/returnService.js
// Firestore-backed sales & purchase returns. Returns reverse stock movements
// (sales return -> stock comes back; purchase return -> stock goes out) inside
// a single transaction each.

import { getDocs, doc, query, where, limit } from 'firebase/firestore';
import {
  col,
  docOf,
  getByIdOr404,
  getPaged,
  serviceError,
  requireAuth,
  fromQuery,
} from './firestoreHelpers';
import {
  round2,
  buildSearchText,
  nowISO,
  todayISO,
} from './businessLogic';
import { getCurrentUser } from './authService';
import {
  runStockTransaction,
  nextNumber,
  applyStockLine,
  TYPE_SALES_RETURN,
  TYPE_PURCHASE_RETURN,
} from './inventoryOps';
import { db } from '../firebase/firebase';

const SALES_RETURNS = 'salesReturns';
const PURCHASE_RETURNS = 'purchaseReturns';

function actorName() {
  const user = getCurrentUser();
  return (user && (user.username || user.email)) || 'unknown';
}

function wrapError(e, fallback) {
  return serviceError((e && e.message) || fallback, (e && e.code === 'INSUFFICIENT_STOCK') ? 400 : 500);
}

function buildReturnItems(prefix, docId, lines) {
  return (lines || []).map((line, index) => ({
    id: `${prefix}_${docId}_${index + 1}`,
    itemId: line.itemId ? String(line.itemId) : '',
    itemName: line.itemName || '',
    itemCode: line.itemCode || '',
    returnQuantity: round2(Number(line.returnQuantity) || Number(line.quantity) || 0),
    quantity: round2(Number(line.quantity) || Number(line.returnQuantity) || 0),
    unitPrice: round2(Number(line.unitPrice) || 0),
    totalAmount: round2(Number(line.totalAmount) || 0),
  }));
}

async function readInvoiceForBalance(type, invoiceId) {
  if (!invoiceId) return null;
  const collectionName = type === 'SALES' ? 'salesInvoices' : 'purchaseInvoices';
  try {
    return await getByIdOr404(col(collectionName), invoiceId);
  } catch (e) {
    return null;
  }
}

export const returnService = {
  // ---- Sales returns (stock comes back) ---------------------------------
  async createSalesReturn(data) {
    requireAuth();
    const lines = (data.items || []).map((line) => ({
      itemId: line.itemId ? String(line.itemId) : '',
      itemName: line.itemName || '',
      itemCode: line.itemCode || '',
      returnQuantity: Number(line.returnQuantity) || Number(line.quantity) || 0,
      quantity: Number(line.quantity) || 0,
      unitPrice: Number(line.unitPrice) || 0,
      totalAmount: Number(line.returnQuantity) * Number(line.unitPrice),
    }));
    try {
      return await runStockTransaction(async (tx) => {
        const ref = doc(db, SALES_RETURNS);
        const returnNo = await nextNumber(tx, 'RET', data.returnDate || todayISO());
        for (const line of lines) {
          await applyStockLine(tx, {
            itemId: line.itemId,
            itemName: line.itemName,
            itemCode: line.itemCode,
            qty: line.returnQuantity,
            sign: 1,
            type: TYPE_SALES_RETURN,
            referenceNumber: returnNo,
            referenceId: ref.id,
          });
        }
        const finalItems = buildReturnItems('SR', ref.id, lines);
        const totalRefund = round2(finalItems.reduce((s, i) => s + i.totalAmount, 0));
        await tx.set(ref, {
          returnNo,
          returnType: 'SALES',
          returnDate: data.returnDate || todayISO(),
          invoiceNo: data.invoiceNo || '',
          invoiceId: data.invoiceId ? String(data.invoiceId) : '',
          customerId: data.customerId ? String(data.customerId) : '',
          customerName: data.customerName || '',
          items: finalItems,
          totalAmount: round2(Number(data.totalAmount) || totalRefund),
          totalRefund,
          reason: data.reason || '',
          createdBy: actorName(),
          createdAt: nowISO(),
          updatedAt: nowISO(),
          searchText: buildSearchText(data.returnNo || '', data.customerName || '', data.invoiceNo || ''),
        }, { merge: true });
        const existingInvoice = data.invoiceId ? await readInvoiceForBalance('SALES', data.invoiceId) : null;
        if (existingInvoice) {
          const newBalance = Math.max(0, round2(Number(existingInvoice.balanceAmount) - totalRefund));
          tx.update(docOf('salesInvoices', data.invoiceId), { balanceAmount: newBalance });
        }
        return { returnNo, id: ref.id };
      });
    } catch (e) {
      throw wrapError(e, 'Could not process sales return');
    }
  },

  async getSalesReturns(page = 0, size = 20, search = '') {
    return getPaged(col(SALES_RETURNS), { page, size, search });
  },

  async getSalesReturnById(id) {
    const data = await getByIdOr404(col(SALES_RETURNS), id);
    return { ...data, items: data.items || [] };
  },

  async getSalesReturnByReturnNo(returnNo) {
    const snap = await getDocs(query(col(SALES_RETURNS), where('returnNo', '==', returnNo), limit(1)));
    const docs = fromQuery(snap);
    if (!docs.length) throw serviceError(`Sales return ${returnNo} not found`, 404);
    return { ...docs[0], items: docs[0].items || [] };
  },

  async updateSalesReturn(id, data) {
    requireAuth();
    const existing = await getByIdOr404(col(SALES_RETURNS), id);
    const oldItems = existing.items || [];
    const newLines = (data.items || []).map((line) => ({
      itemId: line.itemId ? String(line.itemId) : '',
      itemName: line.itemName || '',
      itemCode: line.itemCode || '',
      returnQuantity: Number(line.returnQuantity) || Number(line.quantity) || 0,
      unitPrice: Number(line.unitPrice) || 0,
      totalAmount: Number(line.returnQuantity) * Number(line.unitPrice),
    }));
    try {
      return await runStockTransaction(async (tx) => {
        for (const line of oldItems) {
          await applyStockLine(tx, {
            itemId: line.itemId,
            itemName: line.itemName,
            itemCode: line.itemCode,
            qty: line.returnQuantity,
            sign: -1,
            type: TYPE_SALES_RETURN,
            referenceNumber: existing.returnNo,
            referenceId: id,
          });
        }
        for (const line of newLines) {
          await applyStockLine(tx, {
            itemId: line.itemId,
            itemName: line.itemName,
            itemCode: line.itemCode,
            qty: line.returnQuantity,
            sign: 1,
            type: TYPE_SALES_RETURN,
            referenceNumber: existing.returnNo,
            referenceId: id,
          });
        }
        const finalItems = buildReturnItems('SR', id, newLines);
        const totalRefund = round2(finalItems.reduce((s, i) => s + i.totalAmount, 0));
        await tx.set(docOf(SALES_RETURNS, id), {
          ...existing,
          returnDate: data.returnDate || existing.returnDate,
          items: finalItems,
          totalRefund,
          totalAmount: round2(Number(data.totalAmount) || totalRefund),
          reason: data.reason !== undefined ? data.reason : existing.reason,
          updatedAt: nowISO(),
        }, { merge: true });
        return { returnNo: existing.returnNo, id };
      });
    } catch (e) {
      throw wrapError(e, 'Could not update sales return');
    }
  },

  async deleteSalesReturn(id) {
    requireAuth();
    const existing = await getByIdOr404(col(SALES_RETURNS), id);
    try {
      await runStockTransaction(async (tx) => {
        for (const line of existing.items || []) {
          await applyStockLine(tx, {
            itemId: line.itemId,
            itemName: line.itemName,
            itemCode: line.itemCode,
            qty: line.returnQuantity,
            sign: -1,
            type: TYPE_SALES_RETURN,
            referenceNumber: existing.returnNo,
            referenceId: id,
          });
        }
        tx.delete(docOf(SALES_RETURNS, id));
      });
      return { id, deleted: true };
    } catch (e) {
      throw wrapError(e, 'Could not delete sales return');
    }
  },

  // ---- Purchase returns (stock goes out) --------------------------------
  async createPurchaseReturn(data) {
    requireAuth();
    const lines = (data.items || []).map((line) => ({
      itemId: line.itemId ? String(line.itemId) : '',
      itemName: line.itemName || '',
      itemCode: line.itemCode || '',
      returnQuantity: Number(line.returnQuantity) || Number(line.quantity) || 0,
      unitPrice: Number(line.unitPrice) || 0,
      totalAmount: Number(line.returnQuantity) * Number(line.unitPrice),
    }));
    try {
      return await runStockTransaction(async (tx) => {
        const ref = doc(db, PURCHASE_RETURNS);
        const returnNo = await nextNumber(tx, 'PRET', data.returnDate || todayISO());
        for (const line of lines) {
          await applyStockLine(tx, {
            itemId: line.itemId,
            itemName: line.itemName,
            itemCode: line.itemCode,
            qty: line.returnQuantity,
            sign: -1,
            type: TYPE_PURCHASE_RETURN,
            referenceNumber: returnNo,
            referenceId: ref.id,
          });
        }
        const finalItems = buildReturnItems('PR', ref.id, lines);
        const totalRefund = round2(finalItems.reduce((s, i) => s + i.totalAmount, 0));
        await tx.set(ref, {
          returnNo,
          returnType: 'PURCHASE',
          returnDate: data.returnDate || todayISO(),
          invoiceNo: data.invoiceNo || '',
          invoiceId: data.invoiceId ? String(data.invoiceId) : '',
          supplierId: data.supplierId ? String(data.supplierId) : '',
          supplierName: data.supplierName || '',
          items: finalItems,
          totalAmount: round2(Number(data.totalAmount) || totalRefund),
          totalRefund,
          reason: data.reason || '',
          createdBy: actorName(),
          createdAt: nowISO(),
          updatedAt: nowISO(),
          searchText: buildSearchText(data.returnNo || '', data.supplierName || '', data.invoiceNo || ''),
        }, { merge: true });
        return { returnNo, id: ref.id };
      });
    } catch (e) {
      throw wrapError(e, 'Could not process purchase return');
    }
  },

  async getPurchaseReturns(page = 0, size = 20, search = '') {
    return getPaged(col(PURCHASE_RETURNS), { page, size, search });
  },

  async getPurchaseReturnById(id) {
    const data = await getByIdOr404(col(PURCHASE_RETURNS), id);
    return { ...data, items: data.items || [] };
  },

  async getPurchaseReturnByReturnNo(returnNo) {
    const snap = await getDocs(query(col(PURCHASE_RETURNS), where('returnNo', '==', returnNo), limit(1)));
    const docs = fromQuery(snap);
    if (!docs.length) throw serviceError(`Purchase return ${returnNo} not found`, 404);
    return { ...docs[0], items: docs[0].items || [] };
  },

  async updatePurchaseReturn(id, data) {
    requireAuth();
    const existing = await getByIdOr404(col(PURCHASE_RETURNS), id);
    const oldItems = existing.items || [];
    const newLines = (data.items || []).map((line) => ({
      itemId: line.itemId ? String(line.itemId) : '',
      itemName: line.itemName || '',
      itemCode: line.itemCode || '',
      returnQuantity: Number(line.returnQuantity) || Number(line.quantity) || 0,
      unitPrice: Number(line.unitPrice) || 0,
      totalAmount: Number(line.returnQuantity) * Number(line.unitPrice),
    }));
    try {
      return await runStockTransaction(async (tx) => {
        for (const line of oldItems) {
          await applyStockLine(tx, {
            itemId: line.itemId,
            itemName: line.itemName,
            itemCode: line.itemCode,
            qty: line.returnQuantity,
            sign: 1,
            type: TYPE_PURCHASE_RETURN,
            referenceNumber: existing.returnNo,
            referenceId: id,
          });
        }
        for (const line of newLines) {
          await applyStockLine(tx, {
            itemId: line.itemId,
            itemName: line.itemName,
            itemCode: line.itemCode,
            qty: line.returnQuantity,
            sign: -1,
            type: TYPE_PURCHASE_RETURN,
            referenceNumber: existing.returnNo,
            referenceId: id,
          });
        }
        const finalItems = buildReturnItems('PR', id, newLines);
        const totalRefund = round2(finalItems.reduce((s, i) => s + i.totalAmount, 0));
        await tx.set(docOf(PURCHASE_RETURNS, id), {
          ...existing,
          returnDate: data.returnDate || existing.returnDate,
          items: finalItems,
          totalRefund,
          totalAmount: round2(Number(data.totalAmount) || totalRefund),
          reason: data.reason !== undefined ? data.reason : existing.reason,
          updatedAt: nowISO(),
        }, { merge: true });
        return { returnNo: existing.returnNo, id };
      });
    } catch (e) {
      throw wrapError(e, 'Could not update purchase return');
    }
  },

  async deletePurchaseReturn(id) {
    requireAuth();
    const existing = await getByIdOr404(col(PURCHASE_RETURNS), id);
    try {
      await runStockTransaction(async (tx) => {
        for (const line of existing.items || []) {
          await applyStockLine(tx, {
            itemId: line.itemId,
            itemName: line.itemName,
            itemCode: line.itemCode,
            qty: line.returnQuantity,
            sign: 1,
            type: TYPE_PURCHASE_RETURN,
            referenceNumber: existing.returnNo,
            referenceId: id,
          });
        }
        tx.delete(docOf(PURCHASE_RETURNS, id));
      });
      return { id, deleted: true };
    } catch (e) {
      throw wrapError(e, 'Could not delete purchase return');
    }
  },

  // ---- Common -----------------------------------------------------------
  async getRecent() {
    const salesSnap = await getDocs(query(col(SALES_RETURNS), limit(5)));
    const purchaseSnap = await getDocs(query(col(PURCHASE_RETURNS), limit(5)));
    return [...fromQuery(salesSnap), ...fromQuery(purchaseSnap)].sort((a, b) => {
      const aT = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bT = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bT - aT;
    });
  },

  async getStats() {
    const salesSnap = await getDocs(col(SALES_RETURNS));
    const purchaseSnap = await getDocs(col(PURCHASE_RETURNS));
    let salesValue = 0;
    let purchaseValue = 0;
    salesSnap.forEach((d) => { salesValue += Number(d.data().totalRefund) || 0; });
    purchaseSnap.forEach((d) => { purchaseValue += Number(d.data().totalRefund) || 0; });
    return {
      salesReturnsCount: salesSnap.size,
      purchasesReturnsCount: purchaseSnap.size,
      salesReturnsValue: round2(salesValue),
      purchaseReturnsValue: round2(purchaseValue),
    };
  },
};

export default returnService;