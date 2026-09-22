// src/services/purchaseService.js
// Firestore-backed purchase orders + purchase invoices. Invoices touch stock
// (add) inside a transaction; orders only reserve details (no stock change).

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
  invoiceTotals,
  computePayment,
  buildSearchText,
  nowISO,
  todayISO,
  round2,
  slicePage,
  sortByCreatedDesc,
} from './businessLogic';
import { getCurrentUser } from './authService';
import {
  runStockTransaction,
  nextNumber,
  applyStockLine,
  TYPE_PURCHASE,
} from './inventoryOps';
import { db } from '../firebase/firebase';

const ORDERS = 'purchaseOrders';
const INVOICES = 'purchaseInvoices';

function actorName() {
  const user = getCurrentUser();
  return (user && (user.username || user.email)) || 'unknown';
}

function buildOrderItems(docId, lines) {
  return (lines || []).map((line, index) => ({
    id: `po_${docId}_${index + 1}`,
    itemId: line.itemId ? String(line.itemId) : '',
    itemName: line.itemName || '',
    itemCode: line.itemCode || '',
    quantity: round2(Number(line.quantity) || 0),
    unitPrice: round2(Number(line.unitPrice) || 0),
    totalAmount: round2(Number(line.totalAmount) || 0),
    receivedQuantity: Number(line.receivedQuantity) || 0,
    status: line.status || 'PENDING',
  }));
}

function buildOrder(data, docId) {
  const items = buildOrderItems(docId, data.items);
  return {
    poNumber: data.poNumber || '',
    poDate: data.poDate || todayISO(),
    expectedDate: data.expectedDate || '',
    supplierId: data.supplierId ? String(data.supplierId) : '',
    supplierName: data.supplierName || '',
    items,
    status: data.status || 'OPEN',
    note: data.note || '',
    createdBy: actorName(),
    updatedAt: nowISO(),
    searchText: buildSearchText(data.poNumber || '', data.supplierName || ''),
  };
}

function buildInvoiceItems(docId, lines) {
  return (lines || []).map((line, index) => ({
    id: `pi_${docId}_${index + 1}`,
    itemId: line.itemId ? String(line.itemId) : '',
    itemName: line.itemName || '',
    itemCode: line.itemCode || '',
    quantity: round2(Number(line.quantity) || 0),
    unitPrice: round2(Number(line.unitPrice) || 0),
    discountPercent: Number(line.discountPercent) || 0,
    taxPercent: Number(line.taxPercent) || 0,
    totalAmount: round2(Number(line.totalAmount) || 0),
    discountAmount: round2(Number(line.discountAmount) || 0),
    taxAmount: round2(Number(line.taxAmount) || 0),
  }));
}

function buildInvoice(docId, data, lines) {
  const totals = invoiceTotals(lines);
  const payment = computePayment(data.paymentType, totals.netAmount);
  const paid = data.amountPaid !== undefined && Number(data.amountPaid) >= 0
    ? round2(Number(data.amountPaid))
    : payment.paidAmount;
  const balance = round2(totals.netAmount - paid);
  return {
    invoiceNo: data.invoiceNo || '',
    purchaseDate: data.purchaseDate || todayISO(),
    supplierId: data.supplierId ? String(data.supplierId) : '',
    supplierName: data.supplierName || '',
    purchaseOrderId: data.purchaseOrderId ? String(data.purchaseOrderId) : '',
    poNumber: data.poNumber || '',
    items: lines,
    subtotal: totals.totalAmount,
    discountTotal: totals.discountAmount,
    taxTotal: totals.taxAmount,
    grandTotal: totals.netAmount,
    paymentType: data.paymentType || 'CASH',
    amountPaid: paid,
    balanceAmount: balance,
    note: data.note || '',
    createdBy: actorName(),
    updatedAt: nowISO(),
    searchText: buildSearchText(data.invoiceNo || '', data.supplierName || ''),
  };
}

function wrapStockError(e) {
  return serviceError((e && e.message) || 'Could not save purchase invoice', (e && e.code === 'INSUFFICIENT_STOCK') ? 400 : 500);
}

