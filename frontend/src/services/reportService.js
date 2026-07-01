import api from './api';

export const reportService = {
  // ==================== SALES REPORTS ====================

  /**
   * Get Sales Bills Report
   * Filters: startDate, endDate, customerIds (single/multiple/none)
   */
  getSalesReport: async (filters) => {
    const response = await api.post('/reports/sales-bills', filters);
    return response.data;
  },

  /**
   * Get Sales Details Report
   * Filters: startDate, endDate, customerIds, itemIds, brandIds, groupIds
   */
  getSalesDetailsReport: async (filters) => {
    const response = await api.post('/reports/sales-bill-details', filters);
    return response.data;
  },

  /**
   * Export Sales Report to Excel
   */
  exportSalesReport: async (filters) => {
    try {
      const requestData = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        customerIds: filters.customerIds || null,
        reportType: 'SALES'
      };
      
      const response = await api.post('/reports/export/excel', requestData, {
        responseType: 'blob'
      });

      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response from server');
      }

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response.data;
    } catch (error) {
      console.error('❌ Error exporting sales report:', error);
      throw error;
    }
  },

  /**
   * Export Sales Report to PDF
   */
  exportSalesReportPDF: async (filters) => {
    try {
      const requestData = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        customerIds: filters.customerIds || null,
        reportType: 'SALES'
      };
      
      const response = await api.post('/reports/export/pdf', requestData, {
        responseType: 'blob'
      });

      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response from server');
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales-report-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response.data;
    } catch (error) {
      console.error('❌ Error exporting sales report PDF:', error);
      throw error;
    }
  },

  // ==================== PURCHASE REPORTS ====================

  /**
   * Get Purchase Bills Report
   * Filters: startDate, endDate, supplierIds (single/multiple/none)
   */
  getPurchaseReport: async (filters) => {
    const response = await api.post('/reports/purchase-bills', filters);
    return response.data;
  },

  /**
   * Get Purchase Details Report
   * Filters: startDate, endDate, supplierIds, itemIds, brandIds, groupIds
   */
  getPurchaseDetailsReport: async (filters) => {
    const response = await api.post('/reports/purchase-bill-details', filters);
    return response.data;
  },

  /**
   * Export Purchase Report to Excel
   */
  exportPurchaseReport: async (filters) => {
    try {
      const requestData = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        dateType: filters.dateType || 'INVOICE_DATE',
        supplierIds: filters.supplierIds || null,
        reportType: 'PURCHASE'
      };
      
      console.log('📤 Exporting purchase report with data:', requestData);
      
      const response = await api.post('/reports/export/excel', requestData, {
        responseType: 'blob'
      });

      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response from server');
      }

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `purchase-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log('✅ Purchase report exported successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error exporting purchase report:', error);
      throw error;
    }
  },

  /**
   * Export Purchase Report to PDF
   */
  exportPurchaseReportPDF: async (filters) => {
    try {
      const requestData = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        dateType: filters.dateType || 'INVOICE_DATE',
        supplierIds: filters.supplierIds || null,
        reportType: 'PURCHASE'
      };
      
      const response = await api.post('/reports/export/pdf', requestData, {
        responseType: 'blob'
      });

      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response from server');
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `purchase-report-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response.data;
    } catch (error) {
      console.error('❌ Error exporting purchase report PDF:', error);
      throw error;
    }
  },

  // ==================== STOCK REPORTS ====================

  /**
   * Get Stock Report
   * Filters: startDate, endDate, itemIds, brandIds, groupIds
   * Returns: Opening Stock, Purchases, Sales, Closing Stock
   */
  getStockReport: async (filters) => {
    const response = await api.post('/reports/stock', filters);
    return response.data;
  },

  /**
   * Get Stock Summary
   */
  getStockSummary: async () => {
    const response = await api.get('/reports/stock/summary');
    return response.data;
  },

  /**
   * Export Stock Report to Excel
   */
  exportStockReport: async (filters) => {
    try {
      const requestData = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        itemIds: filters.itemIds || null,
        brandIds: filters.brandIds || null,
        groupIds: filters.groupIds || null,
        reportType: 'STOCK'
      };
      
      const response = await api.post('/reports/export/excel', requestData, {
        responseType: 'blob'
      });

      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response from server');
      }

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `stock-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response.data;
    } catch (error) {
      console.error('❌ Error exporting stock report:', error);
      throw error;
    }
  },

  /**
   * Export Stock Report to PDF
   */
  exportStockReportPDF: async (filters) => {
    try {
      const requestData = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        itemIds: filters.itemIds || null,
        brandIds: filters.brandIds || null,
        groupIds: filters.groupIds || null,
        reportType: 'STOCK'
      };
      
      const response = await api.post('/reports/export/pdf', requestData, {
        responseType: 'blob'
      });

      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response from server');
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `stock-report-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response.data;
    } catch (error) {
      console.error('❌ Error exporting stock report PDF:', error);
      throw error;
    }
  },

  // ==================== CUSTOMER RECEIPTS ====================

  /**
   * Get Customer Receipts Report
   * Filters: startDate, endDate
   */
  getCustomerReceipts: async (filters) => {
    const response = await api.post('/reports/customer-receipts', filters);
    return response.data;
  },

  /**
   * Export Customer Receipts to Excel
   */
  exportCustomerReceipts: async (filters) => {
    try {
      const requestData = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        reportType: 'RECEIPTS'
      };
      
      const response = await api.post('/reports/export/excel', requestData, {
        responseType: 'blob'
      });

      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response from server');
      }

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `customer-receipts-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response.data;
    } catch (error) {
      console.error('❌ Error exporting customer receipts:', error);
      throw error;
    }
  },

  /**
   * Export Customer Receipts to PDF
   */
  exportCustomerReceiptsPDF: async (filters) => {
    try {
      const requestData = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        reportType: 'RECEIPTS'
      };
      
      const response = await api.post('/reports/export/pdf', requestData, {
        responseType: 'blob'
      });

      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response from server');
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `customer-receipts-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response.data;
    } catch (error) {
      console.error('❌ Error exporting customer receipts PDF:', error);
      throw error;
    }
  },

  // ==================== SUPPLIER PAYMENTS ====================

  /**
   * Get Supplier Payments Report
   * Filters: startDate, endDate
   */
  getSupplierPayments: async (filters) => {
    const response = await api.post('/reports/supplier-payments', filters);
    return response.data;
  },

  /**
   * Export Supplier Payments to Excel
   */
  exportSupplierPayments: async (filters) => {
    try {
      const requestData = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        reportType: 'PAYMENTS'
      };
      
      const response = await api.post('/reports/export/excel', requestData, {
        responseType: 'blob'
      });

      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response from server');
      }

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `supplier-payments-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response.data;
    } catch (error) {
      console.error('❌ Error exporting supplier payments:', error);
      throw error;
    }
  },

  /**
   * Export Supplier Payments to PDF
   */
  exportSupplierPaymentsPDF: async (filters) => {
    try {
      const requestData = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        reportType: 'PAYMENTS'
      };
      
      const response = await api.post('/reports/export/pdf', requestData, {
        responseType: 'blob'
      });

      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response from server');
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `supplier-payments-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response.data;
    } catch (error) {
      console.error('❌ Error exporting supplier payments PDF:', error);
      throw error;
    }
  },

  // ==================== SALES SUMMARY ====================

  /**
   * Get Sales Summary
   */
  getSalesSummary: async () => {
    const response = await api.get('/reports/sales-summary');
    return response.data;
  },

  // ==================== GENERIC EXPORT ====================

  /**
   * Generic Excel Export
   * @param {string} endpoint - The API endpoint
   * @param {object} filters - The filter parameters
   * @param {string} filename - The filename for download
   */
  exportToExcel: async (endpoint, filters, filename) => {
    try {
      const requestData = {
        ...filters,
        reportType: filename.toUpperCase()
      };
      
      const response = await api.post(`/reports/export/excel`, requestData, {
        responseType: 'blob'
      });

      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response from server');
      }

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response.data;
    } catch (error) {
      console.error('❌ Error exporting to Excel:', error);
      throw error;
    }
  },

  /**
   * Generic PDF Export
   */
  exportToPDF: async (endpoint, filters, filename) => {
    try {
      const requestData = {
        ...filters,
        reportType: filename.toUpperCase()
      };
      
      const response = await api.post(`/reports/export/pdf`, requestData, {
        responseType: 'blob'
      });

      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response from server');
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response.data;
    } catch (error) {
      console.error('❌ Error exporting to PDF:', error);
      throw error;
    }
  }
};

export default reportService;