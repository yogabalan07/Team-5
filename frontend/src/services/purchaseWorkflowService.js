// src/services/purchaseWorkflowService.js
// Extended purchase workflow: Purchase Requisitions, Supplier Quotations,
// Purchase Order approvals and Debit Notes. All document numbers are issued
// from the shared counters collection inside Firestore transactions so they
// stay collision-free on the Spark tier.

import { getDocs, doc, setDoc, query, where, limit } from '@firebase/firestore';
import {
  col,
  docOf,
  getByIdOr404,
  getPaged,
  serviceError,
  requireAuth,
  fromQuery,
} from './firestoreHelpers';
import {
  invoiceTotals,
  buildSearchText,
  nowISO,
  todayISO,
  round2,
} from './businessLogic';
import { getCurrentUser } from './authService';
import { runStockTransaction, nextNumber } from './inventoryOps';
import { db } from '../firebase/firebase';

const REQUISITIONS = 'purchaseRequisitions';
const SUPPLIER_QUOTES = 'supplierQuotations';
const DEBIT_NOTES = 'debitNotes';
const ORDERS = 'purchaseOrders';
const PURCHASE_INVOICES = 'purchaseInvoices';

function actorName() {
  const user = getCurrentUser();
  return (user && (user.username || user.email)) || 'unknown';
}

function buildLines(prefix, docId, lines) {
  return (lines || []).map((line, index) => ({
    id: `${prefix}_${docId}_${index + 1}`,
    itemId: line.itemId ? String(line.itemId) : '',
    itemName: line.itemName || '',
    itemCode: line.itemCode || line.sku || '',
    quantity: round2(Number(line.quantity) || 0),
    unitPrice: round2(Number(line.unitPrice) || 0),
    discountPercent: Number(line.discountPercent) || 0,
    taxPercent: Number(line.taxPercent) || 0,
    totalAmount: round2(
      Number(line.totalAmount) || invoiceTotals([line]).totalAmount
    ),
  }));
}

function computeGrandTotal(lines, extra = 0) {
  const totals = invoiceTotals(lines || []);
  return round2(totals.netAmount + (Number(extra) || 0));
}

// Enforces the standard DRAFT -> PENDING -> APPROVED/REJECTED state machine and
// blocks users from approving or rejecting documents they created themselves.
function assertTransition(existing, action, approver) {
  const status = existing.status || 'DRAFT';
  if (action === 'SUBMIT' && !['DRAFT', 'REJECTED'].includes(status)) {
    throw serviceError(`Cannot submit a document in status ${status}`, 400);
  }
  if (action === 'APPROVE' || action === 'REJECT') {
    if (status !== 'PENDING') {
      throw serviceError(`Only documents pending approval can be ${action === 'APPROVE' ? 'approved' : 'rejected'}`, 400);
    }
    if (existing.createdBy && existing.createdBy === approver) {
      throw serviceError('You cannot approve or reject your own submission', 403);
    }
  }
}

async function createInTransaction(collectionName, prefix, dateISO, buildPayload) {
  requireAuth();
  return runStockTransaction(async (tx) => {
    const ref = doc(db, collectionName);
    const number = await nextNumber(tx, prefix, dateISO);
    const payload = buildPayload(number, ref.id);
    await tx.set(ref, payload);
    return { id: ref.id, number, ...payload };
  });
}

