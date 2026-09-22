// src/services/partyCrud.js
// Shared implementation for customer & supplier services on Firestore.

import { getDocs, addDoc, setDoc, deleteDoc, query, where, orderBy, limit } from '@firebase/firestore';
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
import { buildSearchText, nowISO } from './businessLogic';

export function makePartyService({
  collectionName,
  creditEnabled = false,
  softDelete = false,
}) {
  const buildPayload = (data, existing = {}) => {
    const payload = {
      name: data.name !== undefined ? data.name : existing.name,
      phone: data.phone !== undefined ? data.phone : existing.phone || '',
      email: data.email !== undefined ? data.email : existing.email || '',
      address: data.address !== undefined ? data.address : existing.address || '',
      area: data.area !== undefined ? data.area : existing.area || '',
      gstNo: data.gstNo !== undefined ? data.gstNo : existing.gstNo || '',
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : existing.isActive !== false,
      updatedAt: nowISO(),
      searchText: buildSearchText(data.name, data.phone, data.email, data.area, data.gstNo),
    };
    if (creditEnabled) {
      payload.openingBalance = data.openingBalance !== undefined ? Number(data.openingBalance) : existing.openingBalance || 0;
      payload.creditLimit = data.creditLimit !== undefined ? Number(data.creditLimit) : existing.creditLimit || 0;
      payload.creditBalance = data.creditBalance !== undefined
        ? Number(data.creditBalance)
        : existing.creditBalance !== undefined
          ? existing.creditBalance
          : Number(data.openingBalance) || 0;
    } else {
      payload.creditBalance = data.creditBalance !== undefined ? Number(data.creditBalance) : existing.creditBalance || 0;
    }
    return payload;
  };

  const getAll = async (page = 0, size = 20, search = '') => {
    return getPaged(col(collectionName), { page, size, search });
  };

  const getById = async (id) => getByIdOr404(col(collectionName), id);

  const getByPhone = async (phone) => {
    const snap = await getDocs(query(col(collectionName), where('phone', '==', phone), limit(1)));
    const items = fromQuery(snap);
    if (!items.length) {
      throw serviceError(`${collectionName === 'customers' ? 'Customer' : 'Supplier'} with phone ${phone} not found`, 404);
    }
    return items[0];
  };

  const create = async (data) => {
    requireAuth();
    const payload = {
      ...buildPayload(data),
      creditBalance: creditEnabled
        ? Number(data.creditBalance !== undefined ? data.creditBalance : data.openingBalance) || 0
        : 0,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      searchText: buildSearchText(data.name, data.phone, data.email, data.area, data.gstNo),
    };
    const ref = await addDoc(col(collectionName), payload);
    return { ...payload, id: ref.id };
  };

  const update = async (id, data) => {
    requireAuth();
    const existing = await getById(id);
    const payload = buildPayload(data, existing);
    await setDoc(docOf(collectionName, id), payload, { merge: true });
    return { ...existing, ...payload, id };
  };

  const softRemove = async (id) => {
    requireAuth();
    const existing = await getById(id);
    await setDoc(docOf(collectionName, id), { isActive: false, updatedAt: nowISO() }, { merge: true });
    return { ...existing, isActive: false, id };
  };

  const hardRemove = async (id) => {
    requireAuth();
    await deleteDoc(docOf(collectionName, id));
    return { id, deleted: true };
  };

  const getRecent = async () => {
    const snap = await getDocs(query(col(collectionName), orderBy('createdAt', 'desc'), limit(10)));
    return fromQuery(snap);
  };

  const search = async (term, page = 0, size = 20) => {
    return getPaged(col(collectionName), { page, size, search: term });
  };

  const getStats = async () => {
    const all = fromQuery(await getDocs(col(collectionName)));
    return {
      total: all.length,
      active: all.filter((c) => c.isActive !== false).length,
      totalBalance: all.reduce((sum, c) => sum + (Number(c.creditBalance) || 0), 0),
    };
  };

  const exportToExcel = async (filters = {}) => {
    const { items } = await fetchDocs(col(collectionName), { search: filters.search || '' });
    const headers = ['name', 'phone', 'email', 'address', 'area', 'gstNo', 'creditBalance'];
    const csv = toCsv(items, headers);
    downloadCsv(csv, `${collectionName}-${nowISO().slice(0, 10)}.csv`);
    return csv;
  };

  const importFromExcel = async () => {
    throw serviceError('Excel import is not supported in the Firebase version. Add records from the UI instead.', 400);
  };

  const bulkDelete = async (ids = []) => {
    requireAuth();
    const results = [];
    for (const id of ids) {
      try {
        results.push(softDelete ? await softRemove(id) : await hardRemove(id));
      } catch (e) {
        results.push({ id, error: e.message });
      }
    }
    return { deleted: results.length };
  };

  return {
    getAll,
    getById,
    getByPhone,
    create,
    update,
    delete: softDelete ? softRemove : hardRemove,
    getRecent,
    search,
    getStats,
    exportToExcel,
    importFromExcel,
    bulkDelete,
  };
}

function toCsv(items, keys) {
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = keys.join(',');
  const rows = items.map((item) => keys.map((k) => escape(item[k])).join(','));
  return [header, ...rows].join('\n');
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