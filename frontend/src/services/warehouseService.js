// src/services/warehouseService.js
// Multi-warehouse master data, per-warehouse stock and atomic stock transfers.
//
// Data model (Spark-compatible, no Cloud Functions):
//   items.currentStock            -> quantity in the MAIN warehouse (source of
//                                    truth for sales/purchase transactions)
//   warehouseStock/{wid_itemId}   -> quantity per warehouse. The main
//                                    warehouse doc always mirrors
//                                    items.currentStock for that item.
//   stockTransfers                -> transfer documents with source/destination
//
// Every transfer commits source-out, destination-in and the ledger entries in
// ONE Firestore transaction.

import { getDocs, doc, query, where, limit } from '@firebase/firestore';
import {
  col,
  docOf,
  getByIdOr404,
  getPaged,
  serviceError,
  requireAuth,
  fromQuery,
  autoDoc,
} from './firestoreHelpers';
import { round2, buildSearchText, nowISO, todayISO, classifyStock } from './businessLogic';
import { getCurrentUser } from './authService';
import { runStockTransaction, nextNumber } from './inventoryOps';
import { db } from '../firebase/firebase';

const WAREHOUSES = 'warehouses';
const LOCATIONS = 'warehouseLocations';
const WAREHOUSE_STOCK = 'warehouseStock';
const TRANSFERS = 'stockTransfers';
const ITEMS = 'items';
const LEDGER = 'stockTransactions';

export const MAIN_WAREHOUSE_ID = 'main';

function actorName() {
  const user = getCurrentUser();
  return (user && (user.username || user.email)) || 'unknown';
}

function stockDocId(warehouseId, itemId) {
  return `${warehouseId}_${itemId}`;
}

function warehouseRef(id) {
  return doc(db, WAREHOUSES, String(id));
}

function stockRef(warehouseId, itemId) {
  return doc(db, WAREHOUSE_STOCK, stockDocId(warehouseId, itemId));
}

async function ensureMainWarehouse() {
  const snap = await getDocs(query(col(WAREHOUSES), where('isMain', '==', true), limit(1)));
  const existing = fromQuery(snap);
  if (existing.length) return existing[0];
  const main = {
    code: 'MAIN',
    name: 'Main Warehouse',
    location: 'Head Office',
    isMain: true,
    isActive: true,
    createdBy: 'system',
    createdAt: nowISO(),
    updatedAt: nowISO(),
    searchText: buildSearchText('MAIN', 'Main Warehouse'),
  };
  const ref = doc(db, WAREHOUSES, MAIN_WAREHOUSE_ID);
  try {
    await runStockTransaction(async (tx) => {
      const snap2 = await tx.get(ref);
      if (!snap2.exists()) tx.set(ref, main);
    });
  } catch (e) {
    // A concurrent creator may have won the race; ignore and re-read.
  }
  const after = await getByIdOr404(col(WAREHOUSES), MAIN_WAREHOUSE_ID);
  return after;
}