export const purchaseService = {
  // ---- Purchase orders --------------------------------------------------
  async createOrder(data) {
    requireAuth();
    return runStockTransaction(async (tx) => {
      const ref = doc(db, ORDERS);
      const poNumber = await nextNumber(tx, 'PO', data.poDate || todayISO());
      await tx.set(ref, {
        ...buildOrder(data, ref.id),
        poNumber,
        createdAt: nowISO(),
      });
      return { poNumber, id: ref.id, orderId: ref.id };
    });
  },

  async updateOrder(id, data) {
    requireAuth();
    const existing = await getByIdOr404(col(ORDERS), id);
    await setOrderDoc(id, {
      ...existing,
      ...buildOrder(data, id),
      poNumber: existing.poNumber,
      createdAt: existing.createdAt,
    });
    return { poNumber: existing.poNumber, id };
  },

  async getAllOrders(page = 0, size = 20, search = '') {
    return getPaged(col(ORDERS), { page, size, search });
  },

  async searchOrders(search, page = 0, size = 20) {
    return getPaged(col(ORDERS), { page, size, search });
  },

  async getOrdersByDateRange(startDate, endDate, page = 0, size = 20) {
    const items = await getByDateRangeRaw(ORDERS, 'poDate', startDate, endDate);
    return pagedFromItems(items, page, size);
  },

  async getOrdersBySupplier(supplierId, page = 0, size = 2000) {
    const snap = await getDocs(query(col(ORDERS), where('supplierId', '==', String(supplierId))));
    const items = sortByCreatedDesc(fromQuery(snap));
    return pagedFromItems(items, page, size);
  },

  async getOrderById(id) {
    const data = await getByIdOr404(col(ORDERS), id);
    return { ...data, items: data.items || [] };
  },

  async getOrderByPoNumber(poNumber) {
    const snap = await getDocs(query(col(ORDERS), where('poNumber', '==', poNumber), limit(1)));
    const docs = fromQuery(snap);
    if (!docs.length) throw serviceError(`Purchase order ${poNumber} not found`, 404);
    return { ...docs[0], items: docs[0].items || [] };
  },

  async deleteOrder(id) {
    requireAuth();
    await deleteOrderDoc(id);
    return { id, deleted: true };
  },

  async convertOrderToInvoice(id) {
    return this.convertOrder(id);
  },

  async convertOrder(id) {
    requireAuth();
    const existing = await getByIdOr404(col(ORDERS), id);
    if (existing.status === 'COMPLETED') {
      throw serviceError('Purchase order is already completed', 400);
    }
    await setOrderDoc(id, { status: 'COMPLETED', completedAt: nowISO(), updatedAt: nowISO() });
    return { id, status: 'COMPLETED' };
  },

  // ---- Purchase invoices -------------------------------------------------
  async getAll(page = 0, size = 20, search = '') {
    return getPaged(col(INVOICES), { page, size, search });
  },

  async getAllInvoices(page = 0, size = 20) {
    return getPaged(col(INVOICES), { page, size });
  },

  async getInvoicesByDateRange(startDate, endDate, dateType, page = 0, size = 20) {
    const items = await getByDateRangeRaw(INVOICES, 'purchaseDate', startDate, endDate);
    return pagedFromItems(items, page, size);
  },

  async search(search, page = 0, size = 20) {
    return getPaged(col(INVOICES), { page, size, search });
  },

  async getById(id) {
    const data = await getByIdOr404(col(INVOICES), id);
    return { ...data, items: data.items || [] };
  },

  async getInvoiceByInvoiceNo(invoiceNo) {
    const snap = await getDocs(query(col(INVOICES), where('invoiceNo', '==', invoiceNo), limit(1)));
    const docs = fromQuery(snap);
    if (!docs.length) throw serviceError(`Purchase invoice ${invoiceNo} not found`, 404);
    return { ...docs[0], items: docs[0].items || [] };
  },

  async getInvoicesBySupplier(supplierId, page = 0, size = 2000) {
    const snap = await getDocs(query(col(INVOICES), where('supplierId', '==', String(supplierId))));
    const items = sortByCreatedDesc(fromQuery(snap));
    return pagedFromItems(items, page, size);
  },

  async createInvoice(data) {
    requireAuth();
    const lines = (data.items || []).map((line) => ({
      itemId: line.itemId ? String(line.itemId) : '',
      itemName: line.itemName || '',
      itemCode: line.itemCode || '',
      quantity: Number(line.quantity) || 0,
      unitPrice: Number(line.unitPrice) || 0,
      discountPercent: Number(line.discountPercent) || 0,
      taxPercent: Number(line.taxPercent) || 0,
      totalAmount: Number(line.totalAmount) || 0,
    }));
    try {
      return await runStockTransaction(async (tx) => {
        const invoiceRef = doc(db, INVOICES);
        const invoiceNo = await nextNumber(tx, 'PUR', data.purchaseDate || todayISO());
        for (const line of lines) {
          await applyStockLine(tx, {
            itemId: line.itemId,
            itemName: line.itemName,
            itemCode: line.itemCode,
            qty: line.quantity,
            sign: 1,
            type: TYPE_PURCHASE,
            referenceNumber: invoiceNo,
            referenceId: invoiceRef.id,
          });
        }
        const finalLines = buildInvoiceItems(invoiceRef.id, lines);
        await tx.set(invoiceRef, {
          ...buildInvoice(invoiceRef.id, { ...data, invoiceNo }, finalLines),
          invoiceNo,
          createdAt: nowISO(),
        });
        return { invoiceNo, id: invoiceRef.id, invoiceId: invoiceRef.id };
      });
    } catch (e) {
      throw wrapStockError(e);
    }
  },

  async updateInvoice(id, data) {
    requireAuth();
    const existing = await getByIdOr404(col(INVOICES), id);
    const reversedLines = existing.items || [];
    const newLines = (data.items || []).map((line) => ({
      itemId: line.itemId ? String(line.itemId) : '',
      itemName: line.itemName || '',
      itemCode: line.itemCode || '',
      quantity: Number(line.quantity) || 0,
      unitPrice: Number(line.unitPrice) || 0,
      discountPercent: Number(line.discountPercent) || 0,
      taxPercent: Number(line.taxPercent) || 0,
    }));
    try {
      return await runStockTransaction(async (tx) => {
        for (const line of reversedLines) {
          await applyStockLine(tx, {
            itemId: line.itemId,
            itemName: line.itemName,
            itemCode: line.itemCode,
            qty: line.quantity,
            sign: -1,
            type: TYPE_PURCHASE,
            referenceNumber: existing.invoiceNo,
            referenceId: id,
          });
        }
        for (const line of newLines) {
          await applyStockLine(tx, {
            itemId: line.itemId,
            itemName: line.itemName,
            itemCode: line.itemCode,
            qty: line.quantity,
            sign: 1,
            type: TYPE_PURCHASE,
            referenceNumber: existing.invoiceNo,
            referenceId: id,
          });
        }
        const finalLines = buildInvoiceItems(id, newLines);
        await tx.set(docOf(INVOICES, id), {
          ...buildInvoice(id, { ...data, invoiceNo: existing.invoiceNo }, finalLines),
          invoiceNo: existing.invoiceNo,
          createdAt: existing.createdAt,
          updatedAt: nowISO(),
        }, { merge: true });
        return { invoiceNo: existing.invoiceNo, id };
      });
    } catch (e) {
      throw wrapStockError(e);
    }
  },

  async deleteInvoice(id) {
    requireAuth();
    const existing = await getByIdOr404(col(INVOICES), id);
    try {
      await runStockTransaction(async (tx) => {
        for (const line of existing.items || []) {
          await applyStockLine(tx, {
            itemId: line.itemId,
            itemName: line.itemName,
            itemCode: line.itemCode,
            qty: line.quantity,
            sign: -1,
            type: TYPE_PURCHASE,
            referenceNumber: existing.invoiceNo,
            referenceId: id,
          });
        }
        tx.delete(docOf(INVOICES, id));
      });
      return { id, deleted: true };
    } catch (e) {
      throw wrapStockError(e);
    }
  },

  async getRecent() {
    const snap = await getDocs(query(col(INVOICES), limit(10)));
    return sortByCreatedDesc(fromQuery(snap));
  },

  async getStats() {
    const snap = await getDocs(col(INVOICES));
    let total = 0;
    let count = 0;
    snap.forEach((d) => {
      total += Number(d.data().grandTotal) || 0;
      count += 1;
    });
    return { totalPurchases: round2(total), count };
  },

  async exportToExcel(filters = {}) {
    const { content } = await getPaged(col(INVOICES), { page: 0, size: 5000, search: filters.search || '' });
    const headers = ['invoiceNo', 'purchaseDate', 'supplierName', 'poNumber', 'subtotal', 'discountTotal', 'taxTotal', 'grandTotal', 'amountPaid', 'balanceAmount'];
    const csv = toCsv(content, headers);
    downloadCsv(csv, `purchases-${nowISO().slice(0, 10)}.csv`);
    return csv;
  },
};

async function setOrderDoc(id, payload) {
  const { setDoc, updateDoc } = await import('firebase/firestore');
  if (payload.items || payload.poNumber) {
    await setDoc(docOf(ORDERS, id), payload, { merge: true });
  } else {
    await updateDoc(docOf(ORDERS, id), payload);
  }
}

async function getByDateRangeRaw(collectionName, dateField, startDate, endDate) {
  const snap = await getDocs(col(collectionName));
  const start = startDate ? String(startDate).slice(0, 10) : '';
  const end = endDate ? String(endDate).slice(0, 10) : '';
  const filtered = fromQuery(snap).filter((docData) => {
    const key = docData[dateField] ? String(docData[dateField]).slice(0, 10) : '';
    if (!key) return false;
    if (start && key < start) return false;
    if (end && key > end) return false;
    return true;
  });
  return sortByCreatedDesc(filtered);
}

function pagedFromItems(items, page, size) {
  const safePage = Number(page) || 0;
  const safeSize = Number(size) || 20;
  const content = slicePage(items, safePage, safeSize);
  return {
    content,
    totalElements: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / safeSize)),
    number: safePage,
    size: safeSize,
    numberOfElements: content.length,
  };
}

async function deleteOrderDoc(id) {
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(docOf(ORDERS, id));
}

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

export default purchaseService;