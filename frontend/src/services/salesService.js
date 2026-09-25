// src/services/salesService.js
// Enterprise Firestore-backed Sales Lifecycle Service.
// Supports: Quotations -> Sales Orders -> Stock Availability Check -> Deliveries
// -> Sales Invoices (Atomic Stock Decrement & Dues) -> Credit Notes.

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
  computePayment,
  buildSearchText,
  nowISO,
  todayISO,
  round2,
  slicePage,
  sortByCreatedDesc,
} from './businessLogic';
import { getCurrentUser } from './authService';
import {
  runStockTransaction,
  nextNumber,
  applyStockLine,
  TYPE_SALES,
} from './inventoryOps';
import { db } from '../firebase/firebase';

const QUOTATIONS = 'salesQuotations';
const ORDERS = 'salesOrders';
const DELIVERIES = 'deliveries';
const INVOICES = 'salesInvoices';
const CREDIT_NOTES = 'creditNotes';

function actorName() {
  const user = getCurrentUser();
  return (user && (user.username || user.email)) || 'unknown';
}

function buildItems(prefix, docId, lines) {
  return (lines || []).map((line, index) => ({
    id: `${prefix}_${docId}_${index + 1}`,
    itemId: line.itemId ? String(line.itemId) : '',
    itemName: line.itemName || '',
    itemCode: line.itemCode || line.sku || '',
    quantity: round2(Number(line.quantity) || 0),
    unitPrice: round2(Number(line.unitPrice) || 0),
    discountPercent: Number(line.discountPercent) || 0,
    taxPercent: Number(line.taxPercent) || 0,
    totalAmount: round2(Number(line.totalAmount) || invoiceTotals([line]).totalAmount),
    discountAmount: round2(Number(line.discountAmount) || 0),
    taxAmount: round2(Number(line.taxAmount) || 0),
    hsnCode: line.hsnCode || '',
    batchNumber: line.batchNumber || '',
  }));
}

function wrapStockError(e, fallback = 'Could not save sales transaction') {
  const message = (e && e.message) || fallback;
  const status = (e && e.code === 'INSUFFICIENT_STOCK') ? 400 : 500;
  return serviceError(message, status);
}

