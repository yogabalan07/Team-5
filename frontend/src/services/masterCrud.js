// src/services/masterCrud.js
// Factory for the small master-data services (brands, groups, sections, units,
// taxes). All reads are available to any signed-in user; writes follow the
// legacy role rules enforced again in Firestore security rules.

import { getDocs, doc, setDoc, deleteDoc, addDoc } from '@firebase/firestore';
import {
  col,
  getByIdOr404,
  serviceError,
  requireAuth,
  fromQuery,
} from './firestoreHelpers';
import { buildSearchText, nowISO } from './businessLogic';

export function makeMasterService(collectionName, uniqueFields = ['name']) {
  const isUnit = collectionName === 'units';
  const isTax = collectionName === 'taxes';

  const getAll = async () => {
    const snap = await getDocs(col(collectionName));
    const items = fromQuery(snap);
    return items.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  };

  const getById = async (id) => getByIdOr404(col(collectionName), id);

  const assertUnique = async (data, excludeId = null) => {
    if (!uniqueFields.length) return;
    const all = await getAll();
    for (const field of uniqueFields) {
      const value = data[field];
      if (!value) continue;
      const normalized = String(value).trim().toLowerCase();
      const conflict = all.find(
        (existing) =>
          existing.id !== excludeId &&
          existing[field] &&
          String(existing[field]).trim().toLowerCase() === normalized
      );
      if (conflict) {
        throw serviceError(`${field === 'name' ? 'Name' : field} already exists: ${value}`, 400);
      }
    }
  };

  const buildPayload = (data, existing = {}) => ({
    name: data.name !== undefined ? data.name : existing.name,
    ...(isUnit
      ? { shortName: data.shortName !== undefined ? data.shortName : existing.shortName || '' }
      : {}),
    description: data.description !== undefined ? data.description : existing.description || '',
    ...(isTax
      ? { taxPercentage: data.taxPercentage !== undefined ? Number(data.taxPercentage) : existing.taxPercentage || 0 }
      : {}),
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : existing.isActive !== false,
    updatedAt: nowISO(),
    searchText: buildSearchText(
      data.name !== undefined ? data.name : existing.name,
      isUnit ? data.shortName : '',
      data.description
    ),
  });

  const create = async (data) => {
    requireAuth();
    const payload = {
      ...buildPayload(data),
      createdAt: nowISO(),
    };
    await assertUnique(payload);
    const ref = await addDoc(col(collectionName), payload);
    return { ...payload, id: ref.id };
  };

  const update = async (id, data) => {
    requireAuth();
    const existing = await getById(id);
    const payload = buildPayload(data, existing);
    await assertUnique(payload, id);
    await setDoc(doc(col(collectionName), id), payload, { merge: true });
    return { ...existing, ...payload, id };
  };

  const remove = async (id) => {
    requireAuth();
    await deleteDoc(doc(col(collectionName), id));
    return { id, deleted: true };
  };

  return { getAll, getById, create, update, delete: remove };
}