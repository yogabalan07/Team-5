import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { PAYMENT_STATUS } from '../../utils/constants';

const SalesForm = ({ initialData, onSubmit, isLoading }) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: initialData || {}
    });

    useEffect(() => {
        if (initialData) {
            reset(initialData);
        }
    }, [initialData, reset]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="form">
            <div className="form-group">
                <label>Customer *</label>
                <input
                    {...register('customerId', { required: 'Customer is required' })}
                    placeholder="Enter customer ID"
                    disabled={isLoading}
                />
                {errors.customerId && <span className="error">{errors.customerId.message}</span>}
            </div>

            <div className="form-group">
                <label>Item *</label>
                <input
                    {...register('itemId', { required: 'Item is required' })}
                    placeholder="Enter item ID"
                    disabled={isLoading}
                />
                {errors.itemId && <span className="error">{errors.itemId.message}</span>}
            </div>

            <div className="form-group">
                <label>Quantity *</label>
                <input
                    {...register('quantity', { required: 'Quantity is required' })}
                    type="number"
                    placeholder="Enter quantity"
                    disabled={isLoading}
                />
                {errors.quantity && <span className="error">{errors.quantity.message}</span>}
            </div>

            <div className="form-group">
                <label>Unit Price *</label>
                <input
                    {...register('unitPrice', { required: 'Unit price is required' })}
                    type="number"
                    step="0.01"
                    placeholder="Enter unit price"
                    disabled={isLoading}
                />
                {errors.unitPrice && <span className="error">{errors.unitPrice.message}</span>}
            </div>

            <div className="form-group">
                <label>Payment Status</label>
                <select {...register('paymentStatus')} disabled={isLoading}>
                    <option value="">Select status</option>
                    {Object.entries(PAYMENT_STATUS).map(([key, val]) => (
                        <option key={val} value={val}>{val}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label>Notes</label>
                <textarea
                    {...register('notes')}
                    placeholder="Enter notes"
                    disabled={isLoading}
                    rows="3"
                />
            </div>

            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Sale'}
            </button>
        </form>
    );
};

export default SalesForm;
