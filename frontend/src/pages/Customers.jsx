import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';
import customerService from '../services/customerService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ConfirmDialog from '../components/Common/ConfirmDialog';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);
    const [formData, setFormData] = useState({
        customerId: '',
        customerName: '',
        phone: '',
        email: '',
        address: '',
        status: 'Active'
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const data = await customerService.getAllCustomers();
            setCustomers(data);
        } catch (error) {
            toast.error('Failed to fetch customers');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCustomer) {
                await customerService.updateCustomer(editingCustomer.id, formData);
                toast.success('Customer updated successfully!');
            } else {
                await customerService.createCustomer(formData);
                toast.success('Customer created successfully!');
            }
            setShowForm(false);
            setEditingCustomer(null);
            setFormData({
                customerId: '',
                customerName: '',
                phone: '',
                email: '',
                address: '',
                status: 'Active'
            });
            fetchCustomers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setFormData({
            customerId: customer.customerId,
            customerName: customer.customerName,
            phone: customer.phone,
            email: customer.email || '',
            address: customer.address || '',
            status: customer.status || 'Active'
        });
        setShowForm(true);
    };

    const handleDeleteClick = (customer) => {
        setCustomerToDelete(customer);
        setShowDeleteConfirm(true);
    };

    const handleDelete = async () => {
        try {
            await customerService.deleteCustomer(customerToDelete.id);
            toast.success('Customer deleted successfully!');
            setShowDeleteConfirm(false);
            setCustomerToDelete(null);
            fetchCustomers();
        } catch (error) {
            toast.error('Failed to delete customer');
        }
    };

    const filteredCustomers = customers.filter(customer =>
        customer.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)
    );

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 className="page-title">Customers</h1>
                <button className="btn-primary" onClick={() => setShowForm(true)}>
                    <FaPlus /> Add Customer
                </button>
            </div>

            <div className="card-shadow">
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <FaSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                        <input
                            type="text"
                            placeholder="Search customers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 10px 10px 35px',
                                border: '1px solid #ddd',
                                borderRadius: '5px',
                                fontSize: '14px'
                            }}
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id}>
                                    <td>{customer.customerId}</td>
                                    <td>{customer.customerName}</td>
                                    <td>{customer.phone}</td>
                                    <td>{customer.email || '-'}</td>
                                    <td>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            backgroundColor: customer.status === 'Active' ? '#c6f6d5' : '#fed7d7',
                                            color: customer.status === 'Active' ? '#276749' : '#9b2c2c'
                                        }}>
                                            {customer.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            onClick={() => handleEdit(customer)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#4299e1',
                                                cursor: 'pointer',
                                                marginRight: '10px'
                                            }}
                                        >
                                            <FaEdit />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteClick(customer)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#fc8181',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredCustomers.length === 0 && (
                        <p style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                            No customers found
                        </p>
                    )}
                </div>
            </div>

            {/* Modal Form */}
            {showForm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '10px',
                        width: '500px',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}>
                        <h2>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Customer ID *</label>
                                <input
                                    type="text"
                                    name="customerId"
                                    value={formData.customerId}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Customer Name *</label>
                                <input
                                    type="text"
                                    name="customerName"
                                    value={formData.customerName}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Phone *</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Address</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    rows="3"
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingCustomer(null);
                                    }}
                                    style={{
                                        padding: '8px 20px',
                                        background: '#e2e8f0',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        padding: '8px 20px',
                                        background: '#1976d2',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {editingCustomer ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onConfirm={handleDelete}
                onCancel={() => {
                    setShowDeleteConfirm(false);
                    setCustomerToDelete(null);
                }}
                title="Delete Customer"
                message={`Are you sure you want to delete "${customerToDelete?.customerName}"?`}
            />
        </div>
    );
};

export default Customers;