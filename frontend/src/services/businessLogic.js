// src/services/businessLogic.js
//
// Pure business logic extracted from the legacy Spring Boot implementation so
// that totals, stock movements and role checks are deterministic and unit
// testable without a live database.

// ---------------------------------------------------------------------------
// Numbers & money
// ---------------------------------------------------------------------------

export function round2(n) {
  const value = Number(n) || 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function asNumber(n) {
  return Number(n) || 0;
}

export function lineAmount(quantity, unitPrice) {
  return round2(asNumber(quantity) * asNumber(unitPrice));
}

// Matches backend SalesInvoiceItem / PurchaseInvoiceItem formula:
//   line  = qty * price
//   disc  = line * disc% / 100
//   tax   = (line - disc) * tax% / 100
export function lineAmounts(quantity, unitPrice, discountPercent, taxPercent) {
  const total = lineAmount(quantity, unitPrice);
  const discount = round2((total * asNumber(discountPercent)) / 100);
  const tax = round2(((total - discount) * asNumber(taxPercent)) / 100);
  return { totalAmount: total, discountAmount: discount, taxAmount: tax, lineNet: round2(total - discount + tax) };
}

export function invoiceTotals(lines) {
  let total = 0;
  let discount = 0;
  let tax = 0;
  (lines || []).forEach((line) => {
    const amounts = lineAmounts(line.quantity, line.unitPrice, line.discountPercent, line.taxPercent);
    total += amounts.totalAmount;
    discount += amounts.discountAmount;
    tax += amounts.taxAmount;
  });
  total = round2(total);
  discount = round2(discount);
  tax = round2(tax);
  return { totalAmount: total, discountAmount: discount, taxAmount: tax, netAmount: round2(total - discount + tax) };
}

// CASH / CARD / UPI are treated as fully collected; CREDIT carries a balance.
export function computePayment(paymentType, netAmount) {
  const net = round2(asNumber(netAmount));
  if (paymentType === 'CREDIT') {
    return { paidAmount: 0, balanceAmount: net };
  }
  return { paidAmount: net, balanceAmount: 0 };
}

// ---------------------------------------------------------------------------
// Stock movement
// ---------------------------------------------------------------------------

// Mirrors StockService direction:
//   PURCHASE / RETURN_IN  -> add
//   SALES    / RETURN_OUT -> subtract
//   ADJUSTMENT            -> set exact quantity
// Returns { quantity (store the signed quantity for the journal), previousStock, newStock }.
export function applyStock(previousStock, transactionType, qty) {
  const prev = asNumber(previousStock);
  const q = asNumber(qty);
  switch (transactionType) {
    case 'PURCHASE':
    case 'RETURN_IN':
      return { quantity: q, previousStock: prev, newStock: round2(prev + q) };
    case 'SALES':
    case 'RETURN_OUT': {
      const newStock = round2(prev - q);
      if (newStock < 0) {
        const err = new Error(`Insufficient stock. Available: ${prev}`);
        err.code = 'INSUFFICIENT_STOCK';
        throw err;
      }
      return { quantity: -q, previousStock: prev, newStock };
    }
    case 'ADJUSTMENT': {
      if (q < 0) {
        const err = new Error('Stock cannot be negative');
        err.code = 'INSUFFICIENT_STOCK';
        throw err;
      }
      return { quantity: q, previousStock: prev, newStock: round2(q) };
    }
    default: {
      const err = new Error(`Unknown stock transaction type: ${transactionType}`);
      err.code = 'INVALID_TRANSACTION_TYPE';
      throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// Stock status classification (matches StockReport.jsx client-side logic)
// ---------------------------------------------------------------------------

export function classifyStock(currentStock, minStockLevel, maxStockLevel) {
  const current = asNumber(currentStock);
  const min = asNumber(minStockLevel);
  const max = asNumber(maxStockLevel);
  if (current <= 0) return 'OUT_OF_STOCK';
  if (min > 0 && current <= min) return 'CRITICAL';
  if (min > 0 && current <= min * 2) return 'LOW';
  if (max > 0 && current >= max) return 'OVER';
  return 'IN_STOCK';
}

export function isLowStock(item) {
  const status = classifyStock(item.currentStock, item.minStockLevel, item.maxStockLevel);
  return status === 'LOW' || status === 'CRITICAL' || status === 'OUT_OF_STOCK';
}

export function isOutOfStock(item) {
  return classifyStock(item.currentStock, item.minStockLevel, item.maxStockLevel) === 'OUT_OF_STOCK';
}

export function stockValue(item) {
  return round2(asNumber(item.currentStock) * asNumber(item.purchasePrice));
}

// ---------------------------------------------------------------------------
// Searching
// ---------------------------------------------------------------------------

// Firestore prefix-range search token (lowercased, trimmed).
export function buildSearchText(...parts) {
  return (parts || [])
    .filter((p) => p !== null && p !== undefined && String(p).trim() !== '')
    .map((p) => String(p).trim().toLowerCase())
    .join(' ')
    .replace(/\s+/g, ' ');
}

export function searchRange(search) {
  const term = String(search || '').trim().toLowerCase();
  if (!term) return null;
  return { start: term, end: term + '\uf8ff' };
}

// ---------------------------------------------------------------------------
// Business document numbers (INV-20240101-000001, PO-... etc.)
// ---------------------------------------------------------------------------

export function pad6(n) {
  return String(n).padStart(6, '0');
}

export function formatBusinessNumber(prefix, dateString, sequence) {
  const date = dateString && dateString.replace(/-/g, '');
  return `${prefix}-${date}-${pad6(sequence)}`;
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

export function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function nowISO() {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Roles & permissions (mirrors backend @PreAuthorize rules)
// ---------------------------------------------------------------------------

export const ROLES = {
  ADMIN: 'ADMIN',
  BILLING_CLERK: 'BILLING_CLERK',
  ACCOUNTS: 'ACCOUNTS',
  PURCHASE_MANAGER: 'PURCHASE_MANAGER',
  STORE_MANAGER: 'STORE_MANAGER',
  STAFF: 'STAFF',
};

export const DEFAULT_SELF_REGISTERED_ROLE = ROLES.STAFF;

export const can = {
  manageItems: (role) => role === ROLES.ADMIN || role === ROLES.STORE_MANAGER,
  deleteItems: (role) => role === ROLES.ADMIN,
  manageCustomers: (role) => role === ROLES.ADMIN || role === ROLES.BILLING_CLERK,
  deleteCustomers: (role) => role === ROLES.ADMIN,
  manageSuppliers: (role) => role === ROLES.ADMIN || role === ROLES.PURCHASE_MANAGER,
  deleteSuppliers: (role) => role === ROLES.ADMIN,
  manageSales: (role) => role === ROLES.ADMIN || role === ROLES.BILLING_CLERK,
  deleteSales: (role) => role === ROLES.ADMIN,
  managePurchases: (role) => role === ROLES.ADMIN || role === ROLES.PURCHASE_MANAGER,
  deletePurchases: (role) => role === ROLES.ADMIN,
  manageAccounts: (role) => role === ROLES.ADMIN || role === ROLES.ACCOUNTS,
  manageUsers: (role) => role === ROLES.ADMIN,
};

// ---------------------------------------------------------------------------
// Pagination (emulates Spring Page so existing components keep working)
// ---------------------------------------------------------------------------

export function pageResponse(content, page = 0, size = 20, totalElements = content.length) {
  const total = Number(totalElements) || 0;
  const totalPages = size > 0 ? Math.ceil(total / size) : total > 0 ? 1 : 0;
  return {
    content,
    pageable: {
      pageNumber: page,
      pageSize: size,
      offset: page * size,
      paged: true,
      unpaged: false,
    },
    totalElements: total,
    totalPages,
    last: page >= Math.max(totalPages - 1, 0),
    first: page === 0,
    numberOfElements: content.length,
    size,
    number: page,
    sort: { sorted: true, unsorted: false, empty: false },
    empty: content.length === 0,
  };
}

export function slicePage(list, page = 0, size = 20) {
  const start = Math.max(0, Number(page) || 0) * (Number(size) || 20);
  return (list || []).slice(start, start + (Number(size) || 20));
}

export function sortByCreatedDesc(list) {
  return [...(list || [])].sort((a, b) => {
    const aT = a && a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bT = b && b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bT - aT;
  });
}

export function filterBySearch(list, search) {
  const range = searchRange(search);
  if (!range) return list || [];
  return (list || []).filter((item) => {
    const text = item && item.searchText ? String(item.searchText) : '';
    return text >= range.start && text <= range.end;
  });
}

export function toDateKey(dateString) {
  return dateString ? String(dateString).slice(0, 10) : todayISO();
}