export const salesService = {
  // ==================== 1. SALES QUOTATIONS ====================

  async createQuotation(data) {
    requireAuth();
    const lines = (data.items || []).map((l) => ({ ...l }));
    const totals = invoiceTotals(lines);
    const freight = round2(Number(data.freightCharges) || 0);
    const grandTotal = round2(totals.netAmount + freight);

    return runStockTransaction(async (tx) => {
      const qtnRef = doc(db, QUOTATIONS);
      const qtnNumber = await nextNumber(tx, 'QTN', data.quotationDate || todayISO());
      const finalItems = buildItems('qtn', qtnRef.id, lines);

      const payload = {
        quotationNumber: qtnNumber,
        quotationDate: data.quotationDate || todayISO(),
        validUntil: data.validUntil || '',
        customerId: data.customerId ? String(data.customerId) : '',
        customerName: data.customerName || '',
        customerPhone: data.customerPhone || '',
        customerAddress: data.customerAddress || '',
        salespersonId: data.salespersonId || '',
        salespersonName: data.salespersonName || '',
        items: finalItems,
        subtotal: totals.totalAmount,
        discountTotal: totals.discountAmount,
        taxTotal: totals.taxAmount,
        freightCharges: freight,
        grandTotal,
        status: data.status || 'DRAFT', // DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED, CONVERTED
        notes: data.notes || data.terms || '',
        createdBy: actorName(),
        createdAt: nowISO(),
        updatedAt: nowISO(),
        searchText: buildSearchText(qtnNumber, data.customerName, data.customerPhone, data.salespersonName),
      };

      await tx.set(qtnRef, payload);
      return { quotationNumber: qtnNumber, id: qtnRef.id, ...payload };
    });
  },

  async getQuotations(page = 0, size = 20, search = '') {
    return getPaged(col(QUOTATIONS), { page, size, search });
  },

  async getQuotationById(id) {
    return getByIdOr404(col(QUOTATIONS), id);
  },

  async updateQuotation(id, data) {
    requireAuth();
    const existing = await getByIdOr404(col(QUOTATIONS), id);
    const lines = (data.items || existing.items || []).map((l) => ({ ...l }));
    const totals = invoiceTotals(lines);
    const freight = round2(Number(data.freightCharges !== undefined ? data.freightCharges : existing.freightCharges) || 0);
    const grandTotal = round2(totals.netAmount + freight);
    const finalItems = buildItems('qtn', id, lines);

    const payload = {
      ...existing,
      quotationDate: data.quotationDate || existing.quotationDate,
      validUntil: data.validUntil !== undefined ? data.validUntil : existing.validUntil,
      customerId: data.customerId ? String(data.customerId) : existing.customerId,
      customerName: data.customerName !== undefined ? data.customerName : existing.customerName,
      customerPhone: data.customerPhone !== undefined ? data.customerPhone : existing.customerPhone,
      customerAddress: data.customerAddress !== undefined ? data.customerAddress : existing.customerAddress,
      salespersonId: data.salespersonId !== undefined ? data.salespersonId : existing.salespersonId,
      salespersonName: data.salespersonName !== undefined ? data.salespersonName : existing.salespersonName,
      items: finalItems,
      subtotal: totals.totalAmount,
      discountTotal: totals.discountAmount,
      taxTotal: totals.taxAmount,
      freightCharges: freight,
      grandTotal,
      status: data.status || existing.status,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      updatedAt: nowISO(),
      searchText: buildSearchText(existing.quotationNumber, data.customerName || existing.customerName, data.customerPhone || existing.customerPhone),
    };

    delete payload.id;
    await setDoc(docOf(QUOTATIONS, id), payload, { merge: true });
    return { id, ...payload };
  },

  // ==================== 2. SALES ORDERS ====================

  async createOrder(data) {
    requireAuth();
    const lines = (data.items || []).map((l) => ({ ...l }));
    const totals = invoiceTotals(lines);
    const freight = round2(Number(data.freightCharges) || 0);
    const grandTotal = round2(totals.netAmount + freight);

    return runStockTransaction(async (tx) => {
      const orderRef = doc(db, ORDERS);
      const orderNumber = await nextNumber(tx, 'SO', data.orderDate || todayISO());
      const finalItems = buildItems('so', orderRef.id, lines);

      const payload = {
        orderNumber,
        orderDate: data.orderDate || todayISO(),
        expectedDeliveryDate: data.expectedDeliveryDate || '',
        quotationId: data.quotationId || '',
        quotationNumber: data.quotationNumber || '',
        customerId: data.customerId ? String(data.customerId) : '',
        customerName: data.customerName || '',
        customerPhone: data.customerPhone || '',
        shippingAddress: data.shippingAddress || '',
        billingAddress: data.billingAddress || '',
        salespersonId: data.salespersonId || '',
        salespersonName: data.salespersonName || '',
        items: finalItems,
        subtotal: totals.totalAmount,
        discountTotal: totals.discountAmount,
        taxTotal: totals.taxAmount,
        freightCharges: freight,
        grandTotal,
        paymentTerms: data.paymentTerms || '30 Days Net',
        status: data.status || 'CONFIRMED', // DRAFT, CONFIRMED, PROCESSING, DISPATCHED, DELIVERED, INVOICED, CANCELLED
        notes: data.notes || '',
        createdBy: actorName(),
        createdAt: nowISO(),
        updatedAt: nowISO(),
        searchText: buildSearchText(orderNumber, data.customerName, data.customerPhone, data.salespersonName),
      };

      await tx.set(orderRef, payload);

      // If created from quotation, mark quotation as CONVERTED
      if (data.quotationId) {
        const qSnap = await tx.get(docOf(QUOTATIONS, data.quotationId));
        if (qSnap.exists()) {
          tx.update(docOf(QUOTATIONS, data.quotationId), { status: 'CONVERTED', updatedAt: nowISO() });
        }
      }

      return { orderNumber, id: orderRef.id, ...payload };
    });
  },

  async getOrders(page = 0, size = 20, search = '') {
    return getPaged(col(ORDERS), { page, size, search });
  },

  async getOrderById(id) {
    return getByIdOr404(col(ORDERS), id);
  },

  async updateOrder(id, data) {
    requireAuth();
    const existing = await getByIdOr404(col(ORDERS), id);
    const lines = (data.items || existing.items || []).map((l) => ({ ...l }));
    const totals = invoiceTotals(lines);
    const freight = round2(Number(data.freightCharges !== undefined ? data.freightCharges : existing.freightCharges) || 0);
    const grandTotal = round2(totals.netAmount + freight);
    const finalItems = buildItems('so', id, lines);

    const payload = {
      ...existing,
      orderDate: data.orderDate || existing.orderDate,
      expectedDeliveryDate: data.expectedDeliveryDate !== undefined ? data.expectedDeliveryDate : existing.expectedDeliveryDate,
      customerId: data.customerId ? String(data.customerId) : existing.customerId,
      customerName: data.customerName !== undefined ? data.customerName : existing.customerName,
      customerPhone: data.customerPhone !== undefined ? data.customerPhone : existing.customerPhone,
      shippingAddress: data.shippingAddress !== undefined ? data.shippingAddress : existing.shippingAddress,
      billingAddress: data.billingAddress !== undefined ? data.billingAddress : existing.billingAddress,
      salespersonId: data.salespersonId !== undefined ? data.salespersonId : existing.salespersonId,
      salespersonName: data.salespersonName !== undefined ? data.salespersonName : existing.salespersonName,
      items: finalItems,
      subtotal: totals.totalAmount,
      discountTotal: totals.discountAmount,
      taxTotal: totals.taxAmount,
      freightCharges: freight,
      grandTotal,
      paymentTerms: data.paymentTerms !== undefined ? data.paymentTerms : existing.paymentTerms,
      status: data.status || existing.status,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      updatedAt: nowISO(),
      searchText: buildSearchText(existing.orderNumber, data.customerName || existing.customerName, data.customerPhone || existing.customerPhone),
    };

    delete payload.id;
    await setDoc(docOf(ORDERS, id), payload, { merge: true });
    return { id, ...payload };
  },

  // Stock Availability Checker
  async checkStockAvailability(items = []) {
    const results = [];
    for (const item of items) {
      if (!item.itemId) continue;
      try {
        const master = await getByIdOr404(col('items'), item.itemId);
        const current = Number(master.currentStock) || 0;
        const requested = Number(item.quantity) || 0;
        results.push({
          itemId: item.itemId,
          itemName: master.name,
          itemCode: master.itemCode || master.sku,
          currentStock: current,
          requestedQuantity: requested,
          isAvailable: current >= requested,
          shortage: Math.max(0, requested - current),
        });
      } catch (e) {
        results.push({
          itemId: item.itemId,
          itemName: item.itemName || 'Unknown Item',
          currentStock: 0,
          requestedQuantity: Number(item.quantity) || 0,
          isAvailable: false,
          shortage: Number(item.quantity) || 0,
        });
      }
    }
    const allAvailable = results.every((r) => r.isAvailable);
    return { allAvailable, items: results };
  },

  // ==================== 3. DELIVERIES & DISPATCH ====================

  async createDelivery(data) {
    requireAuth();
    return runStockTransaction(async (tx) => {
      const delRef = doc(db, DELIVERIES);
      const deliveryNo = await nextNumber(tx, 'DN', data.deliveryDate || todayISO());

      const payload = {
        deliveryNo,
        deliveryDate: data.deliveryDate || todayISO(),
        salesOrderId: data.salesOrderId || '',
        orderNumber: data.orderNumber || '',
        customerId: data.customerId ? String(data.customerId) : '',
        customerName: data.customerName || '',
        shippingAddress: data.shippingAddress || '',
        transporterName: data.transporterName || '',
        vehicleNumber: data.vehicleNumber || '',
        trackingId: data.trackingId || '',
        items: data.items || [],
        status: data.status || 'DISPATCHED', // PACKED, DISPATCHED, IN_TRANSIT, DELIVERED
        notes: data.notes || '',
        createdBy: actorName(),
        createdAt: nowISO(),
        updatedAt: nowISO(),
        searchText: buildSearchText(deliveryNo, data.orderNumber, data.customerName, data.trackingId),
      };

      await tx.set(delRef, payload);

      if (data.salesOrderId) {
        const orderSnap = await tx.get(docOf(ORDERS, data.salesOrderId));
        if (orderSnap.exists()) {
          tx.update(docOf(ORDERS, data.salesOrderId), { status: 'DELIVERED', updatedAt: nowISO() });
        }
      }

      return { deliveryNo, id: delRef.id, ...payload };
    });
  },

  async getDeliveries(page = 0, size = 20, search = '') {
    return getPaged(col(DELIVERIES), { page, size, search });
  },

  async getDeliveryById(id) {
    return getByIdOr404(col(DELIVERIES), id);
  },

  // ==================== 4. SALES INVOICES (ATOMIC INVOICE + STOCK + DUES) ====================

  async createInvoice(data) {
    requireAuth();
    const lines = (data.items || []).map((l) => ({
      itemId: l.itemId ? String(l.itemId) : '',
      itemName: l.itemName || '',
      itemCode: l.itemCode || l.sku || '',
      quantity: Number(l.quantity) || 0,
      unitPrice: Number(l.unitPrice) || 0,
      discountPercent: Number(l.discountPercent) || 0,
      taxPercent: Number(l.taxPercent) || 0,
      totalAmount: Number(l.totalAmount) || 0,
      discountAmount: Number(l.discountAmount) || 0,
      taxAmount: Number(l.taxAmount) || 0,
      batchNumber: l.batchNumber || '',
    }));

    const totals = invoiceTotals(lines);
    const freight = round2(Number(data.freightCharges) || 0);
    const netGrandTotal = round2(totals.netAmount + freight);

    const payment = computePayment(data.paymentType || 'CASH', netGrandTotal);
    const paid = data.amountPaid !== undefined && Number(data.amountPaid) >= 0
      ? round2(Number(data.amountPaid))
      : payment.paidAmount;
    const balance = round2(netGrandTotal - paid);

    try {
      return await runStockTransaction(async (tx) => {
        const invoiceRef = doc(db, INVOICES);
        const invoiceNo = await nextNumber(tx, 'INV', data.invoiceDate || todayISO());

        // 1. Atomic Stock Decrement & Stock Ledger Journal
        for (const line of lines) {
          await applyStockLine(tx, {
            itemId: line.itemId,
            itemName: line.itemName,
            itemCode: line.itemCode,
            qty: line.quantity,
            sign: -1,
            type: TYPE_SALES,
            referenceNumber: invoiceNo,
            referenceId: invoiceRef.id,
          });
        }

        const finalLines = buildItems('inv', invoiceRef.id, lines);

        const payload = {
          invoiceNo,
          invoiceDate: data.invoiceDate || todayISO(),
          dueDate: data.dueDate || '',
          salesOrderId: data.salesOrderId || '',
          orderNumber: data.orderNumber || '',
          deliveryNo: data.deliveryNo || '',
          customerId: data.customerId ? String(data.customerId) : '',
          customerName: data.customerName || '',
          customerPhone: data.customerPhone || '',
          customerAddress: data.customerAddress || '',
          customerGstNo: data.customerGstNo || '',
          salespersonId: data.salespersonId || '',
          salespersonName: data.salespersonName || '',
          items: finalLines,
          subtotal: totals.totalAmount,
          discountTotal: totals.discountAmount,
          taxTotal: totals.taxAmount,
          freightCharges: freight,
          grandTotal: netGrandTotal,
          netAmount: netGrandTotal,
          paymentType: data.paymentType || 'CASH',
          amountPaid: paid,
          balanceAmount: balance,
          paymentStatus: balance <= 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'DUE',
          note: data.note || data.notes || '',
          status: 'COMPLETED',
          createdBy: actorName(),
          createdAt: nowISO(),
          updatedAt: nowISO(),
          searchText: buildSearchText(
            invoiceNo,
            data.orderNumber || '',
            data.customerName || '',
            data.customerPhone || '',
            data.salespersonName || ''
          ),
        };

        // 2. Commit Invoice Document
        await tx.set(invoiceRef, payload);

        // 3. Atomically update Customer Credit / Outstanding Due Balance if balance exists
        if (data.customerId && balance > 0) {
          const custRef = docOf('customers', String(data.customerId));
          const custSnap = await tx.get(custRef);
          if (custSnap.exists()) {
            const currentBalance = Number(custSnap.data().creditBalance) || 0;
            tx.update(custRef, {
              creditBalance: round2(currentBalance + balance),
              updatedAt: nowISO(),
            });
          }
        }

        // 4. If linked to Sales Order, mark Order as INVOICED
        if (data.salesOrderId) {
          const orderSnap = await tx.get(docOf(ORDERS, String(data.salesOrderId)));
          if (orderSnap.exists()) {
            tx.update(docOf(ORDERS, String(data.salesOrderId)), { status: 'INVOICED', updatedAt: nowISO() });
          }
        }

        return { invoiceNo, invoiceId: invoiceRef.id, id: invoiceRef.id, ...payload };
      });
    } catch (e) {
      throw wrapStockError(e, 'Could not process sales invoice');
    }
  },

  async getAllInvoices(page = 0, size = 20, search = '') {
    return getPaged(col(INVOICES), { page, size, search });
  },

  async getAll(page = 0, size = 20, search = '') {
    return getPaged(col(INVOICES), { page, size, search });
  },

  async getInvoiceById(id) {
    const data = await getByIdOr404(col(INVOICES), id);
    return { ...data, items: data.items || [] };
  },

  async getById(id) {
    try {
      const data = await getByIdOr404(col(INVOICES), id);
      return { ...data, items: data.items || [] };
    } catch (e) {
      if (e && e.response && e.response.status === 404) return null;
      throw e;
    }
  },

  async getInvoiceByNo(invoiceNo) {
    const snap = await getDocs(query(col(INVOICES), where('invoiceNo', '==', invoiceNo), limit(1)));
    const docs = fromQuery(snap);
    if (!docs.length) throw serviceError(`Invoice ${invoiceNo} not found`, 404);
    return { ...docs[0], items: docs[0].items || [] };
  },

  async updateInvoice(id, data) {
    requireAuth();
    const existing = await getByIdOr404(col(INVOICES), id);
    const reversedLines = existing.items || [];
    const newLines = (data.items || []).map((l) => ({ ...l }));
    const totals = invoiceTotals(newLines);
    const freight = round2(Number(data.freightCharges !== undefined ? data.freightCharges : existing.freightCharges) || 0);
    const grandTotal = round2(totals.netAmount + freight);

    const paid = data.amountPaid !== undefined ? round2(Number(data.amountPaid)) : existing.amountPaid || 0;
    const balance = round2(grandTotal - paid);

    try {
      return await runStockTransaction(async (tx) => {
        // Reverse old stock movements
        for (const line of reversedLines) {
          await applyStockLine(tx, {
            itemId: line.itemId,
            itemName: line.itemName,
            itemCode: line.itemCode,
            qty: line.quantity,
            sign: 1,
            type: TYPE_SALES,
            referenceNumber: existing.invoiceNo,
            referenceId: id,
          });
        }
        // Apply new stock movements
        for (const line of newLines) {
          await applyStockLine(tx, {
            itemId: line.itemId,
            itemName: line.itemName,
            itemCode: line.itemCode,
            qty: line.quantity,
            sign: -1,
            type: TYPE_SALES,
            referenceNumber: existing.invoiceNo,
            referenceId: id,
          });
        }

        const finalLines = buildItems('inv', id, newLines);
        const payload = {
          ...existing,
          invoiceDate: data.invoiceDate || existing.invoiceDate,
          dueDate: data.dueDate !== undefined ? data.dueDate : existing.dueDate,
          customerId: data.customerId ? String(data.customerId) : existing.customerId,
          customerName: data.customerName || existing.customerName,
          customerPhone: data.customerPhone || existing.customerPhone,
          salespersonId: data.salespersonId !== undefined ? data.salespersonId : existing.salespersonId,
          salespersonName: data.salespersonName !== undefined ? data.salespersonName : existing.salespersonName,
          items: finalLines,
          subtotal: totals.totalAmount,
          discountTotal: totals.discountAmount,
          taxTotal: totals.taxAmount,
          freightCharges: freight,
          grandTotal,
          netAmount: grandTotal,
          paymentType: data.paymentType || existing.paymentType,
          amountPaid: paid,
          balanceAmount: balance,
          paymentStatus: balance <= 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'DUE',
          note: data.note !== undefined ? data.note : existing.note,
          updatedAt: nowISO(),
        };

        delete payload.id;
        await tx.set(docOf(INVOICES, id), payload, { merge: true });
        return { invoiceNo: existing.invoiceNo, id, ...payload };
      });
    } catch (e) {
      throw wrapStockError(e, 'Could not update invoice');
    }
  },

  async deleteInvoice(id) {
    requireAuth();
    const existing = await getByIdOr404(col(INVOICES), id);
    try {
      await runStockTransaction(async (tx) => {
        for (const line of existing.items || []) {
          await applyStockLine(tx, {
            itemId: line.itemId,
            itemName: line.itemName,
            itemCode: line.itemCode,
            qty: line.quantity,
            sign: 1,
            type: TYPE_SALES,
            referenceNumber: existing.invoiceNo,
            referenceId: id,
          });
        }

        // Reverse customer balance effect if invoice had due balance
        if (existing.customerId && Number(existing.balanceAmount) > 0) {
          const custRef = docOf('customers', String(existing.customerId));
          const custSnap = await tx.get(custRef);
          if (custSnap.exists()) {
            const cur = Number(custSnap.data().creditBalance) || 0;
            tx.update(custRef, {
              creditBalance: Math.max(0, round2(cur - Number(existing.balanceAmount))),
              updatedAt: nowISO(),
            });
          }
        }

        tx.delete(docOf(INVOICES, id));
      });
      return { id, deleted: true };
    } catch (e) {
      throw wrapStockError(e, 'Could not delete sales invoice');
    }
  },

  async getRecent() {
    const snap = await getDocs(query(col(INVOICES), limit(10)));
    return sortByCreatedDesc(fromQuery(snap));
  },

  async getStats() {
    const snap = await getDocs(col(INVOICES));
    let totalSales = 0;
    let totalDue = 0;
    let count = 0;
    snap.forEach((d) => {
      const data = d.data();
      totalSales += Number(data.grandTotal || data.netAmount) || 0;
      totalDue += Number(data.balanceAmount) || 0;
      count += 1;
    });
    return { totalSales: round2(totalSales), totalDue: round2(totalDue), count };
  },

  async exportToExcel(filters = {}) {
    const { content } = await getPaged(col(INVOICES), { page: 0, size: 5000, search: filters.search || '' });
    const headers = [
      'invoiceNo',
      'invoiceDate',
      'customerName',
      'customerPhone',
      'subtotal',
      'discountTotal',
      'taxTotal',
      'grandTotal',
      'amountPaid',
      'balanceAmount',
      'paymentStatus',
      'salespersonName',
    ];
    const csv = toCsv(content, headers);
    downloadCsv(csv, `sales-invoices-${nowISO().slice(0, 10)}.csv`);
    return csv;
  },

  // ==================== 5. CREDIT NOTES ====================

  async createCreditNote(data) {
    requireAuth();
    const amount = round2(Number(data.amount) || 0);
    if (amount <= 0) throw serviceError('Credit note amount must be greater than zero', 400);

    return runStockTransaction(async (tx) => {
      const cnRef = doc(db, CREDIT_NOTES);
      const noteNumber = await nextNumber(tx, 'CN', data.noteDate || todayISO());

      const payload = {
        noteNumber,
        noteDate: data.noteDate || todayISO(),
        invoiceId: data.invoiceId ? String(data.invoiceId) : '',
        invoiceNo: data.invoiceNo || '',
        customerId: data.customerId ? String(data.customerId) : '',
        customerName: data.customerName || '',
        amount,
        reason: data.reason || 'Price adjustment / rebate',
        createdBy: actorName(),
        createdAt: nowISO(),
        updatedAt: nowISO(),
        searchText: buildSearchText(noteNumber, data.invoiceNo, data.customerName),
      };

      await tx.set(cnRef, payload);

      // Reduce customer receivable balance
      if (data.customerId) {
        const custRef = docOf('customers', String(data.customerId));
        const custSnap = await tx.get(custRef);
        if (custSnap.exists()) {
          const cur = Number(custSnap.data().creditBalance) || 0;
          tx.update(custRef, {
            creditBalance: Math.max(0, round2(cur - amount)),
            updatedAt: nowISO(),
          });
        }
      }

      // If linked to invoice, adjust invoice balance
      if (data.invoiceId) {
        const invRef = docOf(INVOICES, String(data.invoiceId));
        const invSnap = await tx.get(invRef);
        if (invSnap.exists()) {
          const curBal = Number(invSnap.data().balanceAmount) || 0;
          const newBal = Math.max(0, round2(curBal - amount));
          tx.update(invRef, {
            balanceAmount: newBal,
            paymentStatus: newBal <= 0 ? 'PAID' : 'DUE',
            updatedAt: nowISO(),
          });
        }
      }

      return { noteNumber, id: cnRef.id, ...payload };
    });
  },

  async getCreditNotes(page = 0, size = 20, search = '') {
    return getPaged(col(CREDIT_NOTES), { page, size, search });
  },
};

function toCsv(items, keys) {
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    return /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
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

export default salesService;