// src/services/itemService.js
// Enterprise Firestore-backed product & master catalog service.
// Supports Barcodes, Categories, Brands, Groups, Units, Taxes, Price Lists,
// Multi-Tier Pricing (Retail, Wholesale, Special), Batch Numbers, Serial Numbers,
// Expiry Dates, Reorder Levels, and Product Images.

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
import { categoryService } from './categoryService';
import { supplierService } from './supplierService';

const ITEMS = 'items';

export function generateBarcode(prefix = '890') {
  // Generates a 13-digit EAN-13 format barcode
  const randomDigits = Math.floor(100000000 + Math.random() * 900000000);
  const code12 = `${prefix}${randomDigits}`;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(code12[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return `${code12}${checkDigit}`;
}

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
  const minStock = Number(payload.minStock !== undefined ? payload.minStock : payload.minimumStock) || 0;
  const maxStock = Number(payload.maxStock !== undefined ? payload.maxStock : payload.maximumStock) || 0;
  const status = classifyStock(currentStock, minStock, maxStock);
  const isOutOfStock = status === 'OUT_OF_STOCK';
  const isLowStock = status === 'LOW' || status === 'CRITICAL' || isOutOfStock;
  return {
    ...payload,
    currentStock,
    minStock,
    minimumStock: minStock,
    maxStock,
    maximumStock: maxStock,
    reorderLevel: Number(payload.reorderLevel) || minStock,
    isLowStock,
    isOutOfStock,
    stockStatus: status,
  };
}

async function assertUniqueCode(itemCode, excludeId = null) {
  if (!itemCode) return;
  const snap = await getDocs(query(col(ITEMS), where('itemCode', '==', itemCode)));
  const conflict = fromQuery(snap).find((item) => item.id !== excludeId);
  if (conflict) {
    throw serviceError(`Product SKU / Code already exists: ${itemCode}`, 400);
  }
}

async function assertUniqueBarcode(barcode, excludeId = null) {
  if (!barcode || String(barcode).trim() === '') return;
  const snap = await getDocs(query(col(ITEMS), where('barcode', '==', String(barcode).trim())));
  const conflict = fromQuery(snap).find((item) => item.id !== excludeId);
  if (conflict) {
    throw serviceError(`Barcode already assigned to product "${conflict.name}": ${barcode}`, 400);
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
    if (!items.length) throw serviceError(`Product with code ${itemCode} not found`, 404);
    return items[0];
  },

  async getByBarcode(barcode) {
    if (!barcode) throw serviceError('Barcode required', 400);
    const snap = await getDocs(query(col(ITEMS), where('barcode', '==', String(barcode).trim()), limit(1)));
    const items = fromQuery(snap);
    if (!items.length) throw serviceError(`Product with barcode ${barcode} not found`, 404);
    return items[0];
  },

  async create(data) {
    requireAuth();
    const brand = await resolveMaster(brandService, data.brandId, data.brandName);
    const group = await resolveMaster(groupService, data.groupId, data.groupName);
    const category = await resolveMaster(categoryService, data.categoryId, data.categoryName);
    const section = await resolveMaster(sectionService, data.sectionId, data.sectionName);
    const unit = await resolveMaster(unitService, data.unitId, data.unitName);
    const tax = await resolveMaster(taxService, data.taxId || data.taxRateId, data.taxName);
    const supplier = await resolveMaster(supplierService, data.supplierId, data.supplierName);

    const barcode = data.barcode ? String(data.barcode).trim() : '';
    const itemCode = String(data.itemCode || data.sku || '').trim();
    if (!itemCode) throw serviceError('Product SKU / Code is required', 400);
    if (!data.name || String(data.name).trim() === '') throw serviceError('Product Name is required', 400);

    const rawSerials = Array.isArray(data.serialNumbers)
      ? data.serialNumbers
      : typeof data.serialNumbers === 'string'
      ? data.serialNumbers.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const payload = withStockInfo({
      productId: itemCode,
      itemCode,
      sku: itemCode,
      barcode,
      name: String(data.name).trim(),
      categoryId: category.id,
      categoryName: category.name || (group.name || brand.name || ''),
      brandId: brand.id,
      brandName: brand.name || '',
      groupId: group.id,
      groupName: group.name || '',
      sectionId: section.id,
      sectionName: section.name || '',
      unitId: unit.id,
      unitName: unit.name || '',
      supplierId: supplier.id,
      supplierName: supplier.name || '',
      purchasePrice: round2(Number(data.purchasePrice) || 0),
      sellingPrice: round2(Number(data.sellingPrice) || 0),
      mrp: round2(Number(data.mrp !== undefined ? data.mrp : data.sellingPrice) || 0),
      wholesalePrice: round2(Number(data.wholesalePrice !== undefined ? data.wholesalePrice : data.sellingPrice) || 0),
      specialPrice: round2(Number(data.specialPrice !== undefined ? data.specialPrice : data.sellingPrice) || 0),
      gstRate: round2(Number(data.gstRate !== undefined ? data.gstRate : 0)),
      taxRate: round2(Number(data.gstRate !== undefined ? data.gstRate : 0)),
      taxId: tax.id,
      taxName: tax.name || '',
      minStock: Number(data.minStock !== undefined ? data.minStock : data.minimumStock) || 0,
      minimumStock: Number(data.minStock !== undefined ? data.minStock : data.minimumStock) || 0,
      maxStock: Number(data.maxStock !== undefined ? data.maxStock : data.maximumStock) || 0,
      maximumStock: Number(data.maxStock !== undefined ? data.maxStock : data.maximumStock) || 0,
      reorderLevel: Number(data.reorderLevel) || Number(data.minStock) || 0,
      batchNumber: data.batchNumber ? String(data.batchNumber).trim() : '',
      manufacturingDate: data.manufacturingDate || '',
      expiryDate: data.expiryDate || '',
      serialNumbers: rawSerials,
      imageUrl: data.imageUrl || data.image || '',
      description: data.description || '',
      currentStock: Number(data.currentStock) || 0,
      status: data.status || (data.isActive === false ? 'INACTIVE' : 'ACTIVE'),
      isActive: data.isActive === undefined ? true : Boolean(data.isActive),
      createdAt: nowISO(),
      updatedAt: nowISO(),
    });

    payload.searchText = buildSearchText(
      payload.itemCode,
      payload.barcode,
      payload.name,
      payload.categoryName,
      payload.brandName,
      payload.groupName,
      payload.unitName,
      payload.sectionName,
      payload.batchNumber,
      payload.supplierName
    );

    await assertUniqueCode(payload.itemCode);
    if (payload.barcode) {
      await assertUniqueBarcode(payload.barcode);
    }

    const ref = await addDoc(col(ITEMS), payload);
    return { ...payload, id: ref.id };
  },

  async update(id, data) {
    requireAuth();
    const existing = await getByIdOr404(col(ITEMS), id);
    const brand = await resolveMaster(brandService, data.brandId !== undefined ? data.brandId : existing.brandId, data.brandName);
    const group = await resolveMaster(groupService, data.groupId !== undefined ? data.groupId : existing.groupId, data.groupName);
    const category = await resolveMaster(categoryService, data.categoryId !== undefined ? data.categoryId : existing.categoryId, data.categoryName);
    const section = await resolveMaster(sectionService, data.sectionId !== undefined ? data.sectionId : existing.sectionId, data.sectionName);
    const unit = await resolveMaster(unitService, data.unitId !== undefined ? data.unitId : existing.unitId, data.unitName);
    const tax = await resolveMaster(taxService, data.taxId !== undefined ? data.taxId : existing.taxId, data.taxName);
    const supplier = await resolveMaster(supplierService, data.supplierId !== undefined ? data.supplierId : existing.supplierId, data.supplierName);

    const barcode = data.barcode !== undefined ? String(data.barcode).trim() : existing.barcode || '';
    const itemCode = String(data.itemCode !== undefined ? data.itemCode : existing.itemCode || existing.sku || '').trim();

    const rawSerials = data.serialNumbers !== undefined
      ? Array.isArray(data.serialNumbers)
        ? data.serialNumbers
        : typeof data.serialNumbers === 'string'
        ? data.serialNumbers.split(',').map((s) => s.trim()).filter(Boolean)
        : []
      : existing.serialNumbers || [];

    const next = withStockInfo({
      ...existing,
      productId: itemCode,
      itemCode,
      sku: itemCode,
      barcode,
      name: data.name !== undefined ? String(data.name).trim() : existing.name,
      categoryId: category.id,
      categoryName: category.name || existing.categoryName || '',
      brandId: brand.id,
      brandName: brand.name || existing.brandName || '',
      groupId: group.id,
      groupName: group.name || existing.groupName || '',
      sectionId: section.id,
      sectionName: section.name || existing.sectionName || '',
      unitId: unit.id,
      unitName: unit.name || existing.unitName || '',
      supplierId: supplier.id,
      supplierName: supplier.name || existing.supplierName || '',
      purchasePrice: round2(Number(data.purchasePrice !== undefined ? data.purchasePrice : existing.purchasePrice) || 0),
      sellingPrice: round2(Number(data.sellingPrice !== undefined ? data.sellingPrice : existing.sellingPrice) || 0),
      mrp: round2(Number(data.mrp !== undefined ? data.mrp : existing.mrp !== undefined ? existing.mrp : existing.sellingPrice) || 0),
      wholesalePrice: round2(Number(data.wholesalePrice !== undefined ? data.wholesalePrice : existing.wholesalePrice !== undefined ? existing.wholesalePrice : existing.sellingPrice) || 0),
      specialPrice: round2(Number(data.specialPrice !== undefined ? data.specialPrice : existing.specialPrice !== undefined ? existing.specialPrice : existing.sellingPrice) || 0),
      gstRate: round2(Number(data.gstRate !== undefined ? data.gstRate : existing.gstRate) || 0),
      taxRate: round2(Number(data.gstRate !== undefined ? data.gstRate : existing.gstRate) || 0),
      taxId: tax.id,
      taxName: tax.name || existing.taxName || '',
      minStock: Number(data.minStock !== undefined ? data.minStock : existing.minStock) || 0,
      minimumStock: Number(data.minStock !== undefined ? data.minStock : existing.minStock) || 0,
      maxStock: Number(data.maxStock !== undefined ? data.maxStock : existing.maxStock || 0) || 0,
      maximumStock: Number(data.maxStock !== undefined ? data.maxStock : existing.maxStock || 0) || 0,
      reorderLevel: Number(data.reorderLevel !== undefined ? data.reorderLevel : existing.reorderLevel || existing.minStock || 0),
      batchNumber: data.batchNumber !== undefined ? String(data.batchNumber).trim() : existing.batchNumber || '',
      manufacturingDate: data.manufacturingDate !== undefined ? data.manufacturingDate : existing.manufacturingDate || '',
      expiryDate: data.expiryDate !== undefined ? data.expiryDate : existing.expiryDate || '',
      serialNumbers: rawSerials,
      imageUrl: data.imageUrl !== undefined ? data.imageUrl : data.image !== undefined ? data.image : existing.imageUrl || '',
      description: data.description !== undefined ? data.description : existing.description || '',
      status: data.status || (data.isActive === false ? 'INACTIVE' : existing.status || 'ACTIVE'),
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : existing.isActive !== false,
      updatedAt: nowISO(),
    });

    delete next.id;
    next.searchText = buildSearchText(
      next.itemCode,
      next.barcode,
      next.name,
      next.categoryName,
      next.brandName,
      next.groupName,
      next.unitName,
      next.sectionName,
      next.batchNumber,
      next.supplierName
    );

    await assertUniqueCode(next.itemCode, id);
    if (next.barcode) {
      await assertUniqueBarcode(next.barcode, id);
    }

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
    let expiringSoon = 0;
    const today = nowISO().slice(0, 10);
    const next30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    for (const item of items) {
      const stock = classifyStock(Number(item.currentStock) || 0, Number(item.minStock) || 0, Number(item.maxStock) || 0);
      if (stock === 'LOW' || stock === 'CRITICAL') lowStock += 1;
      if (stock === 'OUT_OF_STOCK') outOfStock += 1;
      if (item.expiryDate && item.expiryDate >= today && item.expiryDate <= next30Days) {
        expiringSoon += 1;
      }
      stockValue += (Number(item.currentStock) || 0) * (Number(item.purchasePrice) || Number(item.sellingPrice) || 0);
    }
    return {
      totalItems: items.length,
      stockValue: round2(stockValue),
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
      expiringSoonCount: expiringSoon,
    };
  },

  async getLowStockItems() {
    const snap = await getDocs(query(col(ITEMS), where('isLowStock', '==', true)));
    return fromQuery(snap);
  },

  async getExpiringItems(days = 30) {
    const all = fromQuery(await getDocs(col(ITEMS)));
    const today = nowISO().slice(0, 10);
    const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return all.filter((item) => item.expiryDate && item.expiryDate >= today && item.expiryDate <= targetDate);
  },

  async exportToExcel(filters = {}) {
    const { items } = await fetchDocs(col(ITEMS), { search: filters.search || '' });
    const headers = [
      'itemCode',
      'barcode',
      'name',
      'categoryName',
      'brandName',
      'groupName',
      'unitName',
      'purchasePrice',
      'sellingPrice',
      'wholesalePrice',
      'mrp',
      'gstRate',
      'currentStock',
      'minStock',
      'maxStock',
      'reorderLevel',
      'batchNumber',
      'expiryDate',
      'status',
    ];
    const csv = toCsv(items, headers);
    downloadCsv(csv, `products-${nowISO().slice(0, 10)}.csv`);
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
    totalPages: Math.ceil(items.length / safeSize) || 1,
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