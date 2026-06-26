import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

const CustomerForm = ({ initialData, onSubmit, isLoading }) => {
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
                <label>Customer Name *</label>
                <input
                    {...register('name', { required: 'Name is required' })}
                    placeholder="Enter customer name"
                    disabled={isLoading}
                />
                {errors.name && <span className="error">{errors.name.message}</span>}
            </div>

            <div className="form-group">
                <label>Email</label>
                <input
                    {...register('email')}
                    type="email"
                    placeholder="Enter email"
                    disabled={isLoading}
                />
                {errors.email && <span className="error">{errors.email.message}</span>}
            </div>

            <div className="form-group">
                <label>Phone</label>
                <input
                    {...register('phone')}
                    placeholder="Enter phone number"
                    disabled={isLoading}
                />
                {errors.phone && <span className="error">{errors.phone.message}</span>}
            </div>

            <div className="form-group">
                <label>Address</label>
                <textarea
                    {...register('address')}
                    placeholder="Enter address"
                    disabled={isLoading}
                    rows="3"
                />
            </div>

            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Customer'}
            </button>
        </form>
    );
};

export default CustomerForm;
