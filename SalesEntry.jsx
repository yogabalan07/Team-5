import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaSave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const SalesEntry = () => {
    const [loading, setLoading] = useState(true);
    const [sales, setSales] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [items, setItems] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [saleItems, setSaleItems] = useState([]);
    const [formData, setFormData] = useState({
        invoiceNo: '',
        customerId: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        paymentType: 'Cash',
        discount: 0,
        taxRate: 18,
        amountPaid: 0,
        salesPerson: '',
        notes: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            
            const [salesRes, customersRes, itemsRes] = await Promise.all([
                axios.get('http://localhost:8080/api/sales', { headers }),
                axios.get('http://localhost:8080/api/customers', { headers }),
                axios.get('http://localhost:8080/api/items', { headers })
            ]);
            
            setSales(salesRes.data);
            setCustomers(customersRes.data);
            setItems(itemsRes.data);
        } catch (error) {
            toast.error('Failed to fetch data');
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

    const addSaleItem = () => {
        setSaleItems([
            ...saleItems,
            {
                id: Date.now(),
                itemId: '',
                itemCode: '',
                itemName: '',
                unitPrice: 0,
                quantity: 1,
                discountPercent: 0,
                amount: 0
            }
        ]);
    };

    const removeSaleItem = (id) => {
        setSaleItems(saleItems.filter(item => item.id !== id));
    };

    const updateSaleItem = (id, field, value) => {
        setSaleItems(saleItems.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (field === 'unitPrice' || field === 'quantity' || field === 'discountPercent') {
                    const discountAmount = (updated.unitPrice * updated.quantity * updated.discountPercent) / 100;
                    updated.amount = (updated.unitPrice * updated.quantity) - discountAmount;
                }
                return updated;
            }
            return item;
        }));
    };

    const handleItemSelect = (id, itemId) => {
        const selectedItem = items.find(item => item.id === parseInt(itemId));
        if (selectedItem) {
            updateSaleItem(id, 'itemId', selectedItem.id);
            updateSaleItem(id, 'itemCode', selectedItem.itemCode);
            updateSaleItem(id, 'itemName', selectedItem.itemName);
            updateSaleItem(id, 'unitPrice', selectedItem.price);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const saleData = {
                ...formData,
                customerId: parseInt(formData.customerId),
                discount: parseFloat(formData.discount),
                taxRate: parseFloat(formData.taxRate),
                amountPaid: parseFloat(formData.amountPaid),
                items: saleItems.map(item => ({
                    itemId: item.itemId,
                    itemCode: item.itemCode,
                    itemName: item.itemName,
                    unitPrice: item.unitPrice,
                    quantity: item.quantity,
                    discountPercent: item.discountPercent,
                    amount: item.amount
                }))
            };

            await axios.post('http://localhost:8080/api/sales', saleData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            toast.success('Sale created successfully!');
            setShowForm(false);
            setSaleItems([]);
            setFormData({
                invoiceNo: '',
                customerId: '',
                invoiceDate: new Date().toISOString().split('T')[0],
                paymentType: 'Cash',
                discount: 0,
                taxRate: 18,
                amountPaid: 0,
                salesPerson: '',
                notes: ''
            });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create sale');
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 className="page-title">Sales Entries</h1>
                <button className="btn-primary" onClick={() => setShowForm(true)}>
                    <FaPlus /> New Sale
                </button>
            </div>

            <div className="card-shadow">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Invoice No</th>
                                <th>Customer</th>
                                <th>Date</th>
                                <th>Total Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map((sale) => {
                                const customer = customers.find(c => c.id === sale.customerId);
                                return (
                                    <tr key={sale.id}>
                                        <td>{sale.invoiceNo}</td>
                                        <td>{customer?.customerName || '-'}</td>
                                        <td>{sale.invoiceDate}</td>
                                        <td>${sale.totalAmount?.toFixed(2)}</td>
                                        <td>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                backgroundColor: sale.balance === 0 ? '#c6f6d5' : '#fefcbf',
                                                color: sale.balance === 0 ? '#276749' : '#975a16'
                                            }}>
                                                {sale.balance === 0 ? 'Paid' : 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sales Form Modal */}
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
                        width: '800px',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}>
                        <h2>New Sales Entry</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>Invoice No *</label>
                                    <input
                                        type="text"
                                        name="invoiceNo"
                                        value={formData.invoiceNo}
                                        onChange={handleInputChange}
                                        required
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>Customer *</label>
                                    <select
                                        name="customerId"
                                        value={formData.customerId}
                                        onChange={handleInputChange}
                                        required
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    >
                                        <option value="">Select Customer</option>
                                        {customers.map(customer => (
                                            <option key={customer.id} value={customer.id}>
                                                {customer.customerName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>Invoice Date</label>
                                    <input
                                        type="date"
                                        name="invoiceDate"
                                        value={formData.invoiceDate}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>Payment Type</label>
                                    <select
                                        name="paymentType"
                                        value={formData.paymentType}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Credit">Credit</option>
                                        <option value="Online">Online</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>Discount</label>
                                    <input
                                        type="number"
                                        name="discount"
                                        value={formData.discount}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>Tax Rate (%)</label>
                                    <input
                                        type="number"
                                        name="taxRate"
                                        value={formData.taxRate}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4>Sale Items</h4>
                                    <button type="button" className="btn-primary" onClick={addSaleItem}>
                                        <FaPlus /> Add Item
                                    </button>
                                </div>
                                
                                {saleItems.map((item) => (
                                    <div key={item.id} style={{
                                        border: '1px solid #ddd',
                                        padding: '15px',
                                        borderRadius: '4px',
                                        marginTop: '10px'
                                    }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Item</label>
                                                <select
                                                    value={item.itemId}
                                                    onChange={(e) => handleItemSelect(item.id, e.target.value)}
                                                    style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                >
                                                    <option value="">Select Item</option>
                                                    {items.map(i => (
                                                        <option key={i.id} value={i.id}>
                                                            {i.itemCode} - {i.itemName} (Stock: {i.stockQty})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Qty</label>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateSaleItem(item.id, 'quantity', parseFloat(e.target.value))}
                                                    style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Unit Price</label>
                                                <input
                                                    type="number"
                                                    value={item.unitPrice}
                                                    onChange={(e) => updateSaleItem(item.id, 'unitPrice', parseFloat(e.target.value))}
                                                    style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Disc %</label>
                                                <input
                                                    type="number"
                                                    value={item.discountPercent}
                                                    onChange={(e) => updateSaleItem(item.id, 'discountPercent', parseFloat(e.target.value))}
                                                    style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Amount</label>
                                                <input
                                                    type="text"
                                                    value={item.amount.toFixed(2)}
                                                    disabled
                                                    style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px', background: '#f5f5f5' }}
                                                />
                                            </div>
                                            <div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeSaleItem(item.id)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#fc8181',
                                                        cursor: 'pointer',
                                                        padding: '6px'
                                                    }}
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px' }}>Sales Person</label>
                                        <input
                                            type="text"
                                            name="salesPerson"
                                            value={formData.salesPerson}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px' }}>Amount Paid</label>
                                        <input
                                            type="number"
                                            name="amountPaid"
                                            value={formData.amountPaid}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ marginTop: '10px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>Notes</label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        rows="2"
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setSaleItems([]);
                                    }}
                                    style={{
                                        padding: '10px 20px',
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
                                        padding: '10px 20px',
                                        background: '#1976d2',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <FaSave /> Save Sale
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesEntry;