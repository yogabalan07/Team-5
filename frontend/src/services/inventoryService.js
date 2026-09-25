// src/services/inventoryService.js
// Inventory views: current stock overview, stock ledger and transaction-safe
// stock adjustments (opening stock, damaged, expired, count differences).

import { getDocs, query, where, limit } from '@firebase/firestore';
import {
  col,
  docOf,
  getByIdOr404,
  getPaged,
  serviceError,
  requireAuth,
  fromQuery,
} from './firestoreHelpers';
import { todayISO, nowISO } from './businessLogic';
import { getCurrentUser } from './authService';
import {
  runStockTransaction,
  applyStockLine,
  TYPE_STOCK_IN,
  TYPE_STOCK_OUT,
  TYPE_ADJUSTMENT,
} from './inventoryOps';

const ITEMS = 'items';
const LEDGER = 'stockTransactions';

// Reason buckets used by the adjustment UI. Each maps to a ledger semantic:
//   COUNT / OPENING / FOUND  -> absolute or additive increase
//   DAMAGED / EXPIRED / LOST -> guarded decrease
export const ADJUSTMENT_REASONS = [
  { code: 'OPENING_STOCK', label: 'Opening Stock', mode: 'SET' },
  { code: 'COUNT_DIFFERENCE', label: 'Physical Count Difference', mode: 'SET' },
  { code: 'FOUND_STOCK', label: 'Found / Added Stock', mode: 'IN' },
  { code: 'DAMAGED', label: 'Damaged Stock', mode: 'OUT' },
  { code: 'EXPIRED', label: 'Expired Stock', mode: 'OUT' },
  { code: 'LOST', label: 'Lost / Write-off', mode: 'OUT' },
  { code: 'SAMPLE', label: 'Sample / Usage', mode: 'OUT' },
];

function actorName() {
  const user = getCurrentUser();
  return (user && (user.username || user.email)) || 'unknown';
}

export const inventoryService = {
  // Current stock snapshot across the catalogue with reorder flags.
  async getCurrentStock(page = 0, size = 20, search = '') {
    return getPaged(col(ITEMS), { page, size, search });
  },

  // Low/out-of-stock items driven by the flags maintained inside every
  // stock transaction (no full-collection scans).
  async getReorderAlerts(page = 0, size = 50, search = '') {
    const [lowSnap, outSnap] = await Promise.all([
      getDocs(query(col(ITEMS), where('isLowStock', '==', true), limit(1000))),
      getDocs(query(col(ITEMS), where('isOutOfStock', '==', true), limit(1000))),
    ]);
    const byId = new Map();
    [...fromQuery(lowSnap), ...fromQuery(outSnap)].forEach((d) => byId.set(d.id, d));
    let items = Array.from(byId.values());
    const term = (search || '').trim().toLowerCase();
    if (term) {
      items = items.filter((d) =>
        [d.name, d.itemCode, d.sku].filter(Boolean).some((v) => String(v).toLowerCase().includes(term))
      );
    }
    items.sort((a, b) => (Number(a.currentStock) || 0) - (Number(b.currentStock) || 0));
    const total = items.length;
    const start = page * size;
    return {
      content: items.slice(start, start + size),
      totalElements: total,
      totalPages: Math.max(1, Math.ceil(total / size)),
      number: page,
      size,
    };
  },

  // Stock ledger with optional type / date filters. Filters run client-side
  // over a bounded fetch, matching the existing Spark-friendly query style.
  async getLedger(page = 0, size = 20, search = '', filters = {}) {
    const range = (search || '').trim();
    let q;
    if (filters.type) {
      q = query(col(LEDGER), where('type', '==', filters.type), limit(2000));
    } else {
      q = query(col(LEDGER), limit(2000));
    }
    const snap = await getDocs(q);
    let items = fromQuery(snap);

    if (range) {
      const term = range.toLowerCase();
      items = items.filter((d) =>
        [d.itemName, d.itemCode, d.referenceNumber, d.createdBy, d.reason]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term))
      );
    }
    if (filters.itemId) {
      items = items.filter((d) => String(d.itemId) === String(filters.itemId));
    }
    if (filters.startDate) {
      const start = String(filters.startDate).slice(0, 10);
      items = items.filter((d) => String(d.transactionKey || '').slice(0, 10) >= start);
    }
    if (filters.endDate) {
      const end = String(filters.endDate).slice(0, 10);
      items = items.filter((d) => String(d.transactionKey || '').slice(0, 10) <= end);
    }

    items.sort((a, b) => {
      const aT = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bT = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bT - aT;
    });

    const total = items.length;
    const startIdx = page * size;
    return {
      content: items.slice(startIdx, startIdx + size),
      totalElements: total,
      totalPages: Math.max(1, Math.ceil(total / size)),
      number: page,
      size,
    };
  },

  // Atomic stock adjustment. The item update and the ledger journal entry are
  // committed in ONE transaction so the ledger can never drift from stock.
  async adjustStock({ itemId, reasonCode, quantity, note = '', referenceNumber = '' }) {
    requireAuth();
    const reasonDef = ADJUSTMENT_REASONS.find((r) => r.code === reasonCode);
    if (!reasonDef) throw serviceError('Invalid adjustment reason', 400);
    const target = Number(quantity);
    if (Number.isNaN(target) || target < 0) {
      throw serviceError('Quantity must be a number greater than or equal to zero', 400);
    }

    try {
      return await runStockTransaction(async (tx) => {
        const itemRef = docOf(ITEMS, String(itemId));
        const snap = await tx.get(itemRef);
        if (!snap.exists()) throw serviceError('Item not found', 404);
        const current = Number(snap.data().currentStock) || 0;

        let type;
        let qty;
        let sign;
        if (reasonDef.mode === 'SET') {
          type = TYPE_ADJUSTMENT;
          qty = target;
          sign = target >= current ? 1 : -1;
        } else if (reasonDef.mode === 'IN') {
          type = TYPE_STOCK_IN;
          qty = target;
          sign = 1;
        } else {
          type = TYPE_STOCK_OUT;
          qty = target;
          sign = -1;
        }

        const ref = referenceNumber || `${reasonCode}-${todayISO()}`;
        const result = await applyStockLine(tx, {
          itemId,
          itemCode: snap.data().itemCode || snap.data().sku || '',
          qty,
          sign,
          type,
          referenceNumber: ref,
          reason: reasonDef.label + (note ? ` — ${note}` : ''),
        });

        return {
          itemId: String(itemId),
          stockBefore: result.stockBefore,
          stockAfter: result.stockAfter,
          reason: reasonDef.label,
          referenceNumber: ref,
          adjustedBy: actorName(),
          at: nowISO(),
        };
      });
    } catch (e) {
      if (e && e.code === 'INSUFFICIENT_STOCK') {
        throw serviceError(e.message || 'Stock cannot go below zero', 400);
      }
      throw e;
    }
  },

  async getItemsWithStock() {
    const snap = await getDocs(query(col(ITEMS), limit(1000)));
    return fromQuery(snap).map((d) => ({
      id: d.id,
      name: d.name,
      itemCode: d.itemCode || d.sku || '',
      currentStock: Number(d.currentStock) || 0,
      minStock: Number(d.minStock) || 0,
      maxStock: Number(d.maxStockLevel) || Number(d.maxStock) || 0,
      isLowStock: !!d.isLowStock,
      isOutOfStock: !!d.isOutOfStock,
      unit: d.unit || d.unitName || '',
      sellingPrice: Number(d.sellingPrice) || 0,
      purchasePrice: Number(d.purchasePrice) || 0,
    }));
  },

  async getItemById(id) {
    return getByIdOr404(col(ITEMS), id);
  },

  async exportLedgerCsv(filters = {}) {
    const page = await this.getLedger(0, 5000, filters.search || '', filters);
    const headers = ['createdAt', 'type', 'itemName', 'itemCode', 'quantity', 'stockBefore', 'stockAfter', 'referenceNumber', 'reason', 'createdBy'];
    const csv = [headers.join(','), ...page.content.map((r) =>
      headers.map((h) => {
        const v = r[h];
        if (v === null || v === undefined) return '';
        const s = String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(',')
    )].join('\n');
    if (typeof window !== 'undefined') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `stock-ledger-${todayISO()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }
    return csv;
  },
};

export default inventoryService;
