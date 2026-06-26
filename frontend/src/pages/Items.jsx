import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaSync } from 'react-icons/fa';
import { toast } from 'react-toastify';
import itemService from '../services/itemService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ConfirmDialog from '../components/Common/ConfirmDialog';

const Items = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [formData, setFormData] = useState({
        itemCode: '',
        itemName: '',
        category: '',
        unit: 'Pcs',
        price: '',
        stockQty: '',
        reorderLevel: ''
    });

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const data = await itemService.getAllItems();
            setItems(data);
            console.log('📦 Items loaded:', data.length);
        } catch (error) {
            toast.error('Failed to fetch items');
            console.error('Error fetching items:', error);
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
            const itemData = {
                ...formData,
                price: parseFloat(formData.price),
                stockQty: parseInt(formData.stockQty),
                reorderLevel: parseInt(formData.reorderLevel)
            };
            
            if (editingItem) {
                await itemService.updateItem(editingItem.id, itemData);
                toast.success('Item updated successfully!');
            } else {
                await itemService.createItem(itemData);
                toast.success('Item created successfully!');
            }
            
            setShowForm(false);
            setEditingItem(null);
            setFormData({
                itemCode: '',
                itemName: '',
                category: '',
                unit: 'Pcs',
                price: '',
                stockQty: '',
                reorderLevel: ''
            });
            fetchItems();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            itemCode: item.itemCode,
            itemName: item.itemName,
            category: item.category,
            unit: item.unit,
            price: item.price.toString(),
            stockQty: item.stockQty.toString(),
            reorderLevel: item.reorderLevel.toString()
        });
        setShowForm(true);
    };

    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setShowDeleteConfirm(true);
    };

    const handleDelete = async () => {
        try {
            await itemService.deleteItem(itemToDelete.id);
            toast.success('Item deleted successfully!');
            setShowDeleteConfirm(false);
            setItemToDelete(null);
            fetchItems();
        } catch (error) {
            toast.error('Failed to delete item');
        }
    };

    const handleRefresh = () => {
        fetchItems();
        toast.info('Refreshing items...');
    };

    const filteredItems = items.filter(item =>
        item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch(status) {
            case 'In Stock': return { bg: '#c6f6d5', color: '#276749' };
            case 'Low Stock': return { bg: '#fefcbf', color: '#975a16' };
            case 'Out of Stock': return { bg: '#fed7d7', color: '#9b2c2c' };
            default: return { bg: '#e2e8f0', color: '#4a5568' };
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 className="page-title">Items</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-primary" onClick={handleRefresh} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaSync /> Refresh
                    </button>
                    <button className="btn-primary" onClick={() => setShowForm(true)}>
                        <FaPlus /> Add Item
                    </button>
                </div>
            </div>

            <div className="card-shadow">
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <FaSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                        <input
                            type="text"
                            placeholder="Search items..."
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
                    <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '0 15px', 
                        background: '#f7fafc', 
                        borderRadius: '5px',
                        fontSize: '14px',
                        color: '#4a5568'
                    }}>
                        Total: {items.length}
                    </span>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Unit</th>
                                <th>Price (₹)</th>
                                <th>Stock</th>
                                <th>Reorder Level</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item) => {
                                const status = getStatusColor(item.status);
                                return (
                                    <tr key={item.id}>
                                        <td><strong>{item.itemCode}</strong></td>
                                        <td>{item.itemName}</td>
                                        <td>{item.category}</td>
                                        <td>{item.unit}</td>
                                        <td>{item.price?.toFixed(2)}</td>
                                        <td style={{ fontWeight: 'bold', color: item.stockQty <= item.reorderLevel ? '#c62828' : '#2e7d32' }}>
                                            {item.stockQty}
                                        </td>
                                        <td>{item.reorderLevel}</td>
                                        <td>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                backgroundColor: status.bg,
                                                color: status.color,
                                                fontWeight: '500'
                                            }}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                onClick={() => handleEdit(item)}
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
                                                onClick={() => handleDeleteClick(item)}
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
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredItems.length === 0 && (
                        <p style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                            No items found
                        </p>
                    )}
                </div>
            </div>

            {/* Modal Form - Keep your existing form code */}
            {showForm && (
                // ... your existing form modal code
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
                        <h2>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Item Code *</label>
                                <input
                                    type="text"
                                    name="itemCode"
                                    value={formData.itemCode}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Item Name *</label>
                                <input
                                    type="text"
                                    name="itemName"
                                    value={formData.itemName}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Category *</label>
                                <input
                                    type="text"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Unit *</label>
                                <select
                                    name="unit"
                                    value={formData.unit}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                >
                                    <option value="Pcs">Pcs</option>
                                    <option value="Kg">Kg</option>
                                    <option value="Ltr">Ltr</option>
                                    <option value="Box">Box</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Price (₹) *</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    required
                                    step="0.01"
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Stock Quantity *</label>
                                <input
                                    type="number"
                                    name="stockQty"
                                    value={formData.stockQty}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Reorder Level</label>
                                <input
                                    type="number"
                                    name="reorderLevel"
                                    value={formData.reorderLevel}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingItem(null);
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
                                    {editingItem ? 'Update' : 'Create'}
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
                    setItemToDelete(null);
                }}
                title="Delete Item"
                message={`Are you sure you want to delete "${itemToDelete?.itemName}"?`}
            />
        </div>
    );
};

export default Items;