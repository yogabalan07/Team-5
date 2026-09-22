// src/services/salesService.js
// Firestore-backed sales invoices. Invoice creation/update/delete and the
// resulting stock movements all run inside one transaction each.

import { getDocs, doc, query, where, limit } from 'firebase/firestore';
import {
  col,
  docOf,
  getByIdOr404,
  getPaged,
  serviceError,
  requireAuth,
  fromQuery,
  fromSnap,
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
  TYPE_SALES,
} from './inventoryOps';
import { db } from '../firebase/firebase';

const SALES = 'salesInvoices';

function actorName() {
  const user = getCurrentUser();
  return (user && (user.username || user.email)) || 'unknown';
}

function buildItems(docId, lines) {
  return (lines || []).map((line, index) => ({
    id: `l_${docId}_${index + 1}`,
    itemId: line.itemId ? String(line.itemId) : '',
    itemName: line.itemName || '',
    itemCode: line.itemCode || '',
    quantity: Number(line.quantity) || 0,
    unitPrice: round2(Number(line.unitPrice) || 0),
    discountPercent: Number(line.discountPercent) || 0,
    taxPercent: Number(line.taxPercent) || 0,
    totalAmount: round2(Number(line.totalAmount) || invoiceTotals([line]).totalAmount),
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
    invoiceDate: data.invoiceDate || todayISO(),
    customerId: data.customerId ? String(data.customerId) : '',
    customerName: data.customerName || '',
    customerPhone: data.customerPhone || '',
    items: lines,
    subtotal: totals.totalAmount,
    discountTotal: totals.discountAmount,
    taxTotal: totals.taxAmount,
    grandTotal: totals.netAmount,
    paymentType: data.paymentType || 'CASH',
    amountPaid: paid,
    balanceAmount: balance,
    paymentStatus: balance <= 0 ? 'PAID' : 'DUE',
    note: data.note || '',
    createdBy: actorName(),
    updatedAt: nowISO(),
    searchText: buildSearchText(
      data.invoiceNo || '',
      data.customerName || '',
      data.customerPhone || ''
    ),
  };
}

function wrapStockError(e) {
  const message = (e && e.message) || 'Could not save sales invoice';
  const status = (e && e.code === 'INSUFFICIENT_STOCK') ? 400 : 500;
  return serviceError(message, status);
}

export const salesService = {
  async getAll(page = 0, size = 20, search = '') {
    return getPaged(col(SALES), { page, size, search });
  },

  async getAllInvoices(page = 0, size = 20) {
    return getPaged(col(SALES), { page, size });
  },

  async getInvoicesByDateRange(startDate, endDate, page = 0, size = 20) {
    const items = await getInvoicesByDateRangeRaw(SALES, 'invoiceDate', startDate, endDate);
    return { content: slicePage(items, page, size), totalElements: items.length, totalPages: Math.max(1, Math.ceil(items.length / size)), number: page, size };
  },

  async search(search, page = 0, size = 20) {
    return getPaged(col(SALES), { page, size, search });
  },

  async getInvoiceById(id) {
    const data = await getByIdOr404(col(SALES), id);
    return normalizeInvoice(data);
  },

  async getById(id) {
    try {
      const data = await getByIdOr404(col(SALES), id);
      return normalizeInvoice(data);
    } catch (e) {
      if (e && e.response && e.response.status === 404) return null;
      throw e;
    }
  },

  async getInvoiceByNo(invoiceNo) {
    const snap = await getDocs(query(col(SALES), where('invoiceNo', '==', invoiceNo), limit(1)));
    const docs = fromQuery(snap);
    if (!docs.length) throw serviceError(`Invoice ${invoiceNo} not found`, 404);
    return normalizeInvoice(docs[0]);
  },

  async getInvoicesByCustomer(customerId, page = 0, size = 20) {
    const snap = await getDocs(query(col(SALES), where('customerId', '==', String(customerId))));
    const items = sortByCreatedDesc(fromQuery(snap));
    const sliced = slicePage(items, page, size);
    return { content: sliced, totalElements: items.length, totalPages: Math.max(1, Math.ceil(items.length / size)), number: page, size };
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
      discountAmount: Number(line.discountAmount) || 0,
      taxAmount: Number(line.taxAmount) || 0,
    }));
    try {
      return await runStockTransaction(async (tx) => {
        const invoiceRef = doc(db, SALES);
        const invoiceNo = await nextNumber(tx, 'INV', data.invoiceDate || todayISO());
        for (const line of lines) {
          await applyStockLine(tx, {
            itemId: line.itemId,
            itemName: line.itemName,
            itemCode: line.itemCode,
            qty: line.quantity,
            sign: -1,
            type: TYPE_SALES,
            referenceNumber: invoiceNo,
            referenceId: invoiceRef.id,
          });
        }
        const finalLines = buildItems(invoiceRef.id, lines);
        await tx.set(invoiceRef, {
          ...buildInvoice(invoiceRef.id, { ...data, invoiceNo }, finalLines),
          invoiceNo,
          createdAt: nowISO(),
        });
        return { invoiceNo, invoiceId: invoiceRef.id, id: invoiceRef.id };
      });
    } catch (e) {
      throw wrapStockError(e);
    }
  },

  async updateInvoice(id, data) {
    requireAuth();
    const existing = await getByIdOr404(col(SALES), id);
    const reversedLines = existing.items || [];
    const newLines = (data.items || []).map((line) => ({
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
        for (const line of reversedLines) {
          await applyStockLine(tx, {
            itemId: line.itemId,
            itemName: line.itemName,
            itemCode: line.itemCode,
            qty: line.quantity,
            sign: 1,
            type: TYPE_SALES,
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
            sign: -1,
            type: TYPE_SALES,
            referenceNumber: existing.invoiceNo,
            referenceId: id,
          });
        }
        const finalLines = buildItems(id, newLines);
        await tx.set(docOf(SALES, id), {
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
    const existing = await getByIdOr404(col(SALES), id);
    try {
      await runStockTransaction(async (tx) => {
        for (const line of existing.items || []) {
          await applyStockLine(tx, {
            itemId: line.itemId,
            itemName: line.itemName,
            itemCode: line.itemCode,
            qty: line.quantity,
            sign: 1,
            type: TYPE_SALES,
            referenceNumber: existing.invoiceNo,
            referenceId: id,
          });
        }
        tx.delete(docOf(SALES, id));
      });
      return { id, deleted: true };
    } catch (e) {
      throw wrapStockError(e);
    }
  },

  async getRecent() {
    const snap = await getDocs(query(col(SALES), limit(10)));
    return sortByCreatedDesc(fromQuery(snap));
  },

  async getStats() {
    const snap = await getDocs(col(SALES));
    let totalSales = 0;
    let count = 0;
    snap.forEach((d) => {
      const data = d.data();
      totalSales += Number(data.grandTotal) || 0;
      count += 1;
    });
    return { totalSales: round2(totalSales), count };
  },

  async exportToExcel(filters = {}) {
    const { content } = await getPaged(col(SALES), { page: 0, size: 5000, search: filters.search || '' });
    const headers = ['invoiceNo', 'invoiceDate', 'customerName', 'customerPhone', 'subtotal', 'discountTotal', 'taxTotal', 'grandTotal', 'amountPaid', 'balanceAmount', 'paymentStatus'];
    const csv = toCsv(content, headers);
    downloadCsv(csv, `sales-${nowISO().slice(0, 10)}.csv`);
    return csv;
  },
};

function normalizeInvoice(data) {
  return { ...data, items: data.items || [] };
}

async function getInvoicesByDateRangeRaw(collectionName, dateField, startDate, endDate) {
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

export default salesService;