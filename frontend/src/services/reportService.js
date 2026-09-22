// src/services/reportService.js
//
// Firestore-backed reports. There is no server: every report is computed from
// the Firestore collections. Exports are produced client-side as CSV files
// (Excel) and the same CSV is used for "PDF" so the UI keeps working without a
// backend. Keep the exact method names the report components call.

import { getDocs as _getDocs } from '@firebase/firestore';
import {
  col,
  serviceError,
  requireAuth,
} from './firestoreHelpers';
import {
  round2,
  todayKey,
} from './businessLogic';
import { db } from '../firebase/firebase';
import { firebaseSetupMessage } from '../firebase/config';

function ensureDb() {
  if (!db) throw serviceError(firebaseSetupMessage(), 500);
}

function inDateRange(value, startDate, endDate) {
  const key = value ? String(value).slice(0, 10) : '';
  if (!key) return false;
  if (startDate && key < String(startDate).slice(0, 10)) return false;
  if (endDate && key > String(endDate).slice(0, 10)) return false;
  return true;
}

function filterIds(value, allowed) {
  if (!value) return true;
  if (!allowed || allowed.length === 0) return true;
  return allowed.includes(String(value));
}

async function fetchAll(collectionName) {
  ensureDb();
  const snap = await _getDocs(col(collectionName));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
}

async function itemMasterMap(itemIds, brandIds, groupIds) {
  let items = await fetchAll('items');
  items = items.filter((item) => filterIds(item.id, itemIds));
  items = items.filter((item) => filterIds(item.brandId, brandIds));
  items = items.filter((item) => filterIds(item.groupId, groupIds));
  return items;
}

