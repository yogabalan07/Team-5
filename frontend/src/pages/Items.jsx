import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import ItemForm from '../components/Forms/ItemForm';
import SearchBar from '../components/Common/SearchBar';
import ConfirmDialog from '../components/Common/ConfirmDialog';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { formatCurrency } from '../utils/helpers';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';

const Items = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        try {
            setLoading(true);
            const response = await api.get('/items');
            setItems(response.data);
        } catch (error) {
            toast.error('Failed to load items');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data) => {
        try {
            if (editingId) {
                await api.put(`/items/${editingId}`, data);
                toast.success('Item updated successfully');
            } else {
                await api.post('/items', data);
                toast.success('Item created successfully');
            }
            setShowForm(false);
            setEditingId(null);
            loadItems();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save item');
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/items/${confirmDelete}`);
            toast.success('Item deleted successfully');
            setConfirmDelete(null);
            loadItems();
        } catch (error) {
            toast.error('Failed to delete item');
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setShowForm(true);
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && !showForm) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Items</h1>
                <button onClick={() => setShowForm(true)} className="btn btn-primary">
                    <FiPlus /> Add Item
                </button>
            </div>

            {showForm ? (
                <div className="card-shadow">
                    <h3>{editingId ? 'Edit Item' : 'Add New Item'}</h3>
                    <ItemForm
                        initialData={editingId ? items.find(i => i.id === editingId) : null}
                        onSubmit={handleSubmit}
                        isLoading={loading}
                    />
                    <button onClick={() => { setShowForm(false); setEditingId(null); }} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
                        Cancel
                    </button>
                </div>
            ) : (
                <>
                    <SearchBar placeholder="Search items..." onSearch={setSearchTerm} />
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Quantity</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.name}</td>
                                        <td>{item.category}</td>
                                        <td>{formatCurrency(item.price)}</td>
                                        <td>{item.quantity}</td>
                                        <td>
                                            <button onClick={() => handleEdit(item)} className="btn btn-sm btn-info">
                                                <FiEdit2 />
                                            </button>
                                            <button onClick={() => setConfirmDelete(item.id)} className="btn btn-sm btn-danger">
                                                <FiTrash2 />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            <ConfirmDialog
                isOpen={!!confirmDelete}
                title="Delete Item"
                message="Are you sure you want to delete this item?"
                confirmText="Delete"
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete(null)}
            />
        </div>
    );
};

export default Items;
