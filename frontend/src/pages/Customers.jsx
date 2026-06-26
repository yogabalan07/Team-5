import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import CustomerForm from '../components/Forms/CustomerForm';
import SearchBar from '../components/Common/SearchBar';
import ConfirmDialog from '../components/Common/ConfirmDialog';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/customers');
            setCustomers(response.data);
        } catch (error) {
            toast.error('Failed to load customers');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data) => {
        try {
            if (editingId) {
                await api.put(`/customers/${editingId}`, data);
                toast.success('Customer updated successfully.');
            } else {
                await api.post('/customers', data);
                toast.success('Customer created successfully');
            }
            setShowForm(false);
            setEditingId(null);
            loadCustomers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save customer');
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/customers/${confirmDelete}`);
            toast.success('Customer deleted successfully');
            setConfirmDelete(null);
            loadCustomers();
        } catch (error) {
            toast.error('Failed to delete customer');
        }
    };

    const handleEdit = (customer) => {
        setEditingId(customer.id);
        setShowForm(true);
    };

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && !showForm) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Customers</h1>
                <button onClick={() => setShowForm(true)} className="btn btn-primary">
                    <FiPlus /> Add Customer
                </button>
            </div>

            {showForm ? (
                <div className="card-shadow">
                    <h3>{editingId ? 'Edit Customer' : 'Add New Customer'}</h3>
                    <CustomerForm
                        initialData={editingId ? customers.find(c => c.id === editingId) : null}
                        onSubmit={handleSubmit}
                        isLoading={loading}
                    />
                    <button onClick={() => { setShowForm(false); setEditingId(null); }} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
                        Cancel
                    </button>
                </div>
            ) : (
                <>
                    <SearchBar placeholder="Search customers..." onSearch={setSearchTerm} />
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Address</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.map(customer => (
                                    <tr key={customer.id}>
                                        <td>{customer.name}</td>
                                        <td>{customer.email}</td>
                                        <td>{customer.phone}</td>
                                        <td>{customer.address}</td>
                                        <td>
                                            <button onClick={() => handleEdit(customer)} className="btn btn-sm btn-info">
                                                <FiEdit2 />
                                            </button>
                                            <button onClick={() => setConfirmDelete(customer.id)} className="btn btn-sm btn-danger">
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
                title="Delete Customer"
                message="Are you sure you want to delete this customer?"
                confirmText="Delete"
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete(null)}
            />
        </div>
    );
};

export default Customers;
