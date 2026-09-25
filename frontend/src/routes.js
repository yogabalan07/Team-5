export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  
  // Customers
  CUSTOMERS: '/customers',
  CUSTOMER_NEW: '/customers/new',
  CUSTOMER_EDIT: '/customers/edit/:id',
  CUSTOMER_GROUPS: '/customers/groups',
  
  // Suppliers
  SUPPLIERS: '/suppliers',
  SUPPLIER_NEW: '/suppliers/new',
  SUPPLIER_EDIT: '/suppliers/edit/:id',
  SUPPLIER_GROUPS: '/suppliers/groups',
  
  // Items
  ITEMS: '/items',
  ITEM_NEW: '/items/new',
  ITEM_EDIT: '/items/edit/:id',
  ITEM_CATEGORIES: '/items/categories',
  ITEM_BRANDS: '/items/brands',
  ITEM_GROUPS: '/items/groups',
  ITEM_UNITS: '/items/units',
  ITEM_TAXES: '/items/taxes',
  ITEM_PRICELISTS: '/items/price-lists',
  
  // Sales
  SALES_ENTRY: '/sales/entry',
  SALES_LIST: '/sales/list',
  SALES_INVOICE: '/sales/invoice/:id',
  SALES_QUOTATIONS: '/sales/quotations',
  SALES_QUOTATION_NEW: '/sales/quotations/new',
  SALES_QUOTATION_EDIT: '/sales/quotations/edit/:id',
  SALES_ORDERS: '/sales/orders',
  SALES_ORDER_NEW: '/sales/orders/new',
  SALES_ORDER_EDIT: '/sales/orders/edit/:id',
  SALES_DELIVERIES: '/sales/deliveries',
  SALES_CREDIT_NOTES: '/sales/credit-notes',
  SALES_RETURN: '/sales/return',
  
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