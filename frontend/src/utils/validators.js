export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

export const validatePhone = (phone) => {
    const re = /^\+?[\d\s-]{10,}$/;
    return re.test(phone);
};

export const validateRequired = (value) => {
    return value && value.trim().length > 0;
};

export const validateMinLength = (value, minLength) => {
    return value && value.length >= minLength;
};

export const validateNumber = (value) => {
    return !isNaN(value) && value >= 0;
};

export const validatePositiveNumber = (value) => {
    return !isNaN(value) && value > 0;
};

export const validateItemForm = (data) => {
    const errors = {};
    if (!validateRequired(data.name)) {
        errors.name = 'Name is required';
    }
    if (!validatePositiveNumber(data.price)) {
        errors.price = 'Price must be a positive number';
    }
    if (!validateNumber(data.quantity)) {
        errors.quantity = 'Quantity must be a valid number';
    }
    return errors;
};

export const validateCustomerForm = (data) => {
    const errors = {};
    if (!validateRequired(data.name)) {
        errors.name = 'Name is required';
    }
    if (data.email && !validateEmail(data.email)) {
        errors.email = 'Invalid email format';
    }
    if (data.phone && !validatePhone(data.phone)) {
        errors.phone = 'Invalid phone format';
    }
    return errors;
};
