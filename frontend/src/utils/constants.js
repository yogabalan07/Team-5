export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

export const PAYMENT_TYPES = {
  CASH: 'CASH',
  CREDIT: 'CREDIT',
  BANK: 'BANK',
};

export const TRANSACTION_TYPES = {
  PURCHASE: 'PURCHASE',
  SALES: 'SALES',
  RETURN_IN: 'RETURN_IN',
  RETURN_OUT: 'RETURN_OUT',
  ADJUSTMENT: 'ADJUSTMENT',
};

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  BILLING_CLERK: 'BILLING_CLERK',
  ACCOUNTS: 'ACCOUNTS',
  PURCHASE_MANAGER: 'PURCHASE_MANAGER',
  STORE_MANAGER: 'STORE_MANAGER',
};

export const STOCK_STATUS = {
  IN_STOCK: 'In Stock',
  LOW_STOCK: 'Low Stock',
  OUT_OF_STOCK: 'Out of Stock',
  CRITICAL: 'Critical',
};

export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  API: 'yyyy-MM-dd',
  DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
};

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];