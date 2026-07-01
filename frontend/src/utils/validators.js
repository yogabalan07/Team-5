export const validators = {
  required: (value) => {
    if (!value || value.trim() === '') {
      return 'This field is required';
    }
    return null;
  },

  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  phone: (value) => {
    if (!value) return null;
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(value)) {
      return 'Please enter a valid 10-digit phone number';
    }
    return null;
  },

  minLength: (min) => (value) => {
    if (!value) return null;
    if (value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (max) => (value) => {
    if (!value) return null;
    if (value.length > max) {
      return `Must not exceed ${max} characters`;
    }
    return null;
  },

  number: (value) => {
    if (!value) return null;
    if (isNaN(value)) {
      return 'Must be a valid number';
    }
    return null;
  },

  positive: (value) => {
    if (!value) return null;
    if (parseFloat(value) < 0) {
      return 'Must be a positive number';
    }
    return null;
  },

  minValue: (min) => (value) => {
    if (!value) return null;
    if (parseFloat(value) < min) {
      return `Must be at least ${min}`;
    }
    return null;
  },

  maxValue: (max) => (value) => {
    if (!value) return null;
    if (parseFloat(value) > max) {
      return `Must not exceed ${max}`;
    }
    return null;
  },

  gst: (value) => {
    if (!value) return null;
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(value)) {
      return 'Please enter a valid GST number';
    }
    return null;
  },

  validate: (value, rules) => {
    const errors = [];
    if (!Array.isArray(rules)) rules = [rules];
    
    rules.forEach(rule => {
      if (typeof rule === 'function') {
        const error = rule(value);
        if (error) errors.push(error);
      }
    });
    
    return errors.length > 0 ? errors[0] : null;
  },

  validateAll: (data, validationRules) => {
    const errors = {};
    
    Object.keys(validationRules).forEach(field => {
      const rules = validationRules[field];
      const value = data[field];
      const error = validators.validate(value, rules);
      if (error) {
        errors[field] = error;
      }
    });
    
    return errors;
  },
};

export default validators;