import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ITEM_CATEGORIES } from '../../utils/constants';
import { validateItemForm } from '../../utils/validators';

const ItemForm = ({ initialData, onSubmit, isLoading }) => {
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
                <label>Item Name *</label>
                <input
                    {...register('name', { required: 'Name is required' })}
                    placeholder="Enter item name"
                    disabled={isLoading}
                />
                {errors.name && <span className="error">{errors.name.message}</span>}
            </div>

            <div className="form-group">
                <label>Description</label>
                <textarea
                    {...register('description')}
                    placeholder="Enter item description"
                    disabled={isLoading}
                    rows="3"
                />
            </div>

            <div className="form-group">
                <label>Category</label>
                <select {...register('category')} disabled={isLoading}>
                    <option value="">Select category</option>
                    {ITEM_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label>Price *</label>
                <input
                    {...register('price', { required: 'Price is required' })}
                    type="number"
                    step="0.01"
                    placeholder="Enter price"
                    disabled={isLoading}
                />
                {errors.price && <span className="error">{errors.price.message}</span>}
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

            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Item'}
            </button>
        </form>
    );
};

export default ItemForm;
