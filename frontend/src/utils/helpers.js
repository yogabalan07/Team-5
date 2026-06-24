export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
};

export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
};

export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

export const getStatusColor = (status) => {
    const colors = {
        'PAID': 'success',
        'UNPAID': 'error',
        'PARTIAL': 'warning',
        'ACTIVE': 'success',
        'INACTIVE': 'error',
        'LOW': 'warning',
        'OUT': 'error',
        'IN': 'success'
    };
    return colors[status] || 'default';
};
