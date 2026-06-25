import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import SupplierForm from '../components/Forms/SupplierForm';
import SearchBar from '../components/Common/SearchBar';
import ConfirmDialog from '../components/Common/ConfirmDialog';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadSuppliers();
    }, []);

    const loadSuppliers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/suppliers');
            setSuppliers(response.data);
        } catch (error) {
            toast.error('Failed to load suppliers');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data) => {
        try {
            if (editingId) {
                await api.put(`/suppliers/${editingId}`, data);
                toast.success('Supplier updated successfully');
            } else {
                await api.post('/suppliers', data);
                toast.success('Supplier created successfully');
            }
            setShowForm(false);
            setEditingId(null);
            loadSuppliers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save supplier');
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/suppliers/${confirmDelete}`);
            toast.success('Supplier deleted successfully');
            setConfirmDelete(null);
            loadSuppliers();
        } catch (error) {
            toast.error('Failed to delete supplier');
        }
    };

    const handleEdit = (supplier) => {
        setEditingId(supplier.id);
        setShowForm(true);
    };

    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && !showForm) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Suppliers</h1>
                <button onClick={() => setShowForm(true)} className="btn btn-primary">
                    <FiPlus /> Add Supplier
                </button>
            </div>

            {showForm ? (
                <div className="card-shadow">
                    <h3>{editingId ? 'Edit Supplier' : 'Add New Supplier'}</h3>
                    <SupplierForm
                        initialData={editingId ? suppliers.find(s => s.id === editingId) : null}
                        onSubmit={handleSubmit}
                        isLoading={loading}
                    />
                    <button onClick={() => { setShowForm(false); setEditingId(null); }} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
                        Cancel
                    </button>
                </div>
            ) : (
                <>
                    <SearchBar placeholder="Search suppliers..." onSearch={setSearchTerm} />
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Contact Person</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSuppliers.map(supplier => (
                                    <tr key={supplier.id}>
                                        <td>{supplier.name}</td>
                                        <td>{supplier.contactPerson}</td>
                                        <td>{supplier.email}</td>
                                        <td>{supplier.phone}</td>
                                        <td>
                                            <button onClick={() => handleEdit(supplier)} className="btn btn-sm btn-info">
                                                <FiEdit2 />
                                            </button>
                                            <button onClick={() => setConfirmDelete(supplier.id)} className="btn btn-sm btn-danger">
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
                title="Delete Supplier"
                message="Are you sure you want to delete this supplier?"
                confirmText="Delete"
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete(null)}
            />
        </div>
    );
};

export default Suppliers;
