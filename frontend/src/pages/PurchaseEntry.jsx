import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaSave, FaSearch, FaMinus, FaPlus as FaPlusIcon, FaPrint, FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const PurchaseEntry = () => {
    const [loading, setLoading] = useState(true);
    const [purchases, setPurchases] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [items, setItems] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [purchaseItems, setPurchaseItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredItems, setFilteredItems] = useState([]);
    const [showItemDropdown, setShowItemDropdown] = useState(false);
    const [editingPurchase, setEditingPurchase] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        purchaseInvoiceNo: '',
        supplierId: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        paymentType: 'Cash',
        discount: 0,
        taxRate: 18,
        amountPaid: 0,
        purchasePerson: '',
        notes: ''
    });
    const [summary, setSummary] = useState({
        totalItems: 0,
        subtotal: 0,
        discount: 0,
        tax: 0,
        totalAmount: 0,
        amountPaid: 0,
        balance: 0
    });
    const [stockUpdate, setStockUpdate] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        calculateSummary();
        calculateStockUpdate();
    }, [purchaseItems, formData.discount, formData.taxRate, formData.amountPaid]);

    useEffect(() => {
        if (searchTerm) {
            const filtered = items.filter(item =>
                item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.itemCode?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredItems(filtered);
            setShowItemDropdown(true);
        } else {
            setFilteredItems([]);
            setShowItemDropdown(false);
        }
    }, [searchTerm, items]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Please login first');
                setLoading(false);
                return;
            }

            const headers = { Authorization: `Bearer ${token}` };
            
            const [purchasesRes, suppliersRes, itemsRes] = await Promise.all([
                axios.get('http://localhost:8080/api/purchases', { headers }),
                axios.get('http://localhost:8080/api/suppliers', { headers }),
                axios.get('http://localhost:8080/api/items', { headers })
            ]);
            
            setPurchases(purchasesRes.data || []);
            setSuppliers(suppliersRes.data || []);
            setItems(itemsRes.data || []);
            
            const today = new Date();
            const dateStr = today.getFullYear() + 
                String(today.getMonth() + 1).padStart(2, '0') + 
                String(today.getDate()).padStart(2, '0');
            const count = (purchasesRes.data?.length || 0) + 1;
            const invoiceNo = `PUR-${dateStr}-${String(count).padStart(4, '0')}`;
            
            setFormData(prev => ({
                ...prev,
                purchaseInvoiceNo: invoiceNo
            }));
            
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error(error.response?.data?.error || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const addPurchaseItem = (item) => {
        const existingItem = purchaseItems.find(i => i.itemId === item.id);
        if (existingItem) {
            updatePurchaseItem(existingItem.id, 'quantity', existingItem.quantity + 1);
        } else {
            const amount = item.price * 1;
            setPurchaseItems([
                ...purchaseItems,
                {
                    id: Date.now(),
                    itemId: item.id,
                    itemCode: item.itemCode,
                    itemName: item.itemName,
                    unitPrice: item.price,
                    quantity: 1,
                    discountPercent: 0,
                    amount: amount,
                    maxStock: item.stockQty
                }
            ]);
        }
        setSearchTerm('');
        setShowItemDropdown(false);
        toast.success(`Added ${item.itemName} to purchase`);
    };

    const removePurchaseItem = (id) => {
        setPurchaseItems(purchaseItems.filter(item => item.id !== id));
    };

    const updatePurchaseItem = (id, field, value) => {
        setPurchaseItems(purchaseItems.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (field === 'quantity' || field === 'unitPrice' || field === 'discountPercent') {
                    const discountAmount = (updated.unitPrice * updated.quantity * (updated.discountPercent || 0)) / 100;
                    updated.amount = (updated.unitPrice * updated.quantity) - discountAmount;
                }
                return updated;
            }
            return item;
        }));
    };

    const calculateSummary = () => {
        const subtotal = purchaseItems.reduce((sum, item) => sum + (item.amount || 0), 0);
        const discount = parseFloat(formData.discount) || 0;
        const taxRate = parseFloat(formData.taxRate) || 0;
        const tax = (subtotal - discount) * (taxRate / 100);
        const totalAmount = subtotal - discount + tax;
        const amountPaid = parseFloat(formData.amountPaid) || 0;
        const balance = totalAmount - amountPaid;

        setSummary({
            totalItems: purchaseItems.length,
            subtotal: Number(subtotal.toFixed(2)),
            discount: Number(discount.toFixed(2)),
            tax: Number(tax.toFixed(2)),
            totalAmount: Number(totalAmount.toFixed(2)),
            amountPaid: Number(amountPaid.toFixed(2)),
            balance: Number(balance.toFixed(2))
        });
    };

    const calculateStockUpdate = () => {
        const updates = purchaseItems.map(item => {
            const inventoryItem = items.find(i => i.id === item.itemId);
            return {
                itemCode: item.itemCode,
                itemName: item.itemName,
                previousStock: inventoryItem?.stockQty || 0,
                quantityPurchased: item.quantity,
                currentStock: (inventoryItem?.stockQty || 0) + item.quantity
            };
        });
        setStockUpdate(updates);
    };

    const handleEdit = async (purchase) => {
        try {
            setEditingPurchase(purchase);
            setEditMode(true);
            setFormData({
                purchaseInvoiceNo: purchase.purchaseInvoiceNo,
                supplierId: purchase.supplierId || '',
                purchaseDate: purchase.purchaseDate,
                paymentType: purchase.paymentType || 'Cash',
                discount: purchase.discount || 0,
                taxRate: purchase.taxRate || 18,
                amountPaid: purchase.amountPaid || 0,
                purchasePerson: purchase.purchasePerson || '',
                notes: purchase.notes || ''
            });
            
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:8080/api/purchases/${purchase.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.items) {
                const items = response.data.items.map(item => ({
                    id: Date.now() + Math.random(),
                    itemId: item.itemId,
                    itemCode: item.itemCode,
                    itemName: item.itemName,
                    unitPrice: item.unitPrice,
                    quantity: item.quantity,
                    discountPercent: item.discountPercent || 0,
                    amount: item.amount,
                    maxStock: 999
                }));
                setPurchaseItems(items);
            }
            setShowForm(true);
            toast.info('Editing purchase - make changes and save');
        } catch (error) {
            console.error('Error loading purchase for edit:', error);
            toast.error('Failed to load purchase details for editing');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Please login first');
                return;
            }

            if (!formData.supplierId) {
                toast.error('Please select a supplier');
                return;
            }
            if (purchaseItems.length === 0) {
                toast.error('Please add at least one item');
                return;
            }

            const subtotal = Number(summary.subtotal.toFixed(2));
            const discount = parseFloat(formData.discount) || 0;
            const taxRate = parseFloat(formData.taxRate) || 0;
            const taxAmount = Number(summary.tax.toFixed(2));
            const totalAmount = Number(summary.totalAmount.toFixed(2));
            const amountPaid = parseFloat(formData.amountPaid) || 0;
            const balance = Number(summary.balance.toFixed(2));

            let invoiceNo = formData.purchaseInvoiceNo;
            if (!editMode && !invoiceNo) {
                const today = new Date();
                const dateStr = today.getFullYear() + 
                    String(today.getMonth() + 1).padStart(2, '0') + 
                    String(today.getDate()).padStart(2, '0');
                const count = purchases.length + 1;
                invoiceNo = `PUR-${dateStr}-${String(count).padStart(4, '0')}`;
            }

            const purchaseData = {
                purchaseInvoiceNo: invoiceNo,
                supplierId: parseInt(formData.supplierId),
                purchaseDate: formData.purchaseDate,
                paymentType: formData.paymentType,
                discount: discount,
                taxRate: taxRate,
                amountPaid: amountPaid,
                purchasePerson: formData.purchasePerson || '',
                notes: formData.notes || '',
                subtotal: subtotal,
                taxAmount: taxAmount,
                totalAmount: totalAmount,
                balance: balance,
                items: purchaseItems.map(item => ({
                    itemId: item.itemId,
                    itemCode: item.itemCode,
                    itemName: item.itemName,
                    unitPrice: Number(item.unitPrice.toFixed(2)),
                    quantity: item.quantity,
                    discountPercent: Number((item.discountPercent || 0).toFixed(2)),
                    amount: Number(item.amount.toFixed(2))
                }))
            };

            const headers = { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            let response;
            if (editMode && editingPurchase) {
                response = await axios.put(`http://localhost:8080/api/purchases/${editingPurchase.id}`, purchaseData, { headers });
                toast.success('Purchase invoice updated successfully!');
            } else {
                response = await axios.post('http://localhost:8080/api/purchases', purchaseData, { headers });
                toast.success('Purchase invoice created successfully! Stock updated.');
            }
            
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Error saving purchase:', error);
            if (error.response) {
                if (error.response.status === 400) {
                    const errorMsg = error.response.data?.error || 'Invalid data. Please check all fields.';
                    toast.error(errorMsg);
                } else if (error.response.status === 403) {
                    toast.error('You are not authorized. Please login again.');
                } else {
                    toast.error(error.response.data?.error || 'Failed to save purchase');
                }
            } else {
                toast.error('Network error. Please check your connection.');
            }
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setPurchaseItems([]);
        setSearchTerm('');
        setStockUpdate([]);
        setEditingPurchase(null);
        setEditMode(false);
        const today = new Date();
        const dateStr = today.getFullYear() + 
            String(today.getMonth() + 1).padStart(2, '0') + 
            String(today.getDate()).padStart(2, '0');
        const count = purchases.length + 1;
        const invoiceNo = `PUR-${dateStr}-${String(count).padStart(4, '0')}`;
        setFormData({
            purchaseInvoiceNo: invoiceNo,
            supplierId: '',
            purchaseDate: today.toISOString().split('T')[0],
            paymentType: 'Cash',
            discount: 0,
            taxRate: 18,
            amountPaid: 0,
            purchasePerson: '',
            notes: ''
        });
        setSummary({
            totalItems: 0,
            subtotal: 0,
            discount: 0,
            tax: 0,
            totalAmount: 0,
            amountPaid: 0,
            balance: 0
        });
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '₹ 0.00';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getSupplierName = (supplierId) => {
        if (!supplierId) return '-';
        const supplier = suppliers.find(s => s.id === supplierId);
        return supplier?.supplierName || '-';
    };

    const handlePrintInvoice = () => {
        if (purchaseItems.length === 0) {
            toast.warning('No items to print!');
            return;
        }
        
        const printContent = document.getElementById('purchase-invoice-print');
        if (printContent) {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Purchase Order - ${formData.purchaseInvoiceNo}</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; }
                            .invoice-header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                            .invoice-title { font-size: 24px; font-weight: bold; }
                            .company-name { font-size: 18px; color: #555; }
                            .invoice-details { margin-bottom: 20px; }
                            .invoice-details table { width: 100%; }
                            .invoice-details td { padding: 5px; }
                            .label { font-weight: bold; color: #555; }
                            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                            th { background: #f0f0f0; padding: 10px; text-align: left; border: 1px solid #ddd; }
                            td { padding: 10px; border: 1px solid #ddd; }
                            .text-right { text-align: right; }
                            .total-row { font-weight: bold; background: #f9f9f9; }
                            .grand-total { font-size: 18px; color: #1976d2; }
                            .footer { margin-top: 30px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #ddd; padding-top: 10px; }
                            .print-btn { display: none; }
                            @media print {
                                .no-print { display: none; }
                                body { margin: 0; padding: 20px; }
                            }
                        </style>
                    </head>
                    <body>
                        ${printContent.innerHTML}
                        <script>
                            window.onload = function() { window.print(); window.close(); }
                        <\/script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        } else {
            toast.error('No invoice content to print');
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 className="page-title">Purchase Entry</h1>
                <button className="btn-primary" onClick={() => {
                    setEditMode(false);
                    setEditingPurchase(null);
                    setShowForm(true);
                }}>
                    <FaPlus /> New Purchase
                </button>
            </div>

            <div className="card-shadow">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Invoice No</th>
                                <th>Supplier</th>
                                <th>Date</th>
                                <th>Total Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchases && purchases.length > 0 ? (
                                purchases.map((purchase) => (
                                    <tr key={purchase.id}>
                                        <td><strong>{purchase.purchaseInvoiceNo}</strong></td>
                                        <td>{getSupplierName(purchase.supplierId)}</td>
                                        <td>{purchase.purchaseDate}</td>
                                        <td>{formatCurrency(purchase.totalAmount)}</td>
                                        <td>
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                backgroundColor: parseFloat(purchase.balance) === 0 ? '#c6f6d5' : '#fefcbf',
                                                color: parseFloat(purchase.balance) === 0 ? '#276749' : '#975a16'
                                            }}>
                                                {parseFloat(purchase.balance) === 0 ? 'Paid' : 'Pending'}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                onClick={() => handleEdit(purchase)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: '#4299e1',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                            >
                                                <FaEdit size={12} /> Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                                        No purchases found. Create your first purchase!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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
                    zIndex: 1000,
                    overflow: 'auto',
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '10px',
                        width: '1200px',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2>{editMode ? 'Edit Purchase Invoice' : 'Purchase Invoice'}</h2>
                            {purchaseItems.length > 0 && (
                                <button 
                                    type="button" 
                                    className="btn-primary"
                                    style={{ background: '#48bb78' }}
                                    onClick={handlePrintInvoice}
                                >
                                    <FaPrint /> Print Invoice
                                </button>
                            )}
                        </div>

                        <div id="purchase-invoice-print">
                            {purchaseItems.length > 0 && (
                                <>
                                    <div className="invoice-header" style={{ textAlign: 'center', padding: '20px 0' }}>
                                        <h2 style={{ margin: 0 }}>PURCHASE ORDER</h2>
                                        <p style={{ margin: '5px 0', color: '#666' }}>Inventory Management System</p>
                                        <p style={{ margin: '5px 0', fontSize: '14px', color: '#888' }}>
                                            Order No: <strong>{formData.purchaseInvoiceNo}</strong>
                                        </p>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <table style={{ width: '100%', border: 'none' }}>
                                            <tbody>
                                                <tr>
                                                    <td style={{ border: 'none', padding: '5px' }}>
                                                        <strong>Supplier:</strong> {getSupplierName(formData.supplierId)}
                                                    </td>
                                                    <td style={{ border: 'none', padding: '5px', textAlign: 'right' }}>
                                                        <strong>Date:</strong> {formatDate(formData.purchaseDate)}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style={{ border: 'none', padding: '5px' }}>
                                                        <strong>Payment Type:</strong> {formData.paymentType}
                                                    </td>
                                                    <td style={{ border: 'none', padding: '5px', textAlign: 'right' }}>
                                                        <strong>Purchase Person:</strong> {formData.purchasePerson || 'N/A'}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <table>
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Item Code</th>
                                                <th>Item Name</th>
                                                <th style={{ textAlign: 'right' }}>Unit Price</th>
                                                <th style={{ textAlign: 'center' }}>Qty</th>
                                                <th style={{ textAlign: 'right' }}>Discount</th>
                                                <th style={{ textAlign: 'right' }}>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {purchaseItems.map((item, index) => (
                                                <tr key={item.id}>
                                                    <td>{index + 1}</td>
                                                    <td>{item.itemCode}</td>
                                                    <td>{item.itemName}</td>
                                                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                                                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                                    <td style={{ textAlign: 'right' }}>{item.discountPercent || 0}%</td>
                                                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="total-row">
                                                <td colSpan="6" style={{ textAlign: 'right' }}>Subtotal:</td>
                                                <td style={{ textAlign: 'right' }}>{formatCurrency(summary.subtotal)}</td>
                                            </tr>
                                            <tr className="total-row">
                                                <td colSpan="6" style={{ textAlign: 'right' }}>Discount:</td>
                                                <td style={{ textAlign: 'right' }}>{formatCurrency(summary.discount)}</td>
                                            </tr>
                                            <tr className="total-row">
                                                <td colSpan="6" style={{ textAlign: 'right' }}>Tax (GST {formData.taxRate}%):</td>
                                                <td style={{ textAlign: 'right' }}>{formatCurrency(summary.tax)}</td>
                                            </tr>
                                            <tr className="total-row" style={{ fontSize: '18px' }}>
                                                <td colSpan="6" style={{ textAlign: 'right' }}>Total Amount:</td>
                                                <td style={{ textAlign: 'right', color: '#1976d2' }}>
                                                    <strong>{formatCurrency(summary.totalAmount)}</strong>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colSpan="6" style={{ textAlign: 'right' }}>Amount Paid:</td>
                                                <td style={{ textAlign: 'right' }}>{formatCurrency(summary.amountPaid)}</td>
                                            </tr>
                                            <tr>
                                                <td colSpan="6" style={{ textAlign: 'right' }}>Balance:</td>
                                                <td style={{ textAlign: 'right', color: summary.balance > 0 ? '#c62828' : '#2e7d32' }}>
                                                    {formatCurrency(summary.balance)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>

                                    {formData.notes && (
                                        <div style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
                                            <strong>Notes:</strong> {formData.notes}
                                        </div>
                                    )}

                                    <div className="footer" style={{ marginTop: '30px', textAlign: 'center', color: '#888', fontSize: '12px', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
                                        <p>Thank you for your order!</p>
                                        <p>This is a computer-generated purchase order.</p>
                                    </div>
                                </>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 1fr',
                                gap: '15px',
                                padding: '20px',
                                background: '#f7fafc',
                                borderRadius: '8px',
                                marginBottom: '20px'
                            }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>
                                        Invoice No.
                                    </label>
                                    <input
                                        type="text"
                                        name="purchaseInvoiceNo"
                                        value={formData.purchaseInvoiceNo}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                        disabled={editMode}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>
                                        Purchase Date
                                    </label>
                                    <input
                                        type="date"
                                        name="purchaseDate"
                                        value={formData.purchaseDate}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>
                                        Supplier *
                                    </label>
                                    <select
                                        name="supplierId"
                                        value={formData.supplierId}
                                        onChange={handleInputChange}
                                        required
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.map(supplier => (
                                            <option key={supplier.id} value={supplier.id}>
                                                {supplier.supplierName} ({supplier.supplierId})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>
                                        Payment Type
                                    </label>
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
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>
                                        Purchase Person
                                    </label>
                                    <input
                                        type="text"
                                        name="purchasePerson"
                                        value={formData.purchasePerson}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>
                                        Tax Rate (%)
                                    </label>
                                    <input
                                        type="number"
                                        name="taxRate"
                                        value={formData.taxRate}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px', position: 'relative' }}>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        <FaSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                                        <input
                                            type="text"
                                            placeholder="Search item by name / code"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 10px 10px 35px',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                fontSize: '14px'
                                            }}
                                            onFocus={() => setShowItemDropdown(true)}
                                        />
                                    </div>
                                    <button 
                                        type="button" 
                                        className="btn-primary"
                                        onClick={() => {
                                            toast.info('Navigate to Items page to add new item');
                                        }}
                                    >
                                        <FaPlusIcon /> Add Item
                                    </button>
                                </div>

                                {showItemDropdown && filteredItems.length > 0 && (
                                    <div style={{
                                        position: 'absolute',
                                        zIndex: 1001,
                                        background: 'white',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        maxHeight: '200px',
                                        overflow: 'auto',
                                        width: 'calc(100% - 130px)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        top: '60px'
                                    }}>
                                        {filteredItems.map(item => (
                                            <div
                                                key={item.id}
                                                onClick={() => addPurchaseItem(item)}
                                                style={{
                                                    padding: '10px 15px',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid #f0f0f0',
                                                    display: 'flex',
                                                    justifyContent: 'space-between'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                            >
                                                <span>
                                                    <strong>{item.itemCode}</strong> - {item.itemName}
                                                    <span style={{ fontSize: '12px', color: '#888', marginLeft: '10px' }}>
                                                        (Stock: {item.stockQty})
                                                    </span>
                                                </span>
                                                <span style={{ color: '#2b6cb0' }}>{formatCurrency(item.price)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {purchaseItems.length > 0 && (
                                    <div className="table-container">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '50px' }}>#</th>
                                                    <th>Item Code</th>
                                                    <th>Item Name</th>
                                                    <th style={{ width: '140px' }}>Unit Price (₹)</th>
                                                    <th style={{ width: '100px' }}>Quantity</th>
                                                    <th style={{ width: '100px' }}>Discount (%)</th>
                                                    <th style={{ width: '140px' }}>Amount (₹)</th>
                                                    <th style={{ width: '60px' }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {purchaseItems.map((item, index) => (
                                                    <tr key={item.id}>
                                                        <td>{index + 1}</td>
                                                        <td>{item.itemCode}</td>
                                                        <td>{item.itemName}</td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                value={item.unitPrice}
                                                                onChange={(e) => updatePurchaseItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                                style={{ width: '100%', padding: '4px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                            />
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updatePurchaseItem(item.id, 'quantity', Math.max(1, (item.quantity || 0) - 1))}
                                                                    style={{
                                                                        padding: '2px 8px',
                                                                        background: '#e2e8f0',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    <FaMinus size={10} />
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    value={item.quantity}
                                                                    onChange={(e) => updatePurchaseItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                                                    style={{ width: '60px', padding: '4px', textAlign: 'center', border: '1px solid #ddd', borderRadius: '4px' }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updatePurchaseItem(item.id, 'quantity', (item.quantity || 0) + 1)}
                                                                    style={{
                                                                        padding: '2px 8px',
                                                                        background: '#e2e8f0',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    <FaPlusIcon size={10} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                value={item.discountPercent || 0}
                                                                onChange={(e) => updatePurchaseItem(item.id, 'discountPercent', parseFloat(e.target.value) || 0)}
                                                                style={{ width: '100%', padding: '4px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                            />
                                                        </td>
                                                        <td style={{ fontWeight: 'bold' }}>
                                                            {formatCurrency(item.amount || 0)}
                                                        </td>
                                                        <td>
                                                            <button
                                                                type="button"
                                                                onClick={() => removePurchaseItem(item.id)}
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
                                    </div>
                                )}
                            </div>

                            {purchaseItems.length > 0 && (
                                <div style={{ marginBottom: '20px' }}>
                                    <h4>Stock (After Purchase)</h4>
                                    <div className="table-container">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Item Code</th>
                                                    <th>Item Name</th>
                                                    <th>Previous Stock</th>
                                                    <th>Quantity Purchased</th>
                                                    <th>Current Stock</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stockUpdate.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>{item.itemCode}</td>
                                                        <td>{item.itemName}</td>
                                                        <td>{item.previousStock}</td>
                                                        <td style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                                                            +{item.quantityPurchased}
                                                        </td>
                                                        <td style={{ fontWeight: 'bold', color: '#2e7d32' }}>
                                                            {item.currentStock}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {purchaseItems.length > 0 && (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '20px',
                                    padding: '20px',
                                    background: '#f7fafc',
                                    borderRadius: '8px',
                                    marginBottom: '20px'
                                }}>
                                    <div>
                                        <h4>Invoice Summary</h4>
                                        <div style={{ marginTop: '10px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                                                <span>Total Items</span>
                                                <span><strong>{summary.totalItems}</strong></span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                                                <span>Subtotal</span>
                                                <span><strong>{formatCurrency(summary.subtotal)}</strong></span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                                                <span>Discount</span>
                                                <span><strong>{formatCurrency(summary.discount)}</strong></span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                                                <span>Tax (GST {formData.taxRate}%)</span>
                                                <span><strong>{formatCurrency(summary.tax)}</strong></span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                                                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Total Amount</span>
                                                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1976d2' }}>
                                                    <strong>{formatCurrency(summary.totalAmount)}</strong>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4>Payment Details</h4>
                                        <div style={{ marginTop: '10px' }}>
                                            <div style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>
                                                    Amount Paid
                                                </label>
                                                <input
                                                    type="number"
                                                    name="amountPaid"
                                                    value={formData.amountPaid}
                                                    onChange={handleInputChange}
                                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                                                <span>Total Amount</span>
                                                <span><strong>{formatCurrency(summary.totalAmount)}</strong></span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                                                <span>Amount Paid</span>
                                                <span><strong>{formatCurrency(summary.amountPaid)}</strong></span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                                                <span style={{ fontSize: '16px', fontWeight: 'bold', color: summary.balance > 0 ? '#c62828' : '#2e7d32' }}>
                                                    Balance
                                                </span>
                                                <span style={{ fontSize: '16px', fontWeight: 'bold', color: summary.balance > 0 ? '#c62828' : '#2e7d32' }}>
                                                    {formatCurrency(summary.balance)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>
                                    Notes
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    rows="2"
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    placeholder="Add any notes here..."
                                />
                            </div>

                            <div style={{
                                padding: '12px 16px',
                                background: '#e8f5e9',
                                borderLeft: '4px solid #2e7d32',
                                borderRadius: '4px',
                                marginBottom: '20px',
                                fontSize: '14px',
                                color: '#1b5e20'
                            }}>
                                <strong>Note:</strong> Stock will be increased after saving this purchase entry.
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        resetForm();
                                    }}
                                    style={{
                                        padding: '10px 24px',
                                        background: '#e2e8f0',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        padding: '10px 24px',
                                        background: '#2e7d32',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <FaSave /> {editMode ? 'Update Invoice' : 'Save Invoice'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseEntry;