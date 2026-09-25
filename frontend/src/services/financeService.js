// src/services/financeService.js
// Phase 7 — Payments & Financial Management: accounts receivable/payable aging,
// expense management, payment vouchers, cash & bank book and financial summaries.
//
// All aggregation runs client-side over bounded fetches (Spark tier: no
// Cloud Functions, no external backend), matching the existing getPaged /
// getLedger query style.

import { getDocs, doc, query, limit } from '@firebase/firestore';
import {
  col,
  docOf,
  serviceError,
  requireAuth,
  fromQuery,
} from './firestoreHelpers';
import { round2, buildSearchText, nowISO, todayISO } from './businessLogic';
import { getCurrentUser } from './authService';
import { runStockTransaction, nextNumber } from './inventoryOps';
import { db } from '../firebase/firebase';

const SALES_INVOICES = 'salesInvoices';
const PURCHASE_INVOICES = 'purchaseInvoices';
const RECEIPTS = 'billReceipts';
const PAYMENTS = 'billPayments';
const EXPENSES = 'expenses';
const VOUCHERS = 'paymentVouchers';

export const EXPENSE_CATEGORIES = [
  'Rent',
  'Salaries & Wages',
  'Utilities',
  'Transport & Fuel',
  'Marketing',
  'Repairs & Maintenance',
  'Office Supplies',
  'Bank Charges',
  'Insurance',
  'Taxes & Licenses',
  'Professional Fees',
  'Other',
];

export const PAYMENT_MODES = ['CASH', 'BANK', 'CHEQUE'];

function actorName() {
  const user = getCurrentUser();
  return (user && (user.username || user.email)) || 'unknown';
}

function daysBetween(fromISO, toISO = todayISO()) {
  const from = new Date(String(fromISO || '').slice(0, 10));
  const to = new Date(toISO);
  if (Number.isNaN(from.getTime())) return 0;
  return Math.max(0, Math.floor((to - from) / 86400000));
}

function agingBucket(days) {
  if (days <= 30) return '0-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  return '90+';
}

function inDateRange(dateValue, startDate, endDate) {
  const d = String(dateValue || '').slice(0, 10);
  if (!d) return false;
  if (startDate && d < String(startDate).slice(0, 10)) return false;
  if (endDate && d > String(endDate).slice(0, 10)) return false;
  return true;
}

function normalizeMode(value) {
  const v = String(value || '').toUpperCase();
  if (v === 'BANK_TRANSFER' || v === 'BANK' || v === 'NEFT' || v === 'RTGS' || v === 'UPI') return 'BANK';
  if (v === 'CHEQUE' || v === 'CHECK') return 'CHEQUE';
  if (v === 'CARD' || v === 'MOBILE' || v === 'WALLET') return 'BANK';
  return 'CASH';
}

async function fetchAll(collectionName, cap = 3000) {
  const snap = await getDocs(query(col(collectionName), limit(cap)));
  return fromQuery(snap);
}

// Aging analysis over unpaid invoices. side: 'AR' (customers owe us) or
// 'AP' (we owe suppliers).
async function aging(side) {
  const isAR = side === 'AR';
  const collectionName = isAR ? SALES_INVOICES : PURCHASE_INVOICES;
  const all = await fetchAll(collectionName);
  const open = all.filter((inv) => Number(inv.balanceAmount) > 0);

  const rows = open.map((inv) => {
    const date = isAR
      ? String(inv.invoiceDate || inv.createdAt || '').slice(0, 10)
      : String(inv.purchaseDate || inv.invoiceDate || inv.createdAt || '').slice(0, 10);
    const days = daysBetween(date);
    const dueDate = String(inv.dueDate || '').slice(0, 10);
    return {
      id: inv.id,
      invoiceNo: inv.invoiceNo || '',
      date,
      partyId: isAR ? inv.customerId || '' : inv.supplierId || '',
      partyName: isAR ? inv.customerName || '' : inv.supplierName || '',
      grandTotal: round2(Number(inv.grandTotal) || 0),
      balance: round2(Number(inv.balanceAmount) || 0),
      paymentStatus: inv.paymentStatus || 'DUE',
      dueDate,
      overdue: !!dueDate && dueDate < todayISO() && Number(inv.balanceAmount) > 0,
      days,
      bucket: agingBucket(days),
    };
  });
  rows.sort((a, b) => b.days - a.days);

  const totals = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
  rows.forEach((r) => {
    totals[r.bucket] = round2((totals[r.bucket] || 0) + r.balance);
  });
  const totalBalance = round2(rows.reduce((s, r) => s + r.balance, 0));
  const overdueRows = rows.filter((r) => r.overdue);
  const overdueTotal = round2(overdueRows.reduce((s, r) => s + r.balance, 0));

  const partyMap = new Map();
  rows.forEach((r) => {
    const key = r.partyId || r.partyName || 'Unknown';
    const current = partyMap.get(key) || { partyId: r.partyId, partyName: r.partyName || 'Unknown', invoiceCount: 0, balance: 0 };
    current.invoiceCount += 1;
    current.balance = round2(current.balance + r.balance);
    partyMap.set(key, current);
  });
  const parties = Array.from(partyMap.values()).sort((a, b) => b.balance - a.balance);

  return {
    rows,
    parties,
    totals,
    totalBalance,
    totalInvoices: rows.length,
    overdueCount: overdueRows.length,
    overdueTotal,
  };
}

// Money movements across receipts, bill payments, expenses and vouchers.
function cashEntries(receipts, billPayments, expenses, vouchers) {
  const entries = [];
  receipts.forEach((r) =>
    entries.push({
      id: r.id,
      date: String(r.receiptDate || r.createdAt || '').slice(0, 10),
      type: 'RECEIPT',
      number: r.receiptNo || '',
      party: r.customerName || '',
      mode: normalizeMode(r.paymentMethod || r.paymentMode),
      description: r.invoiceNo ? `Receipt vs ${r.invoiceNo}` : r.note || 'Customer receipt',
      inflow: round2(Number(r.amount) || 0),
      outflow: 0,
      referenceNo: r.referenceNo || '',
      createdBy: r.createdBy || '',
    })
  );
  billPayments.forEach((p) =>
    entries.push({
      id: p.id,
      date: String(p.paymentDate || p.createdAt || '').slice(0, 10),
      type: 'BILL_PAYMENT',
      number: p.paymentNo || '',
      party: p.supplierName || '',
      mode: normalizeMode(p.paymentMethod || p.paymentMode),
      description: p.invoiceNo ? `Payment vs ${p.invoiceNo}` : p.note || 'Supplier payment',
      inflow: 0,
      outflow: round2(Number(p.amount) || 0),
      referenceNo: p.referenceNo || '',
      createdBy: p.createdBy || '',
    })
  );
  expenses.forEach((e) =>
    entries.push({
      id: e.id,
      date: String(e.expenseDate || e.createdAt || '').slice(0, 10),
      type: 'EXPENSE',
      number: e.expenseNo || '',
      party: e.category || '',
      mode: normalizeMode(e.paymentMode),
      description: e.description || e.note || 'Expense',
      inflow: 0,
      outflow: round2(Number(e.amount) || 0),
      referenceNo: e.referenceNo || '',
      createdBy: e.createdBy || '',
    })
  );
  vouchers.forEach((v) =>
    entries.push({
      id: v.id,
      date: String(v.voucherDate || v.createdAt || '').slice(0, 10),
      type: 'PAYMENT_VOUCHER',
      number: v.voucherNo || '',
      party: v.payee || '',
      mode: normalizeMode(v.paymentMode),
      description: v.category ? `${v.category}${v.description ? ' — ' + v.description : ''}` : v.description || 'Payment voucher',
      inflow: 0,
      outflow: round2(Number(v.amount) || 0),
      referenceNo: v.referenceNo || '',
      createdBy: v.createdBy || '',
    })
  );
  return entries;
}

async function fetchCashEntries() {
  const [receipts, payments, expenses, vouchers] = await Promise.all([
    fetchAll(RECEIPTS),
    fetchAll(PAYMENTS),
    fetchAll(EXPENSES),
    fetchAll(VOUCHERS),
  ]);
  return cashEntries(receipts, payments, expenses, vouchers);
}

