// src/services/itemService.js
// Firestore-backed item master. Denormalised master names are written on the
// item so grids and invoices never need joins.

import { getDocs, addDoc, setDoc, deleteDoc, orderBy, limit, query, where } from '@firebase/firestore';
import {
  col,
  docOf,
  getByIdOr404,
  getPaged,
  fetchDocs,
  serviceError,
  requireAuth,
  fromQuery,
} from './firestoreHelpers';
import {
  buildSearchText,
  classifyStock,
  nowISO,
  round2,
} from './businessLogic';
import { brandService } from './brandService';
import { groupService } from './groupService';
import { sectionService } from './sectionService';
import { unitService } from './unitService';
import { taxService } from './taxService';

const ITEMS = 'items';

async function resolveMaster(service, id, fallbackName) {
  if (!id) return { id: null, name: fallbackName || '' };
  try {
    const doc = await service.getById(id);
    return { id: doc.id, name: doc.name || '' };
  } catch (e) {
    return { id, name: fallbackName || '' };
  }
}

function withStockInfo(payload) {
  const currentStock = Number(payload.currentStock) || 0;
  const minStock = Number(payload.minStock) || 0;
  const status = classifyStock(currentStock, minStock);
  const isOutOfStock = status === 'OUT_OF_STOCK';
  const isLowStock = status === 'LOW' || status === 'CRITICAL' || isOutOfStock;
  return { ...payload, currentStock, minStock, isLowStock, isOutOfStock };
}

async function assertUniqueCode(itemCode, excludeId = null) {
  if (!itemCode) return;
  const snap = await getDocs(query(col(ITEMS), where('itemCode', '==', itemCode)));
  const conflict = fromQuery(snap).find((item) => item.id !== excludeId);
  if (conflict) {
    throw serviceError(`Item code already exists: ${itemCode}`, 400);
  }
}

