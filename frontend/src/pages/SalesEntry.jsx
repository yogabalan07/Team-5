import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaSave, FaSearch, FaMinus, FaPlus as FaPlusIcon, FaPrint, FaEdit } from 'react-icons/fa';
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
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredItems, setFilteredItems] = useState([]);
    const [showItemDropdown, setShowItemDropdown] = useState(false);
    const [editingSale, setEditingSale] = useState(null);
    const [editMode, setEditMode] = useState(false);
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
    }, [saleItems, formData.discount, formData.taxRate, formData.amountPaid]);

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
            
            const [salesRes, customersRes, itemsRes] = await Promise.all([
                axios.get('http://localhost:8080/api/sales', { headers }),
                axios.get('http://localhost:8080/api/customers', { headers }),
                axios.get('http://localhost:8080/api/items', { headers })
            ]);
            
            setSales(salesRes.data || []);
            setCustomers(customersRes.data || []);
            setItems(itemsRes.data || []);
            
            const today = new Date();
            const dateStr = today.getFullYear() + 
                String(today.getMonth() + 1).padStart(2, '0') + 
                String(today.getDate()).padStart(2, '0');
            const count = (salesRes.data?.length || 0) + 1;
            const invoiceNo = `SAL-${dateStr}-${String(count).padStart(4, '0')}`;
            
            setFormData(prev => ({
                ...prev,
                invoiceNo: invoiceNo
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

    const addSaleItem = (item) => {
        if (item.stockQty < 1) {
            toast.error('Item is out of stock');
            return;
        }
        
        const existingItem = saleItems.find(i => i.itemId === item.id);
        if (existingItem) {
            if (existingItem.quantity >= item.stockQty) {
                toast.error('Not enough stock available');
                return;
            }
            updateSaleItem(existingItem.id, 'quantity', existingItem.quantity + 1);
        } else {
            const amount = item.price * 1;
            setSaleItems([
                ...saleItems,
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
        toast.success(`Added ${item.itemName} to invoice`);
    };

    const removeSaleItem = (id) => {
        setSaleItems(saleItems.filter(item => item.id !== id));
    };

    const updateSaleItem = (id, field, value) => {
        setSaleItems(saleItems.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (field === 'quantity') {
                    const maxStock = item.maxStock || 999;
                    if (value > maxStock) {
                        toast.warning(`Only ${maxStock} items available in stock`);
                        return item;
                    }
                }
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
        const subtotal = saleItems.reduce((sum, item) => sum + (item.amount || 0), 0);
        const discount = parseFloat(formData.discount) || 0;
        const taxRate = parseFloat(formData.taxRate) || 0;
        const tax = (subtotal - discount) * (taxRate / 100);
        const totalAmount = subtotal - discount + tax;
        const amountPaid = parseFloat(formData.amountPaid) || 0;
        const balance = totalAmount - amountPaid;

        setSummary({
            totalItems: saleItems.length,
            subtotal: Number(subtotal.toFixed(2)),
            discount: Number(discount.toFixed(2)),
            tax: Number(tax.toFixed(2)),
            totalAmount: Number(totalAmount.toFixed(2)),
            amountPaid: Number(amountPaid.toFixed(2)),
            balance: Number(balance.toFixed(2))
        });
    };

    const calculateStockUpdate = () => {
        const updates = saleItems.map(item => {
            const inventoryItem = items.find(i => i.id === item.itemId);
            return {
                itemCode: item.itemCode,
                itemName: item.itemName,
                previousStock: inventoryItem?.stockQty || 0,
                quantitySold: item.quantity,
                currentStock: (inventoryItem?.stockQty || 0) - item.quantity
            };
        });
        setStockUpdate(updates);
    };

    const handleEdit = async (sale) => {
        try {
            setEditingSale(sale);
            setEditMode(true);
            setFormData({
                invoiceNo: sale.invoiceNo,
                customerId: sale.customerId || '',
                invoiceDate: sale.invoiceDate,
                paymentType: sale.paymentType || 'Cash',
                discount: sale.discount || 0,
                taxRate: sale.taxRate || 18,
                amountPaid: sale.amountPaid || 0,
                salesPerson: sale.salesPerson || '',
                notes: sale.notes || ''
            });
            
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:8080/api/sales/${sale.id}`, {
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
                setSaleItems(items);
            }
            setShowForm(true);
            toast.info('Editing sale - make changes and save');
        } catch (error) {
            console.error('Error loading sale for edit:', error);
            toast.error('Failed to load sale details for editing');
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

            if (!formData.customerId) {
                toast.error('Please select a customer');
                return;
            }
            if (saleItems.length === 0) {
                toast.error('Please add at least one item');
                return;
            }

            for (const item of saleItems) {
                const inventoryItem = items.find(i => i.id === item.itemId);
                if (inventoryItem && inventoryItem.stockQty < item.quantity) {
                    toast.error(`Insufficient stock for ${item.itemName}. Available: ${inventoryItem.stockQty}`);
                    return;
                }
            }

            const subtotal = Number(summary.subtotal.toFixed(2));
            const discount = parseFloat(formData.discount) || 0;
            const taxRate = parseFloat(formData.taxRate) || 0;
            const taxAmount = Number(summary.tax.toFixed(2));
            const totalAmount = Number(summary.totalAmount.toFixed(2));
            const amountPaid = parseFloat(formData.amountPaid) || 0;
            const balance = Number(summary.balance.toFixed(2));

            let invoiceNo = formData.invoiceNo;
            if (!editMode && !invoiceNo) {
                const today = new Date();
                const dateStr = today.getFullYear() + 
                    String(today.getMonth() + 1).padStart(2, '0') + 
                    String(today.getDate()).padStart(2, '0');
                const count = sales.length + 1;
                invoiceNo = `SAL-${dateStr}-${String(count).padStart(4, '0')}`;
            }

            const saleData = {
                invoiceNo: invoiceNo,
                customerId: parseInt(formData.customerId),
                invoiceDate: formData.invoiceDate,
                paymentType: formData.paymentType,
                discount: discount,
                taxRate: taxRate,
                amountPaid: amountPaid,
                salesPerson: formData.salesPerson || '',
                notes: formData.notes || '',
                subtotal: subtotal,
                taxAmount: taxAmount,
                totalAmount: totalAmount,
                balance: balance,
                items: saleItems.map(item => ({
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
            if (editMode && editingSale) {
                response = await axios.put(`http://localhost:8080/api/sales/${editingSale.id}`, saleData, { headers });
                toast.success('Sales invoice updated successfully!');
            } else {
                response = await axios.post('http://localhost:8080/api/sales', saleData, { headers });
                toast.success('Sales invoice created successfully! Stock updated.');
            }
            
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Error saving sales:', error);
            if (error.response) {
                if (error.response.status === 400) {
                    const errorMsg = error.response.data?.error || 'Invalid data. Please check all fields.';
                    toast.error(errorMsg);
                } else if (error.response.status === 403) {
                    toast.error('You are not authorized. Please login again.');
                } else {
                    toast.error(error.response.data?.error || 'Failed to save sales');
                }
            } else {
                toast.error('Network error. Please check your connection.');
            }
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setSaleItems([]);
        setSearchTerm('');
        setStockUpdate([]);
        setEditingSale(null);
        setEditMode(false);
        const today = new Date();
        const dateStr = today.getFullYear() + 
            String(today.getMonth() + 1).padStart(2, '0') + 
            String(today.getDate()).padStart(2, '0');
        const count = sales.length + 1;
        const invoiceNo = `SAL-${dateStr}-${String(count).padStart(4, '0')}`;
        setFormData({
            invoiceNo: invoiceNo,
            customerId: '',
            invoiceDate: today.toISOString().split('T')[0],
            paymentType: 'Cash',
            discount: 0,
            taxRate: 18,
            amountPaid: 0,
            salesPerson: '',
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

    const getCustomerName = (customerId) => {
        if (!customerId) return '-';
        const customer = customers.find(c => c.id === customerId);
        return customer?.customerName || '-';
    };

    // WORKING PRINT FUNCTION
    const handlePrintInvoice = () => {
        console.log('Print button clicked');
        console.log('Sale items:', saleItems);
        console.log('Summary:', summary);
        console.log('Form data:', formData);
        
        if (saleItems.length === 0) {
            toast.warning('No items to print!');
            return;
        }

        try {
            const customerName = getCustomerName(formData.customerId);
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
            const timeStr = now.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
            });

            let itemsHTML = '';
            saleItems.forEach((item, index) => {
                itemsHTML += `
                    <tr>
                        <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${item.itemCode}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${item.itemName}</td>
                        <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">${formatCurrency(item.unitPrice)}</td>
                        <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">${item.quantity}</td>
                        <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">${item.discountPercent || 0}%</td>
                        <td style="text-align: right; padding: 8px; border: 1px solid #ddd; font-weight: bold;">${formatCurrency(item.amount)}</td>
                    </tr>
                `;
            });

            const printContent = `
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>Sales Invoice - ${formData.invoiceNo}</title>
                        <style>
                            * { margin: 0; padding: 0; box-sizing: border-box; }
                            body { font-family: Arial, Helvetica, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; color: #333; background: #fff; }
                            .invoice-box { border: 1px solid #ddd; padding: 30px; border-radius: 5px; }
                            .invoice-header { text-align: center; border-bottom: 3px solid #1a237e; padding-bottom: 15px; margin-bottom: 25px; }
                            .invoice-title { font-size: 28px; font-weight: bold; color: #1a237e; text-transform: uppercase; letter-spacing: 2px; }
                            .company-name { font-size: 16px; color: #666; margin-top: 5px; }
                            .invoice-number { font-size: 14px; color: #888; margin-top: 8px; }
                            .invoice-number strong { color: #333; }
                            .invoice-details { margin-bottom: 25px; background: #f8f9fa; padding: 15px; border-radius: 5px; }
                            .invoice-details table { width: 100%; border: none; }
                            .invoice-details td { padding: 6px 10px; border: none; font-size: 14px; }
                            .label { font-weight: bold; color: #555; width: 120px; }
                            .label-value { color: #333; }
                            table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
                            th { background: #f0f0f0; padding: 10px 12px; text-align: left; border: 1px solid #ddd; font-weight: 600; }
                            td { padding: 8px 12px; border: 1px solid #ddd; }
                            .text-right { text-align: right; }
                            .text-center { text-align: center; }
                            .total-row { font-weight: bold; background: #f9f9f9; }
                            .grand-total-row { font-size: 18px; background: #e3f2fd; }
                            .grand-total-row td { font-weight: bold; color: #1976d2; }
                            .footer { margin-top: 30px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #ddd; padding-top: 15px; }
                            @media print { body { padding: 20px; } .no-print { display: none; } .invoice-box { border: none; padding: 0; } }
                        </style>
                    </head>
                    <body>
                        <div class="invoice-box">
                            <div class="invoice-header">
                                <div class="invoice-title">INVOICE</div>
                                <div class="company-name">Inventory Management System</div>
                                <div class="invoice-number">Invoice No: <strong>${formData.invoiceNo}</strong></div>
                            </div>
                            <div class="invoice-details">
                                <table>
                                    <tr>
                                        <td><span class="label">Customer:</span> <span class="label-value">${customerName}</span></td>
                                        <td style="text-align: right;"><span class="label">Date:</span> <span class="label-value">${formatDate(formData.invoiceDate)}</span></td>
                                    </tr>
                                    <tr>
                                        <td><span class="label">Payment Type:</span> <span class="label-value">${formData.paymentType}</span></td>
                                        <td style="text-align: right;"><span class="label">Sales Person:</span> <span class="label-value">${formData.salesPerson || 'N/A'}</span></td>
                                    </tr>
                                </table>
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th style="text-align: center; width: 40px;">#</th>
                                        <th style="width: 100px;">Item Code</th>
                                        <th>Item Name</th>
                                        <th style="text-align: right; width: 110px;">Unit Price</th>
                                        <th style="text-align: center; width: 60px;">Qty</th>
                                        <th style="text-align: right; width: 80px;">Disc %</th>
                                        <th style="text-align: right; width: 120px;">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>${itemsHTML}</tbody>
                                <tfoot>
                                    <tr class="total-row">
                                        <td colspan="6" style="text-align: right; padding: 10px;">Subtotal:</td>
                                        <td style="text-align: right; padding: 10px; font-weight: bold;">${formatCurrency(summary.subtotal)}</td>
                                    </tr>
                                    <tr class="total-row">
                                        <td colspan="6" style="text-align: right; padding: 10px;">Discount:</td>
                                        <td style="text-align: right; padding: 10px; font-weight: bold;">${formatCurrency(summary.discount)}</td>
                                    </tr>
                                    <tr class="total-row">
                                        <td colspan="6" style="text-align: right; padding: 10px;">Tax (GST ${formData.taxRate}%):</td>
                                        <td style="text-align: right; padding: 10px; font-weight: bold;">${formatCurrency(summary.tax)}</td>
                                    </tr>
                                    <tr class="grand-total-row">
                                        <td colspan="6" style="text-align: right; padding: 12px; font-size: 18px;">Total Amount:</td>
                                        <td style="text-align: right; padding: 12px; font-size: 18px;">${formatCurrency(summary.totalAmount)}</td>
                                    </tr>
                                    <tr>
                                        <td colspan="6" style="text-align: right; padding: 10px;">Amount Paid:</td>
                                        <td style="text-align: right; padding: 10px;">${formatCurrency(summary.amountPaid)}</td>
                                    </tr>
                                    <tr>
                                        <td colspan="6" style="text-align: right; padding: 10px; font-weight: bold;">Balance:</td>
                                        <td style="text-align: right; padding: 10px; font-weight: bold; color: ${summary.balance > 0 ? '#c62828' : '#2e7d32'};">
                                            ${formatCurrency(summary.balance)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                            ${formData.notes ? `
                                <div style="margin-top: 20px; padding: 12px; background: #f5f5f5; border-radius: 5px; font-size: 14px;">
                                    <strong>Notes:</strong> ${formData.notes}
                                </div>
                            ` : ''}
                            <div class="footer">
                                <p>Thank you for your business!</p>
                                <p style="margin-top: 5px;">This is a computer-generated invoice.</p>
                                <p style="margin-top: 5px;">Generated on: ${dateStr} at ${timeStr}</p>
                            </div>
                        </div>
                        <script>
                            window.onload = function() { 
                                console.log('Print window loaded');
                                setTimeout(function() { 
                                    window.print(); 
                                }, 1000); 
                            }
                        <\/script>
                    </body>
                </html>
            `;

            const printWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
            if (!printWindow) {
                toast.error('Please allow popups for this site');
                return;
            }
            
            printWindow.document.write(printContent);
            printWindow.document.close();
            toast.success('Print window opened!');
            
        } catch (error) {
            console.error('Print error:', error);
            toast.error('Failed to print: ' + error.message);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 className="page-title">Sales Entry</h1>
                <button className="btn-primary" onClick={() => {
                    setEditMode(false);
                    setEditingSale(null);
                    setShowForm(true);
                }}>
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
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales && sales.length > 0 ? (
                                sales.map((sale) => (
                                    <tr key={sale.id}>
                                        <td><strong>{sale.invoiceNo}</strong></td>
                                        <td>{getCustomerName(sale.customerId)}</td>
                                        <td>{sale.invoiceDate}</td>
                                        <td>{formatCurrency(sale.totalAmount)}</td>
                                        <td>
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                backgroundColor: parseFloat(sale.balance) === 0 ? '#c6f6d5' : '#fefcbf',
                                                color: parseFloat(sale.balance) === 0 ? '#276749' : '#975a16'
                                            }}>
                                                {parseFloat(sale.balance) === 0 ? 'Paid' : 'Pending'}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                onClick={() => handleEdit(sale)}
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
                                        No sales found. Create your first sale!
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
                            <h2>{editMode ? 'Edit Sales Invoice' : 'Sales Invoice'}</h2>
                            {saleItems.length > 0 && (
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

                        <form onSubmit={handleSubmit}>
                            {/* ... rest of the form (same as before) ... */}
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
                                        name="invoiceNo"
                                        value={formData.invoiceNo}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                        disabled={editMode}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>
                                        Invoice Date
                                    </label>
                                    <input
                                        type="date"
                                        name="invoiceDate"
                                        value={formData.invoiceDate}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>
                                        Customer *
                                    </label>
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
                                                {customer.customerName} ({customer.customerId})
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
                                        Sales Person
                                    </label>
                                    <input
                                        type="text"
                                        name="salesPerson"
                                        value={formData.salesPerson}
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
                                                onClick={() => addSaleItem(item)}
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

                                {saleItems.length > 0 && (
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
                                                {saleItems.map((item, index) => (
                                                    <tr key={item.id}>
                                                        <td>{index + 1}</td>
                                                        <td>{item.itemCode}</td>
                                                        <td>{item.itemName}</td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                value={item.unitPrice}
                                                                onChange={(e) => updateSaleItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                                style={{ width: '100%', padding: '4px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                            />
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateSaleItem(item.id, 'quantity', Math.max(1, (item.quantity || 0) - 1))}
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
                                                                    onChange={(e) => updateSaleItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                                                    style={{ width: '60px', padding: '4px', textAlign: 'center', border: '1px solid #ddd', borderRadius: '4px' }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const maxStock = item.maxStock || 999;
                                                                        if (item.quantity < maxStock) {
                                                                            updateSaleItem(item.id, 'quantity', (item.quantity || 0) + 1);
                                                                        } else {
                                                                            toast.warning(`Only ${maxStock} items available`);
                                                                        }
                                                                    }}
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
                                                            <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                                                                Max: {item.maxStock || 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                value={item.discountPercent || 0}
                                                                onChange={(e) => updateSaleItem(item.id, 'discountPercent', parseFloat(e.target.value) || 0)}
                                                                style={{ width: '100%', padding: '4px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                            />
                                                        </td>
                                                        <td style={{ fontWeight: 'bold' }}>
                                                            {formatCurrency(item.amount || 0)}
                                                        </td>
                                                        <td>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeSaleItem(item.id)}
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

                            {saleItems.length > 0 && (
                                <div style={{ marginBottom: '20px' }}>
                                    <h4>Stock (After Sale)</h4>
                                    <div className="table-container">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Item Code</th>
                                                    <th>Item Name</th>
                                                    <th>Previous Stock</th>
                                                    <th>Quantity Sold</th>
                                                    <th>Current Stock</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stockUpdate.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>{item.itemCode}</td>
                                                        <td>{item.itemName}</td>
                                                        <td>{item.previousStock}</td>
                                                        <td style={{ color: '#c62828', fontWeight: 'bold' }}>
                                                            -{item.quantitySold}
                                                        </td>
                                                        <td style={{ fontWeight: 'bold', color: item.currentStock < 0 ? '#c62828' : '#2e7d32' }}>
                                                            {item.currentStock}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {saleItems.length > 0 && (
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
                                background: '#fffbeb',
                                borderLeft: '4px solid #ed8936',
                                borderRadius: '4px',
                                marginBottom: '20px',
                                fontSize: '14px',
                                color: '#975a16'
                            }}>
                                <strong>Note:</strong> Stock will be reduced after saving this sales entry.
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

export default SalesEntry;