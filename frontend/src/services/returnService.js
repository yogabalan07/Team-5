import api from './api';

export const returnService = {
  // Sales Returns
  createSalesReturn: async (data) => {
    const response = await api.post('/returns/sales', data);
    return response.data;
  },

  getSalesReturnByNo: async (returnNo) => {
    const response = await api.get(`/returns/sales/${returnNo}`);
    return response.data;
  },

  getSalesReturnsByInvoice: async (invoiceNo) => {
    const response = await api.get(`/returns/sales/invoice/${invoiceNo}`);
    return response.data;
  },

  // Purchase Returns
  createPurchaseReturn: async (data) => {
    const response = await api.post('/returns/purchase', data);
    return response.data;
  },

  getPurchaseReturnByNo: async (returnNo) => {
    const response = await api.get(`/returns/purchase/${returnNo}`);
    return response.data;
  },

  getPurchaseReturnsByInvoice: async (invoiceNo) => {
    const response = await api.get(`/returns/purchase/invoice/${invoiceNo}`);
    return response.data;
  },
};