export const financeService = {
  // ==================== ACCOUNTS RECEIVABLE / PAYABLE ====================

  async getReceivables() {
    return aging('AR');
  },

  async getPayables() {
    return aging('AP');
  },

  // ==================== EXPENSES ====================

  async getExpenses(page = 0, size = 20, search = '', filters = {}) {
    const term = (search || '').trim().toLowerCase();
    let list = await fetchAll(EXPENSES);
    if (term) {
      list = list.filter((e) =>
        [e.expenseNo, e.category, e.description, e.referenceNo, e.createdBy]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term))
      );
    }
    if (filters.category) list = list.filter((e) => e.category === filters.category);
    if (filters.paymentMode) list = list.filter((e) => normalizeMode(e.paymentMode) === filters.paymentMode);
    if (filters.startDate) list = list.filter((e) => inDateRange(e.expenseDate, filters.startDate, null));
    if (filters.endDate) list = list.filter((e) => inDateRange(e.expenseDate, null, filters.endDate));
    list.sort((a, b) => String(b.expenseDate || b.createdAt || '').localeCompare(String(a.expenseDate || a.createdAt || '')));
    const total = list.length;
    const start = page * size;
    return {
      content: list.slice(start, start + size),
      totalElements: total,
      totalPages: Math.max(1, Math.ceil(total / size)),
      number: page,
      size,
    };
  },

  async createExpense(data) {
    requireAuth();
    const amount = round2(Number(data.amount) || 0);
    if (amount <= 0) throw serviceError('Expense amount must be greater than zero', 400);
    if (!data.category) throw serviceError('Expense category is required', 400);
    try {
      return await runStockTransaction(async (tx) => {
        const ref = doc(db, EXPENSES);
        const expenseNo = await nextNumber(tx, 'EXP', data.expenseDate || todayISO());
        const payload = {
          expenseNo,
          expenseDate: data.expenseDate || todayISO(),
          category: data.category,
          description: data.description || '',
          amount,
          paymentMode: data.paymentMode || 'CASH',
          referenceNo: data.referenceNo || '',
          note: data.note || '',
          status: 'POSTED',
          createdBy: actorName(),
          createdAt: nowISO(),
          updatedAt: nowISO(),
          searchText: buildSearchText(expenseNo, data.category, data.description, data.referenceNo),
        };
        await tx.set(ref, payload);
        return { expenseNo, id: ref.id, ...payload };
      });
    } catch (e) {
      throw serviceError((e && e.message) || 'Could not create expense', 400);
    }
  },

  async deleteExpense(id) {
    requireAuth();
    try {
      await runStockTransaction(async (tx) => {
        tx.delete(docOf(EXPENSES, id));
      });
      return { id, deleted: true };
    } catch (e) {
      throw serviceError((e && e.message) || 'Could not delete expense', 400);
    }
  },

  // ==================== PAYMENT VOUCHERS ====================

  async getPaymentVouchers(page = 0, size = 20, search = '', filters = {}) {
    const term = (search || '').trim().toLowerCase();
    let list = await fetchAll(VOUCHERS);
    if (term) {
      list = list.filter((v) =>
        [v.voucherNo, v.payee, v.category, v.description, v.referenceNo, v.createdBy]
          .filter(Boolean)
          .some((x) => String(x).toLowerCase().includes(term))
      );
    }
    if (filters.paymentMode) list = list.filter((v) => normalizeMode(v.paymentMode) === filters.paymentMode);
    if (filters.startDate) list = list.filter((v) => inDateRange(v.voucherDate, filters.startDate, null));
    if (filters.endDate) list = list.filter((v) => inDateRange(v.voucherDate, null, filters.endDate));
    list.sort((a, b) => String(b.voucherDate || b.createdAt || '').localeCompare(String(a.voucherDate || a.createdAt || '')));
    const total = list.length;
    const start = page * size;
    return {
      content: list.slice(start, start + size),
      totalElements: total,
      totalPages: Math.max(1, Math.ceil(total / size)),
      number: page,
      size,
    };
  },

  async createPaymentVoucher(data) {
    requireAuth();
    const amount = round2(Number(data.amount) || 0);
    if (amount <= 0) throw serviceError('Voucher amount must be greater than zero', 400);
    if (!String(data.payee || '').trim()) throw serviceError('Payee is required', 400);
    try {
      return await runStockTransaction(async (tx) => {
        const ref = doc(db, VOUCHERS);
        const voucherNo = await nextNumber(tx, 'PV', data.voucherDate || todayISO());
        const payload = {
          voucherNo,
          voucherDate: data.voucherDate || todayISO(),
          payee: String(data.payee).trim(),
          category: data.category || '',
          description: data.description || '',
          amount,
          paymentMode: data.paymentMode || 'CASH',
          referenceNo: data.referenceNo || '',
          note: data.note || '',
          status: 'POSTED',
          createdBy: actorName(),
          createdAt: nowISO(),
          updatedAt: nowISO(),
          searchText: buildSearchText(voucherNo, data.payee, data.category, data.description),
        };
        await tx.set(ref, payload);
        return { voucherNo, id: ref.id, ...payload };
      });
    } catch (e) {
      throw serviceError((e && e.message) || 'Could not create payment voucher', 400);
    }
  },

  async deletePaymentVoucher(id) {
    requireAuth();
    try {
      await runStockTransaction(async (tx) => {
        tx.delete(docOf(VOUCHERS, id));
      });
      return { id, deleted: true };
    } catch (e) {
      throw serviceError((e && e.message) || 'Could not delete payment voucher', 400);
    }
  },

  // ==================== CASH & BANK BOOK ====================

  // Full history merged into one chronological book with a running balance.
  // Pagination happens after the balance is computed so each row shows the
  // true cumulative position.
  async getCashbook(page = 0, size = 50, search = '', filters = {}) {
    let entries = await fetchCashEntries();

    if (filters.paymentMode) {
      entries = entries.filter((e) => e.mode === filters.paymentMode);
    }
    if (filters.startDate) {
      entries = entries.filter((e) => e.date >= String(filters.startDate).slice(0, 10));
    }
    if (filters.endDate) {
      entries = entries.filter((e) => e.date <= String(filters.endDate).slice(0, 10));
    }
    const term = (search || '').trim().toLowerCase();
    if (term) {
      entries = entries.filter((e) =>
        [e.number, e.party, e.description, e.referenceNo, e.createdBy]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term))
      );
    }

    entries.sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.number).localeCompare(String(b.number)));

    let running = 0;
    const byMode = { CASH: 0, BANK: 0, CHEQUE: 0 };
    entries.forEach((e) => {
      running = round2(running + e.inflow - e.outflow);
      e.balance = running;
      byMode[e.mode] = round2((byMode[e.mode] || 0) + e.inflow - e.outflow);
    });

    const totalIn = round2(entries.reduce((s, e) => s + e.inflow, 0));
    const totalOut = round2(entries.reduce((s, e) => s + e.outflow, 0));
    const total = entries.length;
    const start = page * size;

    return {
      content: entries.slice(start, start + size),
      totalElements: total,
      totalPages: Math.max(1, Math.ceil(total / size)),
      number: page,
      size,
      summary: { totalIn, totalOut, balance: round2(totalIn - totalOut), byMode },
    };
  },

  // ==================== FINANCIAL SUMMARY ====================

  async getFinancialSummary(filters = {}) {
    const startDate = filters.startDate || '';
    const endDate = filters.endDate || '';

    const [salesInv, purchaseInv, cash] = await Promise.all([
      fetchAll(SALES_INVOICES),
      fetchAll(PURCHASE_INVOICES),
      this.getCashbook(0, 1, '', {}),
    ]);

    const receivable = salesInv.filter((inv) => Number(inv.balanceAmount) > 0);
    const payable = purchaseInv.filter((inv) => Number(inv.balanceAmount) > 0);

    const totalReceivables = round2(receivable.reduce((s, inv) => s + Number(inv.balanceAmount || 0), 0));
    const totalPayables = round2(payable.reduce((s, inv) => s + Number(inv.balanceAmount || 0), 0));

    const overdueReceivable = receivable.filter(
      (inv) => String(inv.dueDate || '').slice(0, 10) && String(inv.dueDate).slice(0, 10) < todayISO()
    );
    const overdueReceivables = round2(overdueReceivable.reduce((s, inv) => s + Number(inv.balanceAmount || 0), 0));

    const periodSales = round2(
      salesInv
        .filter((inv) => inDateRange(inv.invoiceDate, startDate, endDate))
        .reduce((s, inv) => s + (Number(inv.grandTotal) || 0), 0)
    );
    const periodPurchases = round2(
      purchaseInv
        .filter((inv) => inDateRange(inv.purchaseDate || inv.invoiceDate, startDate, endDate))
        .reduce((s, inv) => s + (Number(inv.grandTotal) || 0), 0)
    );

    // Expense + cashflow figures for the selected period.
    const expenses = await fetchAll(EXPENSES);
    const expenseTotal = round2(
      expenses
        .filter((e) => inDateRange(e.expenseDate, startDate, endDate))
        .reduce((s, e) => s + (Number(e.amount) || 0), 0)
    );
    const vouchers = await fetchAll(VOUCHERS);
    const voucherTotal = round2(
      vouchers
        .filter((v) => inDateRange(v.voucherDate, startDate, endDate))
        .reduce((s, v) => s + (Number(v.amount) || 0), 0)
    );
    const receipts = await fetchAll(RECEIPTS);
    const moneyIn = round2(
      receipts
        .filter((r) => inDateRange(r.receiptDate, startDate, endDate))
        .reduce((s, r) => s + (Number(r.amount) || 0), 0)
    );
    const billPayments = await fetchAll(PAYMENTS);
    const moneyOut = round2(
      billPayments
        .filter((p) => inDateRange(p.paymentDate, startDate, endDate))
        .reduce((s, p) => s + (Number(p.amount) || 0), 0)
    );

    const netPosition = round2(periodSales - periodPurchases - expenseTotal - voucherTotal);

    return {
      totalReceivables,
      totalPayables,
      netPosition,
      openInvoices: { receivable: receivable.length, payable: payable.length },
      overdueReceivables,
      overdueCount: overdueReceivable.length,
      cashBalance: cash.summary ? cash.summary.balance : 0,
      cashByMode: cash.summary ? cash.summary.byMode : { CASH: 0, BANK: 0, CHEQUE: 0 },
      period: {
        startDate,
        endDate,
        sales: periodSales,
        purchases: periodPurchases,
        expenses: expenseTotal,
        vouchers: voucherTotal,
        moneyIn,
        moneyOut,
        net: netPosition,
      },
    };
  },

  // ==================== EXPORTS ====================

  async exportExpenses(filters = {}) {
    const { content } = await this.getExpenses(0, 5000, filters.search || '', filters);
    const headers = ['expenseNo', 'expenseDate', 'category', 'description', 'amount', 'paymentMode', 'referenceNo', 'createdBy'];
    const csv = toCsv(content, headers);
    downloadCsv(csv, `expenses-${todayISO()}.csv`);
    return csv;
  },

  async exportVouchers(filters = {}) {
    const { content } = await this.getPaymentVouchers(0, 5000, filters.search || '', filters);
    const headers = ['voucherNo', 'voucherDate', 'payee', 'category', 'description', 'amount', 'paymentMode', 'referenceNo', 'createdBy'];
    const csv = toCsv(content, headers);
    downloadCsv(csv, `payment-vouchers-${todayISO()}.csv`);
    return csv;
  },

  async exportCashbook(filters = {}) {
    const { content, summary } = await this.getCashbook(0, 10000, filters.search || '', filters);
    const headers = ['date', 'type', 'number', 'party', 'mode', 'description', 'inflow', 'outflow', 'balance', 'referenceNo', 'createdBy'];
    const csv = toCsv(content, headers);
    downloadCsv(csv, `cashbook-${todayISO()}.csv`);
    return { csv, summary };
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

export default financeService;
