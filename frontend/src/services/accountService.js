import api from './api';

export const accountService = {
  // Bill Receipts
  createReceipt: async (data) => {
    const response = await api.post('/accounts/receipt', data);
    return response.data;
  },

  getReceiptByNo: async (receiptNo) => {
    const response = await api.get(`/accounts/receipt/${receiptNo}`);
    return response.data;
  },

  getAllReceipts: async (page = 0, size = 20) => {
    const response = await api.get('/accounts/receipts', { params: { page, size } });
    return response.data;
  },

  getReceiptsByDateRange: async (startDate, endDate, page = 0, size = 20) => {
    const response = await api.get('/accounts/receipts/date-range', {
      params: { startDate, endDate, page, size },
    });
    return response.data;
  },

  getReceiptsByCustomer: async (customerId) => {
    const response = await api.get(`/accounts/receipts/customer/${customerId}`);
    return response.data;
  },

  // Bill Payments
  createPayment: async (data) => {
    const response = await api.post('/accounts/payment', data);
    return response.data;
  },

  getPaymentByNo: async (paymentNo) => {
    const response = await api.get(`/accounts/payment/${paymentNo}`);
    return response.data;
  },

  getAllPayments: async (page = 0, size = 20) => {
    const response = await api.get('/accounts/payments', { params: { page, size } });
    return response.data;
  },

  getPaymentsByDateRange: async (startDate, endDate, page = 0, size = 20) => {
    const response = await api.get('/accounts/payments/date-range', {
      params: { startDate, endDate, page, size },
    });
    return response.data;
  },

  getPaymentsBySupplier: async (supplierId) => {
    const response = await api.get(`/accounts/payments/supplier/${supplierId}`);
    return response.data;
  },

  // Ledger
  getCustomerLedger: async (customerId) => {
    const response = await api.get(`/accounts/customer-ledger/${customerId}`);
    return response.data;
  },

  getSupplierLedger: async (supplierId) => {
    const response = await api.get(`/accounts/supplier-ledger/${supplierId}`);
    return response.data;
  },
};