// src/services/accountService.js
// Firestore-backed accounts: bill receipts against customer dues and bill
// payments against supplier dues. Receipts/payments adjust both the invoice
// balance and the party credit balance atomically.

import { getDocs, getDoc, doc, query, where, limit } from '@firebase/firestore';
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
  sortByCreatedDesc,
} from './businessLogic';
import { getCurrentUser } from './authService';
import { runStockTransaction, nextNumber } from './inventoryOps';
import { db } from '../firebase/firebase';

const RECEIPTS = 'billReceipts';
const PAYMENTS = 'billPayments';

function actorName() {
  const user = getCurrentUser();
  return (user && (user.username || user.email)) || 'unknown';
}

function wrapError(e, fallback) {
  return serviceError((e && e.message) || fallback, 400);
}

async function getCustomerDoc(id) {
  try {
    const snap = await getDoc(doc(db, 'customers', String(id)));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    return null;
  }
}

export const accountService = {
  // ---- Reports ----------------------------------------------------------
  async getCustomersWithBalance() {
    const snap = await getDocs(col('customers'));
    const customers = [];
    snap.forEach((d) => customers.push({ ...d.data(), id: d.id }));
    const withBalance = customers.filter((c) => (Number(c.creditBalance) || 0) > 0);
    const totalDue = round2(withBalance.reduce((sum, c) => sum + (Number(c.creditBalance) || 0), 0));
    return { customers: withBalance, totalDue, totalCustomers: withBalance.length };
  },

  async getSuppliersWithBalance() {
    const snap = await getDocs(col('suppliers'));
    const suppliers = [];
    snap.forEach((d) => suppliers.push({ ...d.data(), id: d.id }));
    const withBalance = suppliers.filter((s) => (Number(s.creditBalance) || 0) > 0);
    const totalDue = round2(withBalance.reduce((sum, s) => sum + (Number(s.creditBalance) || 0), 0));
    return { suppliers: withBalance, totalDue, totalSuppliers: withBalance.length };
  },

  // Chronological customer statement in the shape LedgerView expects:
  // opening balance, invoices (debit), receipts/returns (credit), oldest first
  // so running balances add up correctly.
  async getCustomerLedger(customerId) {
    const idStr = String(customerId);
    const [custSnap, invSnap, recSnap, retSnap] = await Promise.all([
      getCustomerDoc(idStr),
      getDocs(query(col('salesInvoices'), where('customerId', '==', idStr))),
      getDocs(query(col(RECEIPTS), where('customerId', '==', idStr))),
      getDocs(query(col('salesReturns'), where('customerId', '==', idStr))),
    ]);

    const entries = [];
    const opening = custSnap ? Number(custSnap.openingBalance) || 0 : 0;
    if (opening > 0) {
      entries.push({
        id: 'opening',
        type: 'Opening Balance',
        date: '',
        amount: round2(opening),
        paidAmount: 0,
        invoiceNo: '',
        description: 'Opening Balance',
        createdAt: '',
      });
    }
    fromQuery(invSnap).forEach((inv) => {
      const total = round2(Number(inv.grandTotal) || Number(inv.netAmount) || 0);
      entries.push({
        id: inv.id,
        type: 'Invoice',
        date: String(inv.invoiceDate || inv.createdAt || '').slice(0, 10),
        amount: total,
        paidAmount: round2(total - (Number(inv.balanceAmount) || 0)),
        invoiceNo: inv.invoiceNo || '',
        description: `Sales Invoice #${inv.invoiceNo}`,
        paymentStatus: inv.paymentStatus || '',
        createdAt: inv.createdAt || '',
      });
    });
    fromQuery(recSnap).forEach((rec) => {
      entries.push({
        id: rec.id,
        type: 'Receipt',
        date: String(rec.receiptDate || rec.createdAt || '').slice(0, 10),
        amount: round2(Number(rec.amount) || 0),
        invoiceNo: rec.invoiceNo || '',
        description: `Payment Receipt #${rec.receiptNo}`,
        paymentMode: rec.paymentMethod || 'CASH',
        createdAt: rec.createdAt || '',
      });
    });
    fromQuery(retSnap).forEach((ret) => {
      entries.push({
        id: ret.id,
        type: 'Credit Note',
        date: String(ret.returnDate || ret.createdAt || '').slice(0, 10),
        amount: round2(Number(ret.totalAmount) || Number(ret.totalRefund) || 0),
        invoiceNo: ret.invoiceNo || '',
        description: `Sales Return #${ret.returnNo}`,
        createdAt: ret.createdAt || '',
      });
    });

    entries.sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.createdAt).localeCompare(String(b.createdAt)));
    return entries;
  },

  async getSupplierLedger(supplierId) {
    const snap = await getDocs(query(col(PAYMENTS), where('supplierId', '==', String(supplierId))));
    return sortByCreatedDesc(fromQuery(snap));
  },

  // ---- Bill receipts (money in from customers) --------------------------
  async createReceipt(data) {
    return this.createBillReceipt(data);
  },

  async createBillReceipt(data) {
    requireAuth();
    const amount = round2(Number(data.amount) || 0);
    if (amount <= 0) throw serviceError('Receipt amount must be greater than zero', 400);
    try {
      return await runStockTransaction(async (tx) => {
        const ref = doc(db, RECEIPTS);
        const invSnap = data.invoiceId
          ? await tx.get(docOf('salesInvoices', String(data.invoiceId)))
          : null;
        const custSnap = data.customerId
          ? await tx.get(docOf('customers', String(data.customerId)))
          : null;
        const receiptNo = await nextNumber(tx, 'REC', data.receiptDate || todayISO());
        const payload = {
          receiptNo,
          receiptDate: data.receiptDate || todayISO(),
          customerId: data.customerId ? String(data.customerId) : '',
          customerName: data.customerName || '',
          invoiceId: data.invoiceId ? String(data.invoiceId) : '',
          invoiceNo: data.invoiceNo || '',
          amount,
          paymentMethod: data.paymentMethod || 'CASH',
          note: data.note || '',
          createdBy: actorName(),
          createdAt: nowISO(),
          updatedAt: nowISO(),
          searchText: buildSearchText(receiptNo, data.customerName || '', data.invoiceNo || ''),
        };
        await tx.set(ref, payload);
        if (invSnap && invSnap.exists()) {
          const invoice = invSnap.data();
          const newBalance = Math.max(0, round2(Number(invoice.balanceAmount) - amount));
          tx.update(docOf('salesInvoices', String(data.invoiceId)), { balanceAmount: newBalance, paymentStatus: newBalance <= 0 ? 'PAID' : 'DUE' });
        }
        if (custSnap && custSnap.exists()) {
          const customer = custSnap.data();
          const newBalance = Math.max(0, round2(Number(customer.creditBalance) - amount));
          tx.update(docOf('customers', String(data.customerId)), { creditBalance: newBalance });
        }
        return { ...payload, receiptNo, id: ref.id };
      });
    } catch (e) {
      throw wrapError(e, 'Could not create bill receipt');
    }
  },

  async getBillReceipts(page = 0, size = 20, search = '') {
    return getPaged(col(RECEIPTS), { page, size, search });
  },

  async getBillReceiptById(id) {
    return getByIdOr404(col(RECEIPTS), id);
  },

  async getBillReceiptByReceiptNo(receiptNo) {
    const snap = await getDocs(query(col(RECEIPTS), where('receiptNo', '==', receiptNo), limit(1)));
    const docs = fromQuery(snap);
    if (!docs.length) throw serviceError(`Receipt ${receiptNo} not found`, 404);
    return docs[0];
  },

  async deleteBillReceipt(id) {
    requireAuth();
    const existing = await getByIdOr404(col(RECEIPTS), id);
    try {
      await runStockTransaction(async (tx) => {
        const invSnap = existing.invoiceId
          ? await tx.get(docOf('salesInvoices', String(existing.invoiceId)))
          : null;
        const custSnap = existing.customerId
          ? await tx.get(docOf('customers', String(existing.customerId)))
          : null;
        if (invSnap && invSnap.exists()) {
          const invoice = invSnap.data();
          const newBalance = round2(Number(invoice.balanceAmount) + Number(existing.amount));
          tx.update(docOf('salesInvoices', String(existing.invoiceId)), { balanceAmount: newBalance, paymentStatus: newBalance <= 0 ? 'PAID' : 'DUE' });
        }
        if (custSnap && custSnap.exists()) {
          const customer = custSnap.data();
          tx.update(docOf('customers', String(existing.customerId)), { creditBalance: round2(Number(customer.creditBalance) + Number(existing.amount)) });
        }
        tx.delete(docOf(RECEIPTS, id));
      });
      return { id, deleted: true };
    } catch (e) {
      throw wrapError(e, 'Could not delete bill receipt');
    }
  },

  // ---- Bill payments (money out to suppliers) ---------------------------
  async createPayment(data) {
    return this.createBillPayment(data);
  },

  async createBillPayment(data) {
    requireAuth();
    const amount = round2(Number(data.amount) || 0);
    if (amount <= 0) throw serviceError('Payment amount must be greater than zero', 400);
    try {
      return await runStockTransaction(async (tx) => {
        const ref = doc(db, PAYMENTS);
        const invSnap = data.invoiceId
          ? await tx.get(docOf('purchaseInvoices', String(data.invoiceId)))
          : null;
        const supSnap = data.supplierId
          ? await tx.get(docOf('suppliers', String(data.supplierId)))
          : null;
        const paymentNo = await nextNumber(tx, 'PAY', data.paymentDate || todayISO());
        const payload = {
          paymentNo,
          paymentDate: data.paymentDate || todayISO(),
          supplierId: data.supplierId ? String(data.supplierId) : '',
          supplierName: data.supplierName || '',
          invoiceId: data.invoiceId ? String(data.invoiceId) : '',
          invoiceNo: data.invoiceNo || '',
          amount,
          paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
          note: data.note || '',
          createdBy: actorName(),
          createdAt: nowISO(),
          updatedAt: nowISO(),
          searchText: buildSearchText(paymentNo, data.supplierName || '', data.invoiceNo || ''),
        };
        await tx.set(ref, payload);
        if (invSnap && invSnap.exists()) {
          const invoice = invSnap.data();
          const newBalance = Math.max(0, round2(Number(invoice.balanceAmount) - amount));
          tx.update(docOf('purchaseInvoices', String(data.invoiceId)), { balanceAmount: newBalance, paymentStatus: newBalance <= 0 ? 'PAID' : 'DUE' });
        }
        if (supSnap && supSnap.exists()) {
          const supplier = supSnap.data();
          tx.update(docOf('suppliers', String(data.supplierId)), { creditBalance: Math.max(0, round2(Number(supplier.creditBalance) - amount)) });
        }
        return { ...payload, paymentNo, id: ref.id };
      });
    } catch (e) {
      throw wrapError(e, 'Could not create bill payment');
    }
  },

  async getBillPayments(page = 0, size = 20, search = '') {
    return getPaged(col(PAYMENTS), { page, size, search });
  },

  async getBillPaymentById(id) {
    return getByIdOr404(col(PAYMENTS), id);
  },

  async getBillPaymentByPaymentNo(paymentNo) {
    const snap = await getDocs(query(col(PAYMENTS), where('paymentNo', '==', paymentNo), limit(1)));
    const docs = fromQuery(snap);
    if (!docs.length) throw serviceError(`Payment ${paymentNo} not found`, 404);
    return docs[0];
  },

  async deleteBillPayment(id) {
    requireAuth();
    const existing = await getByIdOr404(col(PAYMENTS), id);
    try {
      await runStockTransaction(async (tx) => {
        if (existing.invoiceId) {
          const invSnap = await tx.get(docOf('purchaseInvoices', String(existing.invoiceId)));
          if (invSnap.exists()) {
            const invoice = invSnap.data();
            const newBalance = round2(Number(invoice.balanceAmount) + Number(existing.amount));
            tx.update(docOf('purchaseInvoices', String(existing.invoiceId)), { balanceAmount: newBalance, paymentStatus: newBalance <= 0 ? 'PAID' : 'DUE' });
          }
        }
        if (existing.supplierId) {
          const supSnap = await tx.get(docOf('suppliers', String(existing.supplierId)));
          if (supSnap.exists()) {
            const supplier = supSnap.data();
            tx.update(docOf('suppliers', String(existing.supplierId)), { creditBalance: round2(Number(supplier.creditBalance) + Number(existing.amount)) });
          }
        }
        tx.delete(docOf(PAYMENTS, id));
      });
      return { id, deleted: true };
    } catch (e) {
      throw wrapError(e, 'Could not delete bill payment');
    }
  },

  // ---- Common -----------------------------------------------------------
  async getRecent() {
    const rec = await getDocs(query(col(RECEIPTS), limit(5)));
    const pay = await getDocs(query(col(PAYMENTS), limit(5)));
    return [...fromQuery(rec), ...fromQuery(pay)].sort((a, b) => {
      const aT = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bT = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bT - aT;
    });
  },

  async exportToExcel(kind = 'RECEIPTS', filters = {}) {
    const collectionName = kind === 'PAYMENTS' ? PAYMENTS : RECEIPTS;
    const { content } = await getPaged(col(collectionName), { page: 0, size: 5000, search: filters.search || '' });
    const headers = ['receiptNo', 'receiptDate', 'customerName', 'invoiceNo', 'amount', 'paymentMethod', 'note', 'createdAt'];
    const csv = toCsv(content, headers);
    downloadCsv(csv, `${collectionName}-${nowISO().slice(0, 10)}.csv`);
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

export default accountService;