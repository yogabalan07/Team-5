import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';
import supplierService from '../services/supplierService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ConfirmDialog from '../components/Common/ConfirmDialog';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [supplierToDelete, setSupplierToDelete] = useState(null);
    const [formData, setFormData] = useState({
        supplierId: '',
        supplierName: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        status: 'Active'
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const data = await supplierService.getAllSuppliers();
            setSuppliers(data);
        } catch (error) {
            toast.error('Failed to fetch suppliers');
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
            // Validate required fields
            if (!formData.supplierId) {
                toast.error('Supplier ID is required');
                return;
            }
            if (!formData.supplierName) {
                toast.error('Supplier Name is required');
                return;
            }
            if (!formData.phone) {
                toast.error('Phone is required');
                return;
            }

            if (editingSupplier) {
                await supplierService.updateSupplier(editingSupplier.id, formData);
                toast.success('Supplier updated successfully!');
            } else {
                await supplierService.createSupplier(formData);
                toast.success('Supplier created successfully!');
            }
            setShowForm(false);
            setEditingSupplier(null);
            setFormData({
                supplierId: '',
                supplierName: '',
                contactPerson: '',
                phone: '',
                email: '',
                address: '',
                status: 'Active'
            });
            fetchSuppliers();
        } catch (error) {
            toast.error(error.response?.data?.error || error.response?.data?.message || 'Operation failed');
        }
    };

    const handleEdit = (supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            supplierId: supplier.supplierId,
            supplierName: supplier.supplierName,
            contactPerson: supplier.contactPerson || '',
            phone: supplier.phone,
            email: supplier.email || '',
            address: supplier.address || '',
            status: supplier.status || 'Active'
        });
        setShowForm(true);
    };

    const handleDeleteClick = (supplier) => {
        setSupplierToDelete(supplier);
        setShowDeleteConfirm(true);
    };

    const handleDelete = async () => {
        try {
            await supplierService.deleteSupplier(supplierToDelete.id);
            toast.success('Supplier deleted successfully!');
            setShowDeleteConfirm(false);
            setSupplierToDelete(null);
            fetchSuppliers();
        } catch (error) {
            toast.error('Failed to delete supplier');
        }
    };

    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.supplierId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.phone?.includes(searchTerm)
    );

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 className="page-title">Suppliers</h1>
                <button className="btn-primary" onClick={() => setShowForm(true)}>
                    <FaPlus /> Add Supplier
                </button>
            </div>

            <div className="card-shadow">
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <FaSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                        <input
                            type="text"
                            placeholder="Search suppliers..."
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
                                <th>Contact Person</th>
                                <th>Phone</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSuppliers.map((supplier) => (
                                <tr key={supplier.id}>
                                    <td>{supplier.supplierId}</td>
                                    <td>{supplier.supplierName}</td>
                                    <td>{supplier.contactPerson || '-'}</td>
                                    <td>{supplier.phone}</td>
                                    <td>{supplier.email || '-'}</td>
                                    <td>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            backgroundColor: supplier.status === 'Active' ? '#c6f6d5' : '#fed7d7',
                                            color: supplier.status === 'Active' ? '#276749' : '#9b2c2c'
                                        }}>
                                            {supplier.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            onClick={() => handleEdit(supplier)}
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
                                            onClick={() => handleDeleteClick(supplier)}
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
                    {filteredSuppliers.length === 0 && (
                        <p style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                            No suppliers found
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
                        <h2>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Supplier ID *</label>
                                <input
                                    type="text"
                                    name="supplierId"
                                    value={formData.supplierId}
                                    onChange={handleInputChange}
                                    required
                                    disabled={!!editingSupplier}
                                    style={{ 
                                        width: '100%', 
                                        padding: '8px', 
                                        border: '1px solid #ddd', 
                                        borderRadius: '4px',
                                        background: editingSupplier ? '#f5f5f5' : 'white'
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Supplier Name *</label>
                                <input
                                    type="text"
                                    name="supplierName"
                                    value={formData.supplierName}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Contact Person</label>
                                <input
                                    type="text"
                                    name="contactPerson"
                                    value={formData.contactPerson}
                                    onChange={handleInputChange}
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
                                        setEditingSupplier(null);
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
                                    {editingSupplier ? 'Update' : 'Create'}
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
                    setSupplierToDelete(null);
                }}
                title="Delete Supplier"
                message={`Are you sure you want to delete "${supplierToDelete?.supplierName}"?`}
            />
        </div>
    );
};

export default Suppliers;