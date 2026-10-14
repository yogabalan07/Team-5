// src/services/partyCrud.js
// Enterprise implementation for Customer & Supplier services on Firestore.
// Supports Party Groups, Multi-Address Handling, Credit Terms & Limits,
// Detailed Transaction History, and Account Statement Generation.

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
import { buildSearchText, nowISO, round2, sortByCreatedDesc } from './businessLogic';

export function makePartyService({
  collectionName,
  creditEnabled = false,
  softDelete = true,
}) {
  const isCustomer = collectionName === 'customers';

  const buildPayload = (data, existing = {}) => {
    const name = data.name !== undefined ? String(data.name).trim() : existing.name;
    const phone = data.phone !== undefined ? String(data.phone).trim() : existing.phone || '';
    const email = data.email !== undefined ? String(data.email).trim().toLowerCase() : existing.email || '';
    const contactPerson = data.contactPerson !== undefined ? String(data.contactPerson).trim() : existing.contactPerson || '';
    const alternatePhone = data.alternatePhone !== undefined ? String(data.alternatePhone).trim() : existing.alternatePhone || '';
    const address = data.address !== undefined ? data.address : existing.address || '';
    const billingAddress = data.billingAddress !== undefined ? data.billingAddress : existing.billingAddress || address;
    const shippingAddress = data.shippingAddress !== undefined ? data.shippingAddress : existing.shippingAddress || address;
    const city = data.city !== undefined ? data.city : existing.city || '';
    const state = data.state !== undefined ? data.state : existing.state || '';
    const pincode = data.pincode !== undefined ? data.pincode : existing.pincode || '';
    const country = data.country !== undefined ? data.country : existing.country || 'India';
    const area = data.area !== undefined ? data.area : existing.area || '';
    const gstNo = data.gstNo !== undefined ? String(data.gstNo).trim().toUpperCase() : existing.gstNo || '';
    const panNo = data.panNo !== undefined ? String(data.panNo).trim().toUpperCase() : existing.panNo || '';
    const groupId = data.groupId !== undefined ? data.groupId : existing.groupId || '';
    const groupName = data.groupName !== undefined ? data.groupName : existing.groupName || '';
    const creditLimit = data.creditLimit !== undefined ? round2(Number(data.creditLimit) || 0) : existing.creditLimit || 0;
    const creditDays = data.creditDays !== undefined ? Number(data.creditDays) || 0 : existing.creditDays || 0;
    const openingBalance = data.openingBalance !== undefined ? round2(Number(data.openingBalance) || 0) : existing.openingBalance || 0;
    const creditBalance = data.creditBalance !== undefined
      ? round2(Number(data.creditBalance) || 0)
      : existing.creditBalance !== undefined
      ? existing.creditBalance
      : openingBalance;

    const bankName = data.bankName !== undefined ? data.bankName : existing.bankName || '';
    const accountNumber = data.accountNumber !== undefined ? data.accountNumber : existing.accountNumber || '';
    const ifscCode = data.ifscCode !== undefined ? data.ifscCode : existing.ifscCode || '';
    const branch = data.branch !== undefined ? data.branch : existing.branch || '';
    const notes = data.notes !== undefined ? data.notes : existing.notes || '';
    const isActive = data.isActive !== undefined ? Boolean(data.isActive) : existing.isActive !== false;

    return {
      name,
      contactPerson,
      phone,
      alternatePhone,
      email,
      address,
      billingAddress,
      shippingAddress,
      city,
      state,
      pincode,
      country,
      area,
      gstNo,
      panNo,
      groupId,
      groupName,
      creditLimit,
      creditDays,
      openingBalance,
      creditBalance,
      outstandingBalance: creditBalance,
      bankName,
      accountNumber,
      ifscCode,
      branch,
      notes,
      isActive,
      updatedAt: nowISO(),
      searchText: buildSearchText(
        name,
        contactPerson,
        phone,
        alternatePhone,
        email,
        area,
        city,
        state,
        gstNo,
        panNo,
        groupName
      ),
    };
  };

  const getAll = async (page = 0, size = 20, search = '') => {
    return getPaged(col(collectionName), { page, size, search });
  };

  const getById = async (id) => getByIdOr404(col(collectionName), id);

  const getByPhone = async (phone) => {
    const snap = await getDocs(query(col(collectionName), where('phone', '==', phone), limit(1)));
    const items = fromQuery(snap);
    if (!items.length) {
      throw serviceError(`${isCustomer ? 'Customer' : 'Supplier'} with phone ${phone} not found`, 404);
    }
    return items[0];
  };

  const create = async (data) => {
    requireAuth();
    if (!data.name || String(data.name).trim() === '') {
      throw serviceError(`${isCustomer ? 'Customer' : 'Supplier'} Name is required`, 400);
    }
    const payload = {
      ...buildPayload(data),
      createdAt: nowISO(),
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
    const active = all.filter((c) => c.isActive !== false);
    const totalBalance = all.reduce((sum, c) => sum + (Number(c.creditBalance) || 0), 0);
    const withDues = all.filter((c) => (Number(c.creditBalance) || 0) > 0);
    return {
      total: all.length,
      active: active.length,
      inactive: all.length - active.length,
      totalBalance: round2(totalBalance),
      partiesWithDue: withDues.length,
    };
  };

  // ---- Statement & Ledger History -----------------------------------------
  const getStatement = async (partyId, startDate = '', endDate = '') => {
    const party = await getById(partyId);
    const idStr = String(partyId);

    let entries = [];
    if (isCustomer) {
      // Fetch customer invoices, receipts, returns
      const [invSnap, recSnap, retSnap] = await Promise.all([
        getDocs(query(col('salesInvoices'), where('customerId', '==', idStr))),
        getDocs(query(col('billReceipts'), where('customerId', '==', idStr))),
        getDocs(query(col('salesReturns'), where('customerId', '==', idStr))),
      ]);

      fromQuery(invSnap).forEach((inv) => {
        entries.push({
          id: inv.id,
          date: (inv.invoiceDate || inv.createdAt || '').slice(0, 10),
          type: 'INVOICE',
          refNo: inv.invoiceNo,
          description: `Sales Invoice #${inv.invoiceNo}`,
          debit: round2(inv.grandTotal || inv.netAmount || 0),
          credit: 0,
          rawDate: inv.invoiceDate || inv.createdAt,
        });
      });

      fromQuery(recSnap).forEach((rec) => {
        entries.push({
          id: rec.id,
          date: (rec.receiptDate || rec.createdAt || '').slice(0, 10),
          type: 'RECEIPT',
          refNo: rec.receiptNo,
          description: `Payment Receipt #${rec.receiptNo} (${rec.paymentMethod || 'CASH'})`,
          debit: 0,
          credit: round2(rec.amount || 0),
          rawDate: rec.receiptDate || rec.createdAt,
        });
      });

      fromQuery(retSnap).forEach((ret) => {
        entries.push({
          id: ret.id,
          date: (ret.returnDate || ret.createdAt || '').slice(0, 10),
          type: 'RETURN',
          refNo: ret.returnNo,
          description: `Sales Return #${ret.returnNo}`,
          debit: 0,
          credit: round2(ret.totalAmount || ret.totalRefund || 0),
          rawDate: ret.returnDate || ret.createdAt,
        });
      });
    } else {
      // Supplier purchase invoices, payments, returns
      const [purSnap, paySnap, retSnap] = await Promise.all([
        getDocs(query(col('purchaseInvoices'), where('supplierId', '==', idStr))),
        getDocs(query(col('billPayments'), where('supplierId', '==', idStr))),
        getDocs(query(col('purchaseReturns'), where('supplierId', '==', idStr))),
      ]);

      fromQuery(purSnap).forEach((inv) => {
        entries.push({
          id: inv.id,
          date: (inv.purchaseDate || inv.createdAt || '').slice(0, 10),
          type: 'PURCHASE',
          refNo: inv.invoiceNo,
          description: `Purchase Bill #${inv.invoiceNo}`,
          debit: 0,
          credit: round2(inv.grandTotal || inv.netAmount || 0),
          rawDate: inv.purchaseDate || inv.createdAt,
        });
      });

      fromQuery(paySnap).forEach((pay) => {
        entries.push({
          id: pay.id,
          date: (pay.paymentDate || pay.createdAt || '').slice(0, 10),
          type: 'PAYMENT',
          refNo: pay.paymentNo,
          description: `Payment Voucher #${pay.paymentNo} (${pay.paymentMethod || 'CASH'})`,
          debit: round2(pay.amount || 0),
          credit: 0,
          rawDate: pay.paymentDate || pay.createdAt,
        });
      });

      fromQuery(retSnap).forEach((ret) => {
        entries.push({
          id: ret.id,
          date: (ret.returnDate || ret.createdAt || '').slice(0, 10),
          type: 'RETURN',
          refNo: ret.returnNo,
          description: `Purchase Return #${ret.returnNo}`,
          debit: round2(ret.totalAmount || 0),
          credit: 0,
          rawDate: ret.returnDate || ret.createdAt,
        });
      });
    }

    // Sort chronologically (oldest first) to compute running balances
    entries.sort((a, b) => String(a.date).localeCompare(String(b.date)));

    let running = round2(Number(party.openingBalance) || 0);
    const computedRows = entries.map((entry) => {
      if (isCustomer) {
        running = round2(running + entry.debit - entry.credit);
      } else {
        running = round2(running + entry.credit - entry.debit);
      }
      return {
        ...entry,
        balance: running,
      };
    });

    // Apply date range filter if specified
    const filteredRows = computedRows.filter((r) => {
      if (startDate && r.date < startDate) return false;
      if (endDate && r.date > endDate) return false;
      return true;
    });

    const totalDebit = round2(filteredRows.reduce((s, r) => s + r.debit, 0));
    const totalCredit = round2(filteredRows.reduce((s, r) => s + r.credit, 0));

    return {
      party,
      openingBalance: round2(Number(party.openingBalance) || 0),
      closingBalance: running,
      totalDebit,
      totalCredit,
      transactions: filteredRows,
    };
  };

  const exportToExcel = async (filters = {}) => {
    const { items } = await fetchDocs(col(collectionName), { search: filters.search || '' });
    const headers = ['name', 'contactPerson', 'phone', 'alternatePhone', 'email', 'groupName', 'city', 'state', 'gstNo', 'panNo', 'creditLimit', 'creditBalance'];
    const csv = toCsv(items, headers);
    downloadCsv(csv, `${collectionName}-${nowISO().slice(0, 10)}.csv`);
    return csv;
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
    getStatement,
    exportToExcel,
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