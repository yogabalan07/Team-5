import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import SalesForm from '../components/Forms/SalesForm';
import SearchBar from '../components/Common/SearchBar';
import ConfirmDialog from '../components/Common/ConfirmDialog';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { formatCurrency, formatDate, getStatusColor } from '../utils/helpers';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';

const SalesEntry = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadSales();
    }, []);

    const loadSales = async () => {
        try {
            setLoading(true);
            const response = await api.get('/sales');
            setSales(response.data);
        } catch (error) {
            toast.error('Failed to load sales');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data) => {
        try {
            if (editingId) {
                await api.put(`/sales/${editingId}`, data);
                toast.success('Sale updated successfully');
            } else {
                await api.post('/sales', data);
                toast.success('Sale created successfully');
            }
            setShowForm(false);
            setEditingId(null);
            loadSales();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save sale');
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/sales/${confirmDelete}`);
            toast.success('Sale deleted successfully');
            setConfirmDelete(null);
            loadSales();
        } catch (error) {
            toast.error('Failed to delete sale');
        }
    };

    const handleEdit = (sale) => {
        setEditingId(sale.id);
        setShowForm(true);
    };

    const filteredSales = sales.filter(s => {
        const searchLower = searchTerm.toLowerCase();
        return s.id.toString().includes(searchLower) || 
               s.customerId.toString().includes(searchLower) ||
               s.itemId.toString().includes(searchLower);
    });

    if (loading && !showForm) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Sales Entries</h1>
                <button onClick={() => setShowForm(true)} className="btn btn-primary">
                    <FiPlus /> Add Sale
                </button>
            </div>

            {showForm ? (
                <div className="card-shadow">
                    <h3>{editingId ? 'Edit Sale' : 'Add New Sale'}</h3>
                    <SalesForm
                        initialData={editingId ? sales.find(s => s.id === editingId) : null}
                        onSubmit={handleSubmit}
                        isLoading={loading}
                    />
                    <button onClick={() => { setShowForm(false); setEditingId(null); }} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
                        Cancel
                    </button>
                </div>
            ) : (
                <>
                    <SearchBar placeholder="Search sales..." onSearch={setSearchTerm} />
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Customer</th>
                                    <th>Item</th>
                                    <th>Quantity</th>
                                    <th>Unit Price</th>
                                    <th>Total</th>
                                    <th>Payment Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSales.map(sale => (
                                    <tr key={sale.id}>
                                        <td>{sale.id}</td>
                                        <td>{sale.customerId}</td>
                                        <td>{sale.itemId}</td>
                                        <td>{sale.quantity}</td>
                                        <td>{formatCurrency(sale.unitPrice)}</td>
                                        <td>{formatCurrency(sale.quantity * sale.unitPrice)}</td>
                                        <td><span className={`status ${getStatusColor(sale.paymentStatus)}`}>{sale.paymentStatus}</span></td>
                                        <td>{formatDate(sale.createdAt)}</td>
                                        <td>
                                            <button onClick={() => handleEdit(sale)} className="btn btn-sm btn-info">
                                                <FiEdit2 />
                                            </button>
                                            <button onClick={() => setConfirmDelete(sale.id)} className="btn btn-sm btn-danger">
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
                title="Delete Sale"
                message="Are you sure you want to delete this sale entry?"
                confirmText="Delete"
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete(null)}
            />
        </div>
    );
};

export default SalesEntry;