export const purchaseWorkflowService = {
  // ==================== PURCHASE REQUISITIONS ====================

  async createRequisition(data) {
    const lines = (data.items || []).map((l) => ({ ...l }));
    const grandTotal = computeGrandTotal(lines);
    return createInTransaction(REQUISITIONS, 'PR', data.requisitionDate || todayISO(), (number, docId) => ({
      requisitionNumber: number,
      requisitionDate: data.requisitionDate || todayISO(),
      requiredBy: data.requiredBy || '',
      department: data.department || '',
      requestedBy: data.requestedBy || actorName(),
      supplierId: data.supplierId ? String(data.supplierId) : '',
      supplierName: data.supplierName || '',
      priority: data.priority || 'NORMAL',
      items: buildLines('pr', docId, lines),
      grandTotal,
      status: 'DRAFT', // DRAFT, PENDING, APPROVED, REJECTED, CONVERTED
      approvalNote: '',
      approvedBy: '',
      approvedAt: '',
      notes: data.notes || '',
      createdBy: actorName(),
      createdAt: nowISO(),
      updatedAt: nowISO(),
      searchText: buildSearchText(number, data.department, data.requestedBy),
    }));
  },

  async updateRequisition(id, data) {
    requireAuth();
    const existing = await getByIdOr404(col(REQUISITIONS), id);
    if (!['DRAFT', 'REJECTED'].includes(existing.status)) {
      throw serviceError('Only draft or rejected requisitions can be edited', 400);
    }
    const lines = (data.items || existing.items || []).map((l) => ({ ...l }));
    const payload = {
      ...existing,
      requisitionDate: data.requisitionDate || existing.requisitionDate,
      requiredBy: data.requiredBy !== undefined ? data.requiredBy : existing.requiredBy,
      department: data.department !== undefined ? data.department : existing.department,
      supplierId: data.supplierId !== undefined ? (data.supplierId ? String(data.supplierId) : '') : existing.supplierId,
      supplierName: data.supplierName !== undefined ? data.supplierName : existing.supplierName,
      priority: data.priority || existing.priority,
      items: buildLines('pr', id, lines),
      grandTotal: computeGrandTotal(lines),
      notes: data.notes !== undefined ? data.notes : existing.notes,
      updatedAt: nowISO(),
    };
    delete payload.id;
    await setDoc(docOf(REQUISITIONS, id), payload, { merge: true });
    return { id, ...payload };
  },

  async getRequisitions(page = 0, size = 20, search = '') {
    return getPaged(col(REQUISITIONS), { page, size, search });
  },

  async getRequisitionById(id) {
    const data = await getByIdOr404(col(REQUISITIONS), id);
    return { ...data, items: data.items || [] };
  },

  async submitRequisition(id) {
    requireAuth();
    const existing = await getByIdOr404(col(REQUISITIONS), id);
    assertTransition(existing, 'SUBMIT', actorName());
    await setDoc(docOf(REQUISITIONS, id), { status: 'PENDING', updatedAt: nowISO() }, { merge: true });
    return { id, status: 'PENDING' };
  },

  async approveRequisition(id, note = '') {
    requireAuth();
    const existing = await getByIdOr404(col(REQUISITIONS), id);
    assertTransition(existing, 'APPROVE', actorName());
    await setDoc(docOf(REQUISITIONS, id), {
      status: 'APPROVED',
      approvalNote: note,
      approvedBy: actorName(),
      approvedAt: nowISO(),
      updatedAt: nowISO(),
    }, { merge: true });
    return { id, status: 'APPROVED' };
  },

  async rejectRequisition(id, note = '') {
    requireAuth();
    const existing = await getByIdOr404(col(REQUISITIONS), id);
    assertTransition(existing, 'REJECT', actorName());
    await setDoc(docOf(REQUISITIONS, id), {
      status: 'REJECTED',
      approvalNote: note,
      approvedBy: actorName(),
      approvedAt: nowISO(),
      updatedAt: nowISO(),
    }, { merge: true });
    return { id, status: 'REJECTED' };
  },

  // Converts an APPROVED requisition into a real purchase order. The PO
  // creation and the requisition status change happen in ONE transaction so a
  // failure can never leave a duplicated or half-converted document.
  async convertRequisitionToOrder(id) {
    requireAuth();
    return runStockTransaction(async (tx) => {
      const reqSnap = await tx.get(docOf(REQUISITIONS, id));
      if (!reqSnap.exists()) throw serviceError('Requisition not found', 404);
      const existing = reqSnap.data();
      if (existing.status !== 'APPROVED') {
        throw serviceError('Only approved requisitions can be converted to a purchase order', 400);
      }

      const poRef = doc(db, ORDERS);
      const poNumber = await nextNumber(tx, 'PO', todayISO());
      const items = (existing.items || []).map((line, index) => ({
        id: `po_${poRef.id}_${index + 1}`,
        itemId: line.itemId ? String(line.itemId) : '',
        itemName: line.itemName || '',
        itemCode: line.itemCode || '',
        quantity: round2(Number(line.quantity) || 0),
        unitPrice: round2(Number(line.unitPrice) || 0),
        totalAmount: round2(Number(line.totalAmount) || 0),
        receivedQuantity: 0,
        status: 'PENDING',
      }));
      await tx.set(poRef, {
        poNumber,
        poDate: todayISO(),
        expectedDate: existing.requiredBy || '',
        supplierId: existing.supplierId || '',
        supplierName: existing.supplierName || '',
        items,
        status: 'OPEN',
        approvalStatus: 'APPROVED',
        approvalNote: `Auto-approved via requisition ${existing.requisitionNumber}`,
        approvedBy: existing.approvedBy || '',
        approvedAt: existing.approvedAt || '',
        note: `Converted from requisition ${existing.requisitionNumber}`,
        createdBy: actorName(),
        createdAt: nowISO(),
        updatedAt: nowISO(),
        searchText: buildSearchText(poNumber, existing.supplierName),
      });
      tx.update(docOf(REQUISITIONS, id), {
        status: 'CONVERTED',
        convertedPoId: poNumber,
        updatedAt: nowISO(),
      });
      return { requisitionId: id, poNumber, poId: poRef.id };
    });
  },

  async deleteRequisition(id) {
    requireAuth();
    const existing = await getByIdOr404(col(REQUISITIONS), id);
    if (!['DRAFT', 'REJECTED'].includes(existing.status)) {
      throw serviceError('Only draft or rejected requisitions can be deleted', 400);
    }
    const { deleteDoc } = await import('@firebase/firestore');
    await deleteDoc(docOf(REQUISITIONS, id));
    return { id, deleted: true };
  },

  // ==================== SUPPLIER QUOTATIONS ====================

  async createSupplierQuotation(data) {
    const lines = (data.items || []).map((l) => ({ ...l }));
    const grandTotal = computeGrandTotal(lines, data.freightCharges);
    return createInTransaction(SUPPLIER_QUOTES, 'SQ', data.quoteDate || todayISO(), (number, docId) => ({
      quotationNumber: number,
      quoteDate: data.quoteDate || todayISO(),
      validUntil: data.validUntil || '',
      supplierId: data.supplierId ? String(data.supplierId) : '',
      supplierName: data.supplierName || '',
      contactPerson: data.contactPerson || '',
      items: buildLines('sq', docId, lines),
      freightCharges: round2(Number(data.freightCharges) || 0),
      grandTotal,
      paymentTerms: data.paymentTerms || '',
      status: data.status || 'DRAFT', // DRAFT, SENT, ACCEPTED, REJECTED, CONVERTED
      notes: data.notes || '',
      createdBy: actorName(),
      createdAt: nowISO(),
      updatedAt: nowISO(),
      searchText: buildSearchText(number, data.supplierName, data.contactPerson),
    }));
  },

  async updateSupplierQuotation(id, data) {
    requireAuth();
    const existing = await getByIdOr404(col(SUPPLIER_QUOTES), id);
    if (existing.status === 'CONVERTED') {
      throw serviceError('Converted quotations cannot be edited', 400);
    }
    const lines = (data.items || existing.items || []).map((l) => ({ ...l }));
    const freight = round2(Number(data.freightCharges !== undefined ? data.freightCharges : existing.freightCharges) || 0);
    const payload = {
      ...existing,
      quoteDate: data.quoteDate || existing.quoteDate,
      validUntil: data.validUntil !== undefined ? data.validUntil : existing.validUntil,
      supplierId: data.supplierId !== undefined ? (data.supplierId ? String(data.supplierId) : '') : existing.supplierId,
      supplierName: data.supplierName !== undefined ? data.supplierName : existing.supplierName,
      contactPerson: data.contactPerson !== undefined ? data.contactPerson : existing.contactPerson,
      items: buildLines('sq', id, lines),
      freightCharges: freight,
      grandTotal: computeGrandTotal(lines, freight),
      paymentTerms: data.paymentTerms !== undefined ? data.paymentTerms : existing.paymentTerms,
      status: data.status || existing.status,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      updatedAt: nowISO(),
      searchText: buildSearchText(existing.quotationNumber, data.supplierName || existing.supplierName, data.contactPerson || existing.contactPerson),
    };
    delete payload.id;
    await setDoc(docOf(SUPPLIER_QUOTES, id), payload, { merge: true });
    return { id, ...payload };
  },

  async getSupplierQuotations(page = 0, size = 20, search = '') {
    return getPaged(col(SUPPLIER_QUOTES), { page, size, search });
  },

  async getSupplierQuotationById(id) {
    const data = await getByIdOr404(col(SUPPLIER_QUOTES), id);
    return { ...data, items: data.items || [] };
  },

  async setSupplierQuotationStatus(id, status) {
    requireAuth();
    const allowed = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'];
    if (!allowed.includes(status)) throw serviceError(`Invalid status ${status}`, 400);
    const existing = await getByIdOr404(col(SUPPLIER_QUOTES), id);
    if (existing.status === 'CONVERTED') {
      throw serviceError('Converted quotations cannot change status', 400);
    }
    await setDoc(docOf(SUPPLIER_QUOTES, id), { status, updatedAt: nowISO() }, { merge: true });
    return { id, status };
  },

  // ACCEPTED supplier quotation -> purchase order, in a single transaction.
  async convertSupplierQuotationToOrder(id) {
    requireAuth();
    return runStockTransaction(async (tx) => {
      const qSnap = await tx.get(docOf(SUPPLIER_QUOTES, id));
      if (!qSnap.exists()) throw serviceError('Supplier quotation not found', 404);
      const existing = qSnap.data();
      if (existing.status !== 'ACCEPTED') {
        throw serviceError('Only accepted supplier quotations can be converted to a purchase order', 400);
      }

      const poRef = doc(db, ORDERS);
      const poNumber = await nextNumber(tx, 'PO', todayISO());
      const items = (existing.items || []).map((line, index) => ({
        id: `po_${poRef.id}_${index + 1}`,
        itemId: line.itemId ? String(line.itemId) : '',
        itemName: line.itemName || '',
        itemCode: line.itemCode || '',
        quantity: round2(Number(line.quantity) || 0),
        unitPrice: round2(Number(line.unitPrice) || 0),
        totalAmount: round2(Number(line.totalAmount) || 0),
        receivedQuantity: 0,
        status: 'PENDING',
      }));
      await tx.set(poRef, {
        poNumber,
        poDate: todayISO(),
        expectedDate: existing.validUntil || '',
        supplierId: existing.supplierId || '',
        supplierName: existing.supplierName || '',
        items,
        status: 'OPEN',
        approvalStatus: 'PENDING',
        approvalNote: '',
        approvedBy: '',
        approvedAt: '',
        note: `Converted from supplier quotation ${existing.quotationNumber}`,
        createdBy: actorName(),
        createdAt: nowISO(),
        updatedAt: nowISO(),
        searchText: buildSearchText(poNumber, existing.supplierName),
      });
      tx.update(docOf(SUPPLIER_QUOTES, id), {
        status: 'CONVERTED',
        convertedPoId: poNumber,
        updatedAt: nowISO(),
      });
      return { quotationId: id, poNumber, poId: poRef.id };
    });
  },

  async deleteSupplierQuotation(id) {
    requireAuth();
    const existing = await getByIdOr404(col(SUPPLIER_QUOTES), id);
    if (existing.status === 'CONVERTED') {
      throw serviceError('Converted quotations cannot be deleted', 400);
    }
    const { deleteDoc } = await import('@firebase/firestore');
    await deleteDoc(docOf(SUPPLIER_QUOTES, id));
    return { id, deleted: true };
  },

  // ==================== PURCHASE ORDER APPROVALS ====================

  async submitOrderForApproval(id) {
    requireAuth();
    const existing = await getByIdOr404(col(ORDERS), id);
    const status = existing.approvalStatus || 'DRAFT';
    if (!['DRAFT', 'REJECTED'].includes(status)) {
      throw serviceError(`Order is already ${status}`, 400);
    }
    await setDoc(docOf(ORDERS, id), {
      approvalStatus: 'PENDING',
      approvalNote: '',
      updatedAt: nowISO(),
    }, { merge: true });
    return { id, approvalStatus: 'PENDING' };
  },

  async approveOrder(id, note = '') {
    requireAuth();
    const existing = await getByIdOr404(col(ORDERS), id);
    assertTransition(
      { status: existing.approvalStatus || 'DRAFT', createdBy: existing.createdBy },
      'APPROVE',
      actorName()
    );
    await setDoc(docOf(ORDERS, id), {
      approvalStatus: 'APPROVED',
      approvalNote: note,
      approvedBy: actorName(),
      approvedAt: nowISO(),
      updatedAt: nowISO(),
    }, { merge: true });
    return { id, approvalStatus: 'APPROVED' };
  },

  async rejectOrder(id, note = '') {
    requireAuth();
    const existing = await getByIdOr404(col(ORDERS), id);
    assertTransition(
      { status: existing.approvalStatus || 'DRAFT', createdBy: existing.createdBy },
      'REJECT',
      actorName()
    );
    await setDoc(docOf(ORDERS, id), {
      approvalStatus: 'REJECTED',
      approvalNote: note,
      approvedBy: actorName(),
      approvedAt: nowISO(),
      updatedAt: nowISO(),
    }, { merge: true });
    return { id, approvalStatus: 'REJECTED' };
  },

  // ==================== DEBIT NOTES ====================

  // Debits the supplier account against a purchase invoice. The supplier
  // balance update touches ONLY creditBalance so ACCOUNTS-role rules that
  // restrict updates to that single field are satisfied.
  async createDebitNote(data) {
    requireAuth();
    const amount = round2(Number(data.amount) || 0);
    if (amount <= 0) throw serviceError('Debit note amount must be greater than zero', 400);

    return runStockTransaction(async (tx) => {
      const ref = doc(db, DEBIT_NOTES);
      const noteNumber = await nextNumber(tx, 'DBN', data.noteDate || todayISO());

      const payload = {
        noteNumber,
        noteDate: data.noteDate || todayISO(),
        purchaseInvoiceId: data.purchaseInvoiceId ? String(data.purchaseInvoiceId) : '',
        invoiceNo: data.invoiceNo || '',
        supplierId: data.supplierId ? String(data.supplierId) : '',
        supplierName: data.supplierName || '',
        amount,
        reason: data.reason || 'Short delivery / price difference / damaged goods',
        createdBy: actorName(),
        createdAt: nowISO(),
        updatedAt: nowISO(),
        searchText: buildSearchText(noteNumber, data.invoiceNo, data.supplierName),
      };
      await tx.set(ref, payload);

      if (data.supplierId) {
        const supRef = docOf('suppliers', String(data.supplierId));
        const supSnap = await tx.get(supRef);
        if (supSnap.exists()) {
          const current = Number(supSnap.data().creditBalance) || 0;
          tx.update(supRef, { creditBalance: Math.max(0, round2(current - amount)) });
        }
      }

      if (data.purchaseInvoiceId) {
        const invRef = docOf(PURCHASE_INVOICES, String(data.purchaseInvoiceId));
        const invSnap = await tx.get(invRef);
        if (invSnap.exists()) {
          const currentBal = Number(invSnap.data().balanceAmount) || 0;
          const newBal = Math.max(0, round2(currentBal - amount));
          tx.update(invRef, {
            balanceAmount: newBal,
            paymentStatus: newBal <= 0 ? 'PAID' : 'DUE',
            updatedAt: nowISO(),
          });
        }
      }

      return { noteNumber, id: ref.id, ...payload };
    });
  },

  async getDebitNotes(page = 0, size = 20, search = '') {
    return getPaged(col(DEBIT_NOTES), { page, size, search });
  },

  async getPurchaseInvoiceByNo(invoiceNo) {
    const snap = await getDocs(query(col(PURCHASE_INVOICES), where('invoiceNo', '==', invoiceNo), limit(1)));
    const docs = fromQuery(snap);
    if (!docs.length) throw serviceError(`Purchase invoice ${invoiceNo} not found`, 404);
    return { ...docs[0], items: docs[0].items || [] };
  },
};

export default purchaseWorkflowService;