export const warehouseService = {
  async ensureMainWarehouse() {
    requireAuth();
    return ensureMainWarehouse();
  },

  // ==================== WAREHOUSES ====================

  async getWarehouses(page = 0, size = 50, search = '') {
    await ensureMainWarehouse().catch(() => null);
    return getPaged(col(WAREHOUSES), { page, size, search });
  },

  async getAllWarehouses() {
    await ensureMainWarehouse().catch(() => null);
    const snap = await getDocs(query(col(WAREHOUSES), limit(200)));
    return fromQuery(snap);
  },

  async getWarehouseById(id) {
    return getByIdOr404(col(WAREHOUSES), id);
  },

  async createWarehouse(data) {
    requireAuth();
    if (!data.name || !String(data.name).trim()) throw serviceError('Warehouse name is required', 400);
    const code = String(data.code || '').trim().toUpperCase();
    if (!code) throw serviceError('Warehouse code is required', 400);
    const dup = await getDocs(query(col(WAREHOUSES), where('code', '==', code), limit(1)));
    if (fromQuery(dup).length) throw serviceError(`Warehouse code ${code} already exists`, 400);

    const ref = doc(db, WAREHOUSES);
    const payload = {
      code,
      name: String(data.name).trim(),
      location: data.location || '',
      address: data.address || '',
      isMain: false,
      isActive: data.isActive !== false,
      createdBy: actorName(),
      createdAt: nowISO(),
      updatedAt: nowISO(),
      searchText: buildSearchText(code, data.name, data.location),
    };
    await runStockTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) tx.set(ref, payload);
    });
    return { id: ref.id, ...payload };
  },

  async updateWarehouse(id, data) {
    requireAuth();
    const existing = await getByIdOr404(col(WAREHOUSES), id);
    const payload = {
      name: data.name !== undefined ? String(data.name).trim() : existing.name,
      location: data.location !== undefined ? data.location : existing.location,
      address: data.address !== undefined ? data.address : existing.address,
      isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
      updatedAt: nowISO(),
    };
    delete payload.id;
    await runStockTransaction(async (tx) => {
      tx.update(docOf(WAREHOUSES, id), payload);
    });
    return { id, ...existing, ...payload };
  },

  async deleteWarehouse(id) {
    requireAuth();
    const existing = await getByIdOr404(col(WAREHOUSES), id);
    if (existing.isMain || id === MAIN_WAREHOUSE_ID) {
      throw serviceError('The main warehouse cannot be deleted', 400);
    }
    // Block deletion while stock still exists in this warehouse.
    const stockSnap = await getDocs(query(col(WAREHOUSE_STOCK), where('warehouseId', '==', String(id)), limit(1)));
    const withStock = fromQuery(stockSnap).filter((s) => (Number(s.quantity) || 0) > 0);
    if (withStock.length) {
      throw serviceError('Transfer all stock out of this warehouse before deleting it', 400);
    }
    const { deleteDoc } = await import('@firebase/firestore');
    await deleteDoc(docOf(WAREHOUSES, id));
    return { id, deleted: true };
  },

  // ==================== LOCATIONS (AISLE / RACK / SHELF / BIN) ====================

  async getLocations(warehouseId = '') {
    let q;
    if (warehouseId) {
      q = query(col(LOCATIONS), where('warehouseId', '==', String(warehouseId)), limit(500));
    } else {
      q = query(col(LOCATIONS), limit(500));
    }
    const snap = await getDocs(q);
    return sortByCode(fromQuery(snap));
  },

  async createLocation(data) {
    requireAuth();
    if (!data.warehouseId) throw serviceError('Warehouse is required', 400);
    if (!data.code || !String(data.code).trim()) throw serviceError('Location code is required', 400);
    const code = String(data.code).trim().toUpperCase();
    const dup = await getDocs(query(col(LOCATIONS), where('warehouseId', '==', String(data.warehouseId)), limit(500)));
    if (fromQuery(dup).some((l) => l.code === code)) {
      throw serviceError(`Location code ${code} already exists in this warehouse`, 400);
    }
    const ref = doc(db, LOCATIONS);
    const payload = {
      warehouseId: String(data.warehouseId),
      warehouseName: data.warehouseName || '',
      code,
      aisle: data.aisle || '',
      rack: data.rack || '',
      shelf: data.shelf || '',
      bin: data.bin || '',
      isActive: true,
      createdBy: actorName(),
      createdAt: nowISO(),
      updatedAt: nowISO(),
      searchText: buildSearchText(code, data.aisle, data.rack, data.shelf, data.bin),
    };
    await runStockTransaction(async (tx) => {
      tx.set(ref, payload);
    });
    return { id: ref.id, ...payload };
  },

  async deleteLocation(id) {
    requireAuth();
    await runStockTransaction(async (tx) => {
      tx.delete(docOf(LOCATIONS, id));
    });
    return { id, deleted: true };
  },

  // ==================== WAREHOUSE STOCK ====================

  // Stock for one warehouse, joined with item master data.
  async getStockForWarehouse(warehouseId, page = 0, size = 20, search = '') {
    const snap = await getDocs(query(col(WAREHOUSE_STOCK), where('warehouseId', '==', String(warehouseId)), limit(2000)));
    let stockDocs = fromQuery(snap);
    if (!warehouseId || warehouseId === MAIN_WAREHOUSE_ID) {
      // Main warehouse always reflects the item master directly.
      const itemsSnap = await getDocs(query(col(ITEMS), limit(2000)));
      const items = fromQuery(itemsSnap);
      const qtyById = new Map(stockDocs.map((s) => [s.itemId, Number(s.quantity) || 0]));
      stockDocs = items.map((it) => ({
        id: stockDocId(MAIN_WAREHOUSE_ID, it.id),
        warehouseId: MAIN_WAREHOUSE_ID,
        itemId: it.id,
        itemName: it.name,
        itemCode: it.itemCode || it.sku || '',
        quantity: Number(it.currentStock) || 0,
        minStock: Number(it.minStock) || 0,
        updatedAt: it.updatedAt || '',
        _master: true,
        _flagQty: qtyById.get(it.id),
      }));
    } else {
      // Enrich non-main stock rows with item names.
      const itemsSnap = await getDocs(query(col(ITEMS), limit(2000)));
      const itemById = new Map(fromQuery(itemsSnap).map((i) => [i.id, i]));
      stockDocs = stockDocs.map((s) => {
        const it = itemById.get(s.itemId);
        return {
          ...s,
          itemName: it ? it.name : s.itemName || 'Unknown item',
          itemCode: it ? (it.itemCode || it.sku || '') : s.itemCode || '',
          minStock: it ? Number(it.minStock) || 0 : 0,
        };
      });
    }

    const term = (search || '').trim().toLowerCase();
    if (term) {
      stockDocs = stockDocs.filter((s) =>
        [s.itemName, s.itemCode].filter(Boolean).some((v) => String(v).toLowerCase().includes(term))
      );
    }
    stockDocs.sort((a, b) => String(a.itemName || '').localeCompare(String(b.itemName || '')));
    const total = stockDocs.length;
    const start = page * size;
    return {
      content: stockDocs.slice(start, start + size),
      totalElements: total,
      totalPages: Math.max(1, Math.ceil(total / size)),
      number: page,
      size,
    };
  },

  // ==================== STOCK TRANSFERS ====================

  async getTransfers(page = 0, size = 20, search = '') {
    return getPaged(col(TRANSFERS), { page, size, search });
  },

  // Atomic warehouse transfer: source OUT, destination IN, ledger entries for
  // both sides and the transfer document are committed together.
  async createTransfer(data) {
    requireAuth();
    const sourceId = String(data.sourceId || '');
    const destId = String(data.destinationId || '');
    if (!sourceId || !destId) throw serviceError('Source and destination warehouses are required', 400);
    if (sourceId === destId) throw serviceError('Source and destination warehouses must be different', 400);
    const lines = (data.items || [])
      .map((l) => ({ itemId: String(l.itemId || ''), quantity: Number(l.quantity) || 0, itemName: l.itemName || '' }))
      .filter((l) => l.itemId && l.quantity > 0);
    if (!lines.length) throw serviceError('Add at least one item with a quantity greater than zero', 400);

    try {
      return await runStockTransaction(async (tx) => {
        const srcSnap = await tx.get(warehouseRef(sourceId));
        const dstSnap = await tx.get(warehouseRef(destId));
        if (!srcSnap.exists()) throw serviceError('Source warehouse not found', 404);
        if (!dstSnap.exists()) throw serviceError('Destination warehouse not found', 404);

        const transferRef = doc(db, TRANSFERS);
        const transferNo = await nextNumber(tx, 'TRF', data.transferDate || todayISO());
        const now = nowISO();

        for (const line of lines) {
          // ---- Source side ----
          if (sourceId === MAIN_WAREHOUSE_ID) {
            // Draw from the item master (guarded against negative stock).
            const itemRef = docOf(ITEMS, line.itemId);
            const itemSnap = await tx.get(itemRef);
            if (!itemSnap.exists()) throw serviceError(`Item ${line.itemName || line.itemId} not found`, 404);
            const current = Number(itemSnap.data().currentStock) || 0;
            if (line.quantity > current) {
              throw serviceError(
                `Insufficient stock for ${itemSnap.data().name} in source warehouse (available: ${current}, required: ${line.quantity})`,
                400
              );
            }
            const newQty = round2(current - line.quantity);
            const minStock = Number(itemSnap.data().minStock) || 0;
            const maxStock = Number(itemSnap.data().maxStockLevel) || Number(itemSnap.data().maxStock) || 0;
            const status = classifyStock(newQty, minStock, maxStock);
            tx.update(itemRef, {
              currentStock: newQty,
              isLowStock: status === 'LOW' || status === 'CRITICAL' || status === 'OUT_OF_STOCK',
              isOutOfStock: status === 'OUT_OF_STOCK',
              updatedAt: now,
            });
            tx.set(autoDoc(LEDGER), {
              type: 'WAREHOUSE_TRANSFER',
              sign: -1,
              quantity: line.quantity,
              reason: `Transfer OUT → ${dstSnap.data().name}`,
              itemId: line.itemId,
              itemName: itemSnap.data().name || line.itemName,
              itemCode: itemSnap.data().itemCode || '',
              stockBefore: current,
              stockAfter: newQty,
              referenceNumber: transferNo,
              referenceId: transferRef.id,
              warehouseId: sourceId,
              transactionDate: now,
              transactionKey: todayISO(),
              createdAt: now,
              createdBy: actorName(),
            });
            // Keep the main warehouse stock doc in sync with the master.
            const mainStockRef = stockRef(MAIN_WAREHOUSE_ID, line.itemId);
            const mainSnap = await tx.get(mainStockRef);
            tx.set(mainStockRef, {
              warehouseId: MAIN_WAREHOUSE_ID,
              itemId: line.itemId,
              itemName: itemSnap.data().name || '',
              quantity: newQty,
              updatedAt: now,
            }, { merge: !mainSnap.exists() });
          } else {
            const srcStockRef = stockRef(sourceId, line.itemId);
            const srcStockSnap = await tx.get(srcStockRef);
            const current = Number(srcStockSnap.exists() ? srcStockSnap.data().quantity : 0) || 0;
            if (line.quantity > current) {
              throw serviceError(
                `Insufficient stock for ${line.itemName || line.itemId} in source warehouse (available: ${current}, required: ${line.quantity})`,
                400
              );
            }
            const newQty = round2(current - line.quantity);
            tx.set(srcStockRef, {
              warehouseId: sourceId,
              itemId: line.itemId,
              itemName: line.itemName,
              quantity: newQty,
              updatedAt: now,
            }, { merge: true });
            tx.set(autoDoc(LEDGER), {
              type: 'WAREHOUSE_TRANSFER',
              sign: -1,
              quantity: line.quantity,
              reason: `Transfer OUT → ${dstSnap.data().name}`,
              itemId: line.itemId,
              itemName: line.itemName,
              stockBefore: current,
              stockAfter: newQty,
              referenceNumber: transferNo,
              referenceId: transferRef.id,
              warehouseId: sourceId,
              transactionDate: now,
              transactionKey: todayISO(),
              createdAt: now,
              createdBy: actorName(),
            });
          }

          // ---- Destination side ----
          if (destId === MAIN_WAREHOUSE_ID) {
            const itemRef = docOf(ITEMS, line.itemId);
            const itemSnap = await tx.get(itemRef);
            if (!itemSnap.exists()) throw serviceError(`Item ${line.itemName || line.itemId} not found`, 404);
            const current = Number(itemSnap.data().currentStock) || 0;
            const newQty = round2(current + line.quantity);
            const minStock = Number(itemSnap.data().minStock) || 0;
            const maxStock = Number(itemSnap.data().maxStockLevel) || Number(itemSnap.data().maxStock) || 0;
            const status = classifyStock(newQty, minStock, maxStock);
            tx.update(itemRef, {
              currentStock: newQty,
              isLowStock: status === 'LOW' || status === 'CRITICAL' || status === 'OUT_OF_STOCK',
              isOutOfStock: status === 'OUT_OF_STOCK',
              updatedAt: now,
            });
            tx.set(autoDoc(LEDGER), {
              type: 'WAREHOUSE_TRANSFER',
              sign: 1,
              quantity: line.quantity,
              reason: `Transfer IN ← ${srcSnap.data().name}`,
              itemId: line.itemId,
              itemName: itemSnap.data().name || line.itemName,
              itemCode: itemSnap.data().itemCode || '',
              stockBefore: current,
              stockAfter: newQty,
              referenceNumber: transferNo,
              referenceId: transferRef.id,
              warehouseId: destId,
              transactionDate: now,
              transactionKey: todayISO(),
              createdAt: now,
              createdBy: actorName(),
            });
            const mainStockRef = stockRef(MAIN_WAREHOUSE_ID, line.itemId);
            tx.set(mainStockRef, {
              warehouseId: MAIN_WAREHOUSE_ID,
              itemId: line.itemId,
              itemName: itemSnap.data().name || '',
              quantity: newQty,
              updatedAt: now,
            }, { merge: true });
          } else {
            const dstStockRef = stockRef(destId, line.itemId);
            const dstStockSnap = await tx.get(dstStockRef);
            const current = Number(dstStockSnap.exists() ? dstStockSnap.data().quantity : 0) || 0;
            const newQty = round2(current + line.quantity);
            tx.set(dstStockRef, {
              warehouseId: destId,
              itemId: line.itemId,
              itemName: line.itemName,
              quantity: newQty,
              updatedAt: now,
            }, { merge: true });
            tx.set(autoDoc(LEDGER), {
              type: 'WAREHOUSE_TRANSFER',
              sign: 1,
              quantity: line.quantity,
              reason: `Transfer IN ← ${srcSnap.data().name}`,
              itemId: line.itemId,
              itemName: line.itemName,
              stockBefore: current,
              stockAfter: newQty,
              referenceNumber: transferNo,
              referenceId: transferRef.id,
              warehouseId: destId,
              transactionDate: now,
              transactionKey: todayISO(),
              createdAt: now,
              createdBy: actorName(),
            });
          }
        }

        const payload = {
          transferNumber: transferNo,
          transferDate: data.transferDate || todayISO(),
          sourceId,
          sourceName: srcSnap.data().name,
          destinationId: destId,
          destinationName: dstSnap.data().name,
          items: lines.map((l, i) => ({ id: `trf_${transferRef.id}_${i + 1}`, ...l })),
          status: 'COMPLETED',
          notes: data.notes || '',
          createdBy: actorName(),
          createdAt: now,
          updatedAt: now,
          searchText: buildSearchText(transferNo, srcSnap.data().name, dstSnap.data().name),
        };
        await tx.set(transferRef, payload);
        return { transferNumber: transferNo, id: transferRef.id, ...payload };
      });
    } catch (e) {
      if (e && e.code === 'INSUFFICIENT_STOCK') {
        throw serviceError(e.message, 400);
      }
      throw e;
    }
  },
};

function sortByCode(list) {
  return list.sort((a, b) => String(a.code || '').localeCompare(String(b.code || '')));
}

export default warehouseService;