export const itemService = {
  async getAll(page = 0, size = 20, search = '') {
    return getPaged(col(ITEMS), { page, size, search });
  },

  async getItemsByCategory(category, value, page = 0, size = 20, search = '') {
    const snap = await getDocs(query(col(ITEMS), where(category, '==', value)));
    const items = fromQuery(snap);
    let filtered = items;
    if (search) {
      const term = String(search).trim().toLowerCase();
      filtered = items.filter((item) => (item.searchText || '').toLowerCase().includes(term));
    }
    return getPagedFromItems(filtered, page, size);
  },

  async getById(id) {
    return getByIdOr404(col(ITEMS), id);
  },

  async getByCode(itemCode) {
    const snap = await getDocs(query(col(ITEMS), where('itemCode', '==', itemCode), limit(1)));
    const items = fromQuery(snap);
    if (!items.length) throw serviceError(`Item with code ${itemCode} not found`, 404);
    return items[0];
  },

  async create(data) {
    requireAuth();
    const brand = await resolveMaster(brandService, data.brandId, data.brandName);
    const group = await resolveMaster(groupService, data.groupId, data.groupName);
    const section = await resolveMaster(sectionService, data.sectionId, data.sectionName);
    const unit = await resolveMaster(unitService, data.unitId, data.unitName);
    const tax = await resolveMaster(taxService, data.taxId || data.taxRateId, data.taxName);

    const payload = withStockInfo({
      itemCode: data.itemCode,
      name: data.name,
      categoryName: data.categoryName || (group.name || brand.name || ''),
      brandId: brand.id,
      brandName: brand.name || '',
      groupId: group.id,
      groupName: group.name || '',
      sectionId: section.id,
      sectionName: section.name || '',
      unitId: unit.id,
      unitName: unit.name || '',
      purchasePrice: round2(Number(data.purchasePrice) || 0),
      sellingPrice: round2(Number(data.sellingPrice) || 0),
      gstRate: round2(Number(data.gstRate !== undefined ? data.gstRate : 0)),
      taxId: tax.id,
      taxName: tax.name || '',
      minStock: Number(data.minStock) || 0,
      description: data.description || '',
      currentStock: Number(data.currentStock) || 0,
      isActive: data.isActive === undefined ? true : Boolean(data.isActive),
      createdAt: nowISO(),
      updatedAt: nowISO(),
    });
    payload.searchText = buildSearchText(
      payload.itemCode,
      payload.name,
      payload.brandName,
      payload.groupName,
      payload.unitName,
      payload.sectionName
    );
    await assertUniqueCode(payload.itemCode);
    const ref = await addDoc(col(ITEMS), payload);
    return { ...payload, id: ref.id };
  },

  async update(id, data) {
    requireAuth();
    const existing = await getByIdOr404(col(ITEMS), id);
    const brand = await resolveMaster(brandService, data.brandId !== undefined ? data.brandId : existing.brandId, data.brandName);
    const group = await resolveMaster(groupService, data.groupId !== undefined ? data.groupId : existing.groupId, data.groupName);
    const section = await resolveMaster(sectionService, data.sectionId !== undefined ? data.sectionId : existing.sectionId, data.sectionName);
    const unit = await resolveMaster(unitService, data.unitId !== undefined ? data.unitId : existing.unitId, data.unitName);
    const tax = await resolveMaster(taxService, data.taxId !== undefined ? data.taxId : existing.taxId, data.taxName);

    const next = withStockInfo({
      ...existing,
      itemCode: data.itemCode !== undefined ? data.itemCode : existing.itemCode,
      name: data.name !== undefined ? data.name : existing.name,
      categoryName: data.categoryName !== undefined ? data.categoryName : existing.categoryName,
      brandId: brand.id,
      brandName: brand.name || existing.brandName,
      groupId: group.id,
      groupName: group.name || existing.groupName,
      sectionId: section.id,
      sectionName: section.name || existing.sectionName || '',
      unitId: unit.id,
      unitName: unit.name || existing.unitName || '',
      purchasePrice: round2(Number(data.purchasePrice !== undefined ? data.purchasePrice : existing.purchasePrice) || 0),
      sellingPrice: round2(Number(data.sellingPrice !== undefined ? data.sellingPrice : existing.sellingPrice) || 0),
      gstRate: round2(Number(data.gstRate !== undefined ? data.gstRate : existing.gstRate) || 0),
      taxId: tax.id,
      taxName: tax.name || existing.taxName || '',
      minStock: Number(data.minStock !== undefined ? data.minStock : existing.minStock) || 0,
      description: data.description !== undefined ? data.description : existing.description || '',
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : existing.isActive !== false,
      updatedAt: nowISO(),
    });
    delete next.id;
    next.searchText = buildSearchText(
      next.itemCode,
      next.name,
      next.brandName,
      next.groupName,
      next.unitName,
      next.sectionName
    );
    await assertUniqueCode(next.itemCode, id);
    await setDoc(docOf(ITEMS, id), next, { merge: true });
    return { ...next, id };
  },

  async delete(id) {
    requireAuth();
    await deleteDoc(docOf(ITEMS, id));
    return { id, deleted: true };
  },

  async updateStock(id, stockUpdate) {
    requireAuth();
    const existing = await getByIdOr404(col(ITEMS), id);
    const currentStock = Number(existing.currentStock) || 0;
    const delta = Number(stockUpdate && stockUpdate.delta) || 0;
    const nextStock = Math.max(0, currentStock + delta);
    const payload = withStockInfo({
      ...existing,
      currentStock: nextStock,
      updatedAt: nowISO(),
    });
    delete payload.id;
    await setDoc(docOf(ITEMS, id), payload, { merge: true });
    return { id, currentStock: nextStock };
  },

  async getRecent() {
    const snap = await getDocs(query(col(ITEMS), orderBy('createdAt', 'desc'), limit(10)));
    return fromQuery(snap);
  },

  async search(search, page = 0, size = 20) {
    return getPaged(col(ITEMS), { page, size, search });
  },

  async getStats() {
    const items = fromQuery(await getDocs(col(ITEMS)));
    let stockValue = 0;
    let lowStock = 0;
    let outOfStock = 0;
    for (const item of items) {
      const stock = classifyStock(Number(item.currentStock) || 0, Number(item.minStock) || 0);
      if (stock.isLowStock) lowStock += 1;
      if (stock.isOutOfStock) outOfStock += 1;
      stockValue += (Number(item.currentStock) || 0) * (Number(item.purchasePrice) || Number(item.sellingPrice) || 0);
    }
    return {
      totalItems: items.length,
      stockValue: round2(stockValue),
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
    };
  },

  async getLowStockItems() {
    const snap = await getDocs(query(col(ITEMS), where('isLowStock', '==', true)));
    return fromQuery(snap);
  },

  async exportToExcel(filters = {}) {
    const { items } = await fetchDocs(col(ITEMS), { search: filters.search || '' });
    const headers = ['itemCode', 'name', 'brandName', 'groupName', 'unitName', 'purchasePrice', 'sellingPrice', 'gstRate', 'currentStock', 'minStock'];
    const csv = toCsv(items, headers);
    downloadCsv(csv, `items-${nowISO().slice(0, 10)}.csv`);
    return csv;
  },

  async bulkDelete(ids = []) {
    requireAuth();
    let deleted = 0;
    for (const id of ids) {
      try {
        await deleteDoc(docOf(ITEMS, id));
        deleted += 1;
      } catch (e) {
        // skip failures individually
      }
    }
    return { deleted };
  },
};

function getPagedFromItems(items, page, size) {
  const safePage = Number(page) || 0;
  const safeSize = Number(size) || 20;
  const start = safePage * safeSize;
  const content = items.slice(start, start + safeSize);
  return {
    content,
    totalElements: items.length,
    totalPages: Math.ceil(items.length / safeSize),
    number: safePage,
    size: safeSize,
    numberOfElements: content.length,
    first: safePage === 0,
    last: start + safeSize >= items.length,
  };
}

function toCsv(items, keys) {
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
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

export default itemService;