export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

export const ROLES = {
    ADMIN: 'ADMIN',
    USER: 'USER'
};

export const PAYMENT_STATUS = {
    PAID: 'PAID',
    UNPAID: 'UNPAID',
    PARTIAL: 'PARTIAL'
};

export const ITEM_CATEGORIES = [
    'Electronics',
    'Clothing',
    'Food',
    'Furniture',
    'Books',
    'Other'
];

export const REPORT_TYPES = {
    STOCK: 'STOCK',
    SALES: 'SALES',
    PURCHASES: 'PURCHASES'
};
