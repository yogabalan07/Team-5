import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import PurchaseForm from '../components/Forms/PurchaseForm';
import SearchBar from '../components/Common/SearchBar';
import ConfirmDialog from '../components/Common/ConfirmDialog';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/helpers';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';

const PurchaseEntry = () => {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadPurchases();
    }, []);

    const loadPurchases = async () => {
        try {
            setLoading(true);
            const response = await api.get('/purchases');
            setPurchases(response.data);
        } catch (error) {
            toast.error('Failed to load purchases');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data) => {
        try {
            if (editingId) {
                await api.put(`/purchases/${editingId}`, data);
                toast.success('Purchase updated successfully');
            } else {
                await api.post('/purchases', data);
                toast.success('Purchase created successfully');
            }
            setShowForm(false);
            setEditingId(null);
            loadPurchases();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save purchase');
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/purchases/${confirmDelete}`);
            toast.success('Purchase deleted successfully');
            setConfirmDelete(null);
            loadPurchases();
        } catch (error) {
            toast.error('Failed to delete purchase');
        }
    };

    const handleEdit = (purchase) => {
        setEditingId(purchase.id);
        setShowForm(true);
    };

    const filteredPurchases = purchases.filter(p => {
        const searchLower = searchTerm.toLowerCase();
        return p.id.toString().includes(searchLower) || 
               p.supplierId.toString().includes(searchLower) ||
               p.itemId.toString().includes(searchLower);
    });

    if (loading && !showForm) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Purchase Entries</h1>
                <button onClick={() => setShowForm(true)} className="btn btn-primary">
                    <FiPlus /> Add Purchase
                </button>
            </div>

            {showForm ? (
                <div className="card-shadow">
                    <h3>{editingId ? 'Edit Purchase' : 'Add New Purchase'}</h3>
                    <PurchaseForm
                        initialData={editingId ? purchases.find(p => p.id === editingId) : null}
                        onSubmit={handleSubmit}
                        isLoading={loading}
                    />
                    <button onClick={() => { setShowForm(false); setEditingId(null); }} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
                        Cancel
                    </button>
                </div>
            ) : (
                <>
                    <SearchBar placeholder="Search purchases..." onSearch={setSearchTerm} />
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Supplier</th>
                                    <th>Item</th>
                                    <th>Quantity</th>
                                    <th>Unit Price</th>
                                    <th>Total</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPurchases.map(purchase => (
                                    <tr key={purchase.id}>
                                        <td>{purchase.id}</td>
                                        <td>{purchase.supplierId}</td>
                                        <td>{purchase.itemId}</td>
                                        <td>{purchase.quantity}</td>
                                        <td>{formatCurrency(purchase.unitPrice)}</td>
                                        <td>{formatCurrency(purchase.quantity * purchase.unitPrice)}</td>
                                        <td>{formatDate(purchase.createdAt)}</td>
                                        <td>
                                            <button onClick={() => handleEdit(purchase)} className="btn btn-sm btn-info">
                                                <FiEdit2 />
                                            </button>
                                            <button onClick={() => setConfirmDelete(purchase.id)} className="btn btn-sm btn-danger">
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
                title="Delete Purchase"
                message="Are you sure you want to delete this purchase entry?"
                confirmText="Delete"
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete(null)}
            />
        </div>
    );
};

export default PurchaseEntry;