export const reportService = {
  // ==================== SALES REPORTS ====================

  async getSalesReport(filters = {}) {
    requireAuth();
    const all = await fetchAll('salesInvoices');
    const rows = all
      .filter((inv) => inDateRange(inv.invoiceDate, filters.startDate, filters.endDate))
      .filter((inv) => filterIds(inv.customerId, filters.customerIds))
      .map((inv) => ({
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        invoiceDate: (inv.invoiceDate || '').slice(0, 10),
        customerName: inv.customerName,
        totalAmount: round2(inv.subtotal || 0),
        discountAmount: round2(inv.discountTotal || 0),
        taxAmount: round2(inv.taxTotal || 0),
        netAmount: round2(inv.grandTotal || 0),
        status: inv.paymentStatus || 'DUE',
        paymentType: inv.paymentType,
        balanceAmount: round2(inv.balanceAmount || 0),
      }));
    const netTotal = rows.reduce((s, r) => s + r.netAmount, 0);
    const summary = {
      totalSales: round2(netTotal),
      totalInvoices: rows.length,
      totalCustomers: new Set(rows.map((r) => r.customerName)).size,
      averageInvoice: rows.length ? round2(netTotal / rows.length) : 0,
    };
    rows.sort((a, b) => String(b.invoiceDate).localeCompare(String(a.invoiceDate)));
    return { content: rows, summary };
  },

  async getSalesDetailsReport(filters = {}) {
    requireAuth();
    const all = await fetchAll('salesInvoices');
    const items = await itemMasterMap(filters.itemIds, filters.brandIds, filters.groupIds);
    const itemById = new Map(items.map((i) => [String(i.id), i]));
    const visiedItems = new Set();
    const rows = [];
    for (const inv of all) {
      if (!inDateRange(inv.invoiceDate, filters.startDate, filters.endDate)) continue;
      if (!filterIds(inv.customerId, filters.customerIds)) continue;
      for (const line of inv.items || []) {
        if (!filterIds(line.itemId, filters.itemIds)) continue;
        const master = itemById.get(String(line.itemId)) || {};
        if (master.id && filters.itemIds) {
          if (!filters.itemIds.includes(String(line.itemId))) continue;
        }
        if (!master.id && filters.itemIds && filters.itemIds.length) continue;
        rows.push({
          invoiceNo: inv.invoiceNo,
          invoiceDate: (inv.invoiceDate || '').slice(0, 10),
          customerName: inv.customerName,
          itemName: line.itemName || master.name,
          itemCode: line.itemCode || master.itemCode,
          brandName: master.brandName || '',
          groupName: master.groupName || '',
          quantity: line.quantity,
          unitPrice: round2(line.unitPrice || 0),
          totalAmount: round2(line.totalAmount || 0),
        });
        visiedItems.add(String(line.itemId));
      }
    }
    const total = rows.reduce((s, r) => s + r.totalAmount, 0);
    const summary = {
      totalSales: round2(total),
      totalItems: rows.length,
      uniqueProducts: visiedItems.size,
    };
    return { content: rows, summary };
  },

  async exportSalesReport(filters = {}) {
    const { content } = await this.getSalesReport(filters);
    return downloadCsv(reportToCsv(content, ['invoiceNo', 'invoiceDate', 'customerName', 'totalAmount', 'discountAmount', 'taxAmount', 'netAmount', 'status']), `sales-report-${todayKey()}.csv`);
  },

  async exportSalesReportPDF(filters = {}) {
    return this.exportSalesReport(filters);
  },

  async getSalesSummary() {
    const all = await fetchAll('salesInvoices');
    const total = all.reduce((s, inv) => s + (inv.grandTotal || 0), 0);
    const totalInvoices = all.length;
    return { totalSales: round2(total), totalInvoices, averageInvoice: totalInvoices ? round2(total / totalInvoices) : 0 };
  },

  // ==================== PURCHASE REPORTS ====================

  async getPurchaseReport(filters = {}) {
    requireAuth();
    const all = await fetchAll('purchaseInvoices');
    const rows = all
      .filter((inv) => inDateRange(inv.purchaseDate, filters.startDate, filters.endDate))
      .filter((inv) => filterIds(inv.supplierId, filters.supplierIds))
      .map((inv) => ({
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        invoiceDate: (inv.purchaseDate || '').slice(0, 10),
        supplierName: inv.supplierName,
        totalAmount: round2(inv.subtotal || 0),
        discountAmount: round2(inv.discountTotal || 0),
        taxAmount: round2(inv.taxTotal || 0),
        netAmount: round2(inv.grandTotal || 0),
        paymentType: inv.paymentType,
        balanceAmount: round2(inv.balanceAmount || 0),
      }));
    const netTotal = rows.reduce((s, r) => s + r.netAmount, 0);
    const summary = {
      totalPurchases: round2(netTotal),
      totalInvoices: rows.length,
      totalSuppliers: new Set(rows.map((r) => r.supplierName)).size,
      averageInvoice: rows.length ? round2(netTotal / rows.length) : 0,
    };
    rows.sort((a, b) => String(b.invoiceDate).localeCompare(String(a.invoiceDate)));
    return { content: rows, summary };
  },

  async getPurchaseDetailsReport(filters = {}) {
    requireAuth();
    const all = await fetchAll('purchaseInvoices');
    const items = await itemMasterMap(filters.itemIds, filters.brandIds, filters.groupIds);
    const itemById = new Map(items.map((i) => [String(i.id), i]));
    const visiedItems = new Set();
    const rows = [];
    for (const inv of all) {
      if (!inDateRange(inv.purchaseDate, filters.startDate, filters.endDate)) continue;
      if (!filterIds(inv.supplierId, filters.supplierIds)) continue;
      for (const line of inv.items || []) {
        const master = itemById.get(String(line.itemId)) || {};
        if (!master.id && filters.itemIds && filters.itemIds.length) continue;
        rows.push({
          invoiceNo: inv.invoiceNo,
          invoiceDate: (inv.purchaseDate || '').slice(0, 10),
          supplierName: inv.supplierName,
          itemName: line.itemName || master.name,
          itemCode: line.itemCode || master.itemCode,
          brandName: master.brandName || '',
          groupName: master.groupName || '',
          quantity: line.quantity,
          unitPrice: round2(line.unitPrice || 0),
          totalAmount: round2(line.totalAmount || 0),
        });
        visiedItems.add(String(line.itemId));
      }
    }
    const total = rows.reduce((s, r) => s + r.totalAmount, 0);
    const summary = {
      totalPurchases: round2(total),
      totalItems: rows.length,
      uniqueProducts: visiedItems.size,
    };
    return { content: rows, summary };
  },

  async exportPurchaseReport(filters = {}) {
    const { content } = await this.getPurchaseReport(filters);
    return downloadCsv(reportToCsv(content, ['invoiceNo', 'invoiceDate', 'supplierName', 'totalAmount', 'discountAmount', 'taxAmount', 'netAmount', 'paymentType']), `purchase-report-${todayKey()}.csv`);
  },

  async exportPurchaseReportPDF(filters = {}) {
    return this.exportPurchaseReport(filters);
  },

  // ==================== STOCK REPORTS ====================

  async getStockReport(filters = {}) {
    requireAuth();
    const items = await itemMasterMap(filters.itemIds, filters.brandIds, filters.groupIds);
    const journals = await fetchAll('stockTransactions');

    const rows = items.map((item) => {
      const itemJournals = journals.filter((j) => String(j.itemId) === String(item.id));
      const inRange = itemJournals.filter((j) => inDateRange(j.transactionDate, filters.startDate, filters.endDate));
      const after = itemJournals.filter((j) => {
        const key = String(j.transactionDate || '').slice(0, 10);
        return filters.endDate && key > String(filters.endDate).slice(0, 10);
      });
      const netInRange = inRange.reduce((s, j) => s + (Number(j.quantity) * (Number(j.sign) === -1 ? -1 : 1)), 0);
      const netAfter = after.reduce((s, j) => s + (Number(j.quantity) * (Number(j.sign) === -1 ? -1 : 1)), 0);
      const currentStock = Number(item.currentStock) || 0;
      const closing = round2(currentStock - netAfter);
      const opening = round2(closing - netInRange);
      const purchases = round2(inRange.filter((j) => Number(j.sign) === 1).reduce((s, j) => s + Number(j.quantity), 0));
      const sales = round2(inRange.filter((j) => Number(j.sign) === -1).reduce((s, j) => s + Number(j.quantity), 0));
      return {
        id: item.id,
        itemCode: item.itemCode,
        itemName: item.name,
        brandName: item.brandName || '',
        groupName: item.groupName || '',
        openingStock: opening,
        purchases,
        sales,
        closingStock: closing,
        stockStatus: closing <= 0 ? 'OUT_OF_STOCK' : closing <= (Number(item.minStock) || 0) ? 'CRITICAL' : 'LOW',
        additionalFields: {
          openingStock: opening,
          purchases,
          sales,
          closingStock: closing,
          minStockLevel: Number(item.minStock) || 0,
          maxStockLevel: Number(item.maxStock) || 0,
          brand: item.brandName || '',
          group: item.groupName || '',
        },
        minStockLevel: Number(item.minStock) || 0,
        currentStock,
      };
    });

    let stockValue = 0;
    for (const row of rows) {
      const item = items.find((i) => i.id === row.id);
      stockValue += (Number(row.closingStock) || 0) * (Number(item && item.purchasePrice) || Number(item && item.sellingPrice) || 0);
    }
    const lowStock = rows.filter((r) => {
      const min = Number(r.minStockLevel) || 0;
      return min > 0 && r.closingStock <= min;
    }).length;
    const outOfStock = rows.filter((r) => r.closingStock <= 0).length;

    const summary = {
      totalItems: rows.length,
      totalStockValue: round2(stockValue),
      lowStockItems: lowStock,
      outOfStock,
    };
    rows.sort((a, b) => String(a.itemName).localeCompare(String(b.itemName)));
    return { content: rows, summary };
  },

  async getStockSummary() {
    const items = await fetchAll('items');
    let stockValue = 0;
    let lowStock = 0;
    let outOfStock = 0;
    for (const item of items) {
      const stock = Number(item.currentStock) || 0;
      const min = Number(item.minStock) || 0;
      if (stock <= 0) outOfStock += 1;
      if (min > 0 && stock <= min) lowStock += 1;
      stockValue += stock * (Number(item.purchasePrice) || Number(item.sellingPrice) || 0);
    }
    return { totalItems: items.length, totalStockValue: round2(stockValue), lowStockItems: lowStock, outOfStock };
  },

  async exportStockReport(filters = {}) {
    const { content } = await this.getStockReport(filters);
    return downloadCsv(reportToCsv(content, ['itemCode', 'itemName', 'brandName', 'groupName', 'openingStock', 'purchases', 'sales', 'closingStock']), `stock-report-${todayKey()}.csv`);
  },

  async exportStockReportPDF(filters = {}) {
    return this.exportStockReport(filters);
  },

  // ==================== CUSTOMER RECEIPTS ====================

  async getCustomerReceipts(filters = {}) {
    requireAuth();
    const all = await fetchAll('billReceipts');
    const rows = all
      .filter((r) => inDateRange(r.receiptDate, filters.startDate, filters.endDate))
      .map((r) => ({
        receiptNo: r.receiptNo,
        receiptDate: (r.receiptDate || '').slice(0, 10),
        customerName: r.customerName,
        invoiceNo: r.invoiceNo || '',
        amount: round2(r.amount || 0),
        paymentMode: r.paymentMethod || r.paymentMode || 'CASH',
      }));
    const total = rows.reduce((s, r) => s + r.amount, 0);
    const summary = {
      totalReceipts: rows.length,
      totalAmount: round2(total),
      averageAmount: rows.length ? round2(total / rows.length) : 0,
    };
    rows.sort((a, b) => String(b.receiptDate).localeCompare(String(a.receiptDate)));
    return { content: rows, summary };
  },

  async exportCustomerReceipts(filters = {}) {
    const { content } = await this.getCustomerReceipts(filters);
    return downloadCsv(reportToCsv(content, ['receiptNo', 'receiptDate', 'customerName', 'invoiceNo', 'amount', 'paymentMode']), `customer-receipts-${todayKey()}.csv`);
  },

  async exportCustomerReceiptsPDF(filters = {}) {
    return this.exportCustomerReceipts(filters);
  },

  // ==================== SUPPLIER PAYMENTS ====================

  async getSupplierPayments(filters = {}) {
    requireAuth();
    const all = await fetchAll('billPayments');
    const rows = all
      .filter((r) => inDateRange(r.paymentDate, filters.startDate, filters.endDate))
      .map((r) => ({
        paymentNo: r.paymentNo,
        paymentDate: (r.paymentDate || '').slice(0, 10),
        supplierName: r.supplierName,
        invoiceNo: r.invoiceNo || '',
        amount: round2(r.amount || 0),
        paymentMode: r.paymentMethod || r.paymentMode || 'BANK_TRANSFER',
      }));
    const total = rows.reduce((s, r) => s + r.amount, 0);
    const summary = {
      totalPayments: rows.length,
      totalAmount: round2(total),
      averageAmount: rows.length ? round2(total / rows.length) : 0,
    };
    rows.sort((a, b) => String(b.paymentDate).localeCompare(String(a.paymentDate)));
    return { content: rows, summary };
  },

  async exportSupplierPayments(filters = {}) {
    const { content } = await this.getSupplierPayments(filters);
    return downloadCsv(reportToCsv(content, ['paymentNo', 'paymentDate', 'supplierName', 'invoiceNo', 'amount', 'paymentMode']), `supplier-payments-${todayKey()}.csv`);
  },

  async exportSupplierPaymentsPDF(filters = {}) {
    return this.exportSupplierPayments(filters);
  },

  // ==================== GENERIC EXPORT ====================

  async exportToExcel(endpoint, filters, filename) {
    const rows = await this._exportRows(endpoint, filters);
    return downloadCsv(reportToCsv(rows, rows[0] ? Object.keys(rows[0]) : []), `${filename}-${todayKey()}.csv`);
  },

  async exportToPDF(endpoint, filters, filename) {
    return this.exportToExcel(endpoint, filters, filename);
  },

  async _exportRows(endpoint, filters) {
    const key = String(endpoint || '').toLowerCase();
    if (key.includes('sales')) {
      const { content } = await this.getSalesReport(filters);
      return content.map((r) => ({ ...r, paymentType: r.paymentType || '' }));
    }
    if (key.includes('purchase')) {
      const { content } = await this.getPurchaseReport(filters);
      return content;
    }
    if (key.includes('stock')) {
      const { content } = await this.getStockReport(filters);
      return content;
    }
    if (key.includes('receipt')) {
      const { content } = await this.getCustomerReceipts(filters);
      return content;
    }
    if (key.includes('payment')) {
      const { content } = await this.getSupplierPayments(filters);
      return content;
    }
    return [];
  },
};

function reportToCsv(rows, keys) {
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    return /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
  };
  if (!rows.length) return keys.join(',');
  return [keys.join(','), ...rows.map((row) => keys.map((k) => escape(row[k])).join(','))].join('\n');
}

function downloadCsv(csv, filename) {
  if (typeof window === 'undefined') return csv;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  return csv;
}

export default reportService;