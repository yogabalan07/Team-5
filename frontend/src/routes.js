export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  
  // Customers
  CUSTOMERS: '/customers',
  CUSTOMER_NEW: '/customers/new',
  CUSTOMER_EDIT: '/customers/edit/:id',
  
  // Suppliers
  SUPPLIERS: '/suppliers',
  SUPPLIER_NEW: '/suppliers/new',
  SUPPLIER_EDIT: '/suppliers/edit/:id',
  
  // Items
  ITEMS: '/items',
  ITEM_NEW: '/items/new',
  ITEM_EDIT: '/items/edit/:id',
  ITEM_BRANDS: '/items/brands',
  ITEM_GROUPS: '/items/groups',
  ITEM_UNITS: '/items/units',
  ITEM_TAXES: '/items/taxes',
  
  // Sales
  SALES_ENTRY: '/sales/entry',
  SALES_INVOICE: '/sales/invoice/:id',
  
  // Purchases
  PURCHASE_ORDER: '/purchases/order',
  PURCHASE_ENTRY: '/purchases/entry',
  
  // Accounts
  ACCOUNTS_RECEIPTS: '/accounts/receipts',
  ACCOUNTS_PAYMENTS: '/accounts/payments',
  ACCOUNTS_LEDGER: '/accounts/ledger',
  
  // Reports
  REPORTS_SALES: '/reports/sales',
  REPORTS_STOCK: '/reports/stock',
};