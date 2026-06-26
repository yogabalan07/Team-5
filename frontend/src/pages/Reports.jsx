import React, { useState, useEffect } from 'react';
import { 
    FaBox, 
    FaMoneyBillWave,
    FaFilter,
    FaPrint,
    FaFileExcel,
    FaFilePdf,
    FaSync,
    FaCalendarAlt,
    FaUsers,
    FaList,
    FaUser
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const Reports = () => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('stock');
    const [salesSummary, setSalesSummary] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [stockMovement, setStockMovement] = useState([]);
    const [summary, setSummary] = useState({
        totalItems: 0,
        totalOpeningQty: 0,
        totalPurchaseQty: 0,
        totalSalesQty: 0,
        totalClosingQty: 0,
        totalStockValueCost: 0,
        totalStockValueSale: 0
    });
    const [salesSummaryStats, setSalesSummaryStats] = useState({
        totalSales: 0,
        totalCollected: 0,
        totalOutstanding: 0,
        totalTransactions: 0
    });
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        category: 'All Categories',
        customerId: 'All Customers'
    });
    const [categories, setCategories] = useState([]);
    const [filteredStock, setFilteredStock] = useState([]);
    const [filteredSales, setFilteredSales] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    // Apply filters whenever data or filters change
    useEffect(() => {
        applyFilters();
    }, [stockMovement, salesSummary, filters]);

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
            
            const customersRes = await axios.get('http://localhost:8080/api/customers', { headers });
            setCustomers(customersRes.data || []);

            await fetchSalesSummary();
            await fetchStockMovement();

            if (stockMovement.length > 0) {
                const uniqueCategories = [...new Set(stockMovement.map(item => item.category))].filter(Boolean);
                setCategories(uniqueCategories);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to fetch report data');
        } finally {
            setLoading(false);
        }
    };

    const fetchSalesSummary = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            
            let customerName = '';
            if (filters.customerId !== 'All Customers' && filters.customerId) {
                const selectedCustomer = customers.find(c => c.id === parseInt(filters.customerId));
                if (selectedCustomer) {
                    customerName = selectedCustomer.customerName;
                }
            }
            
            let url = 'http://localhost:8080/api/reports/sales-summary-view?';
            if (filters.startDate) url += `startDate=${filters.startDate}&`;
            if (filters.endDate) url += `endDate=${filters.endDate}&`;
            if (customerName) url += `customerName=${encodeURIComponent(customerName)}`;
            
            const response = await axios.get(url, { headers });
            setSalesSummary(response.data || []);
            calculateSalesSummaryStats(response.data);
        } catch (error) {
            console.error('Error fetching sales summary:', error);
            toast.error('Failed to fetch sales summary data');
        }
    };

    const fetchStockMovement = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            
            const response = await axios.get(
                `http://localhost:8080/api/reports/stock-movement?startDate=${filters.startDate}&endDate=${filters.endDate}`, 
                { headers }
            );
            
            setStockMovement(response.data || []);
            calculateSummary(response.data);
        } catch (error) {
            console.error('Error fetching stock movement:', error);
            toast.error('Failed to fetch stock movement data');
        }
    };

    const calculateSummary = (data) => {
        let totalOpeningQty = 0;
        let totalPurchaseQty = 0;
        let totalSalesQty = 0;
        let totalClosingQty = 0;
        let totalStockValueCost = 0;
        let totalStockValueSale = 0;

        data.forEach(item => {
            totalOpeningQty += parseFloat(item.opening_stock) || 0;
            totalPurchaseQty += parseFloat(item.purchases) || 0;
            totalSalesQty += parseFloat(item.sales) || 0;
            totalClosingQty += parseFloat(item.closing_stock) || 0;
            totalStockValueCost += parseFloat(item.stock_value_cost) || 0;
            totalStockValueSale += parseFloat(item.stock_value_sale) || 0;
        });

        setSummary({
            totalItems: data.length,
            totalOpeningQty: totalOpeningQty,
            totalPurchaseQty: totalPurchaseQty,
            totalSalesQty: totalSalesQty,
            totalClosingQty: totalClosingQty,
            totalStockValueCost: totalStockValueCost,
            totalStockValueSale: totalStockValueSale
        });
    };

    const calculateSalesSummaryStats = (data) => {
        let totalSales = 0;
        let totalCollected = 0;
        let totalOutstanding = 0;

        data.forEach(item => {
            totalSales += parseFloat(item.total_amount) || 0;
            totalCollected += parseFloat(item.amount_paid) || 0;
            totalOutstanding += parseFloat(item.balance) || 0;
        });

        setSalesSummaryStats({
            totalSales: totalSales,
            totalCollected: totalCollected,
            totalOutstanding: totalOutstanding,
            totalTransactions: data.length
        });
    };

    const applyFilters = () => {
        // Filter stock by category
        let filteredStockData = [...stockMovement];
        if (filters.category !== 'All Categories') {
            filteredStockData = filteredStockData.filter(item => 
                item.category === filters.category
            );
        }
        setFilteredStock(filteredStockData);
        calculateSummary(filteredStockData);

        // Sales are already filtered from the backend
        setFilteredSales(salesSummary);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({
            ...filters,
            [name]: value
        });
    };

    const handleViewReport = async () => {
        await fetchSalesSummary();
        await fetchStockMovement();
        toast.success('Report updated!');
    };

    // WORKING EXCEL EXPORT - Uses the actual data
    const handleExportExcel = () => {
        console.log('Export Excel clicked');
        console.log('Active tab:', activeTab);
        console.log('Filtered stock data:', filteredStock);
        console.log('Filtered sales data:', filteredSales);
        console.log('Stock movement data:', stockMovement);
        console.log('Sales summary data:', salesSummary);
        
        try {
            let dataToExport = [];
            let fileName = '';
            let sheetName = '';
            
            if (activeTab === 'stock') {
                // Use filteredStock if available, otherwise use stockMovement
                const stockData = filteredStock && filteredStock.length > 0 ? filteredStock : stockMovement;
                
                if (!stockData || stockData.length === 0) {
                    toast.warning('No stock data to export! Please apply filters to see data.');
                    return;
                }
                
                console.log('Exporting stock data:', stockData);
                
                dataToExport = stockData.map((item, index) => ({
                    'S.No': index + 1,
                    'Item Code': item.item_code || '',
                    'Item Name': item.item_name || '',
                    'Category': item.category || '',
                    'Unit': item.unit || 'Nos',
                    'Opening Stock': parseFloat(item.opening_stock) || 0,
                    'Purchases': parseFloat(item.purchases) || 0,
                    'Sales': parseFloat(item.sales) || 0,
                    'Closing Stock': parseFloat(item.closing_stock) || 0,
                    'Rate (Avg. Cost)': parseFloat(item.rate_avg_cost) || 0,
                    'Stock Value (Cost)': parseFloat(item.stock_value_cost) || 0,
                    'Stock Value (Sale)': parseFloat(item.stock_value_sale) || 0,
                    'Status': item.status || 'In Stock'
                }));
                fileName = `Stock_Report_${new Date().toISOString().split('T')[0]}`;
                sheetName = 'Stock Report';
                
                // Add summary row
                if (summary) {
                    dataToExport.push({
                        'S.No': '',
                        'Item Code': 'TOTAL',
                        'Item Name': '',
                        'Category': '',
                        'Unit': '',
                        'Opening Stock': summary.totalOpeningQty || 0,
                        'Purchases': summary.totalPurchaseQty || 0,
                        'Sales': summary.totalSalesQty || 0,
                        'Closing Stock': summary.totalClosingQty || 0,
                        'Rate (Avg. Cost)': '',
                        'Stock Value (Cost)': summary.totalStockValueCost || 0,
                        'Stock Value (Sale)': summary.totalStockValueSale || 0,
                        'Status': ''
                    });
                }
                
            } else if (activeTab === 'sales') {
                // Use filteredSales if available, otherwise use salesSummary
                const salesData = filteredSales && filteredSales.length > 0 ? filteredSales : salesSummary;
                
                if (!salesData || salesData.length === 0) {
                    toast.warning('No sales data to export! Please apply filters to see data.');
                    return;
                }
                
                console.log('Exporting sales data:', salesData);
                
                dataToExport = salesData.map((item, index) => ({
                    'S.No': index + 1,
                    'Invoice No': item.invoice_no || '',
                    'Customer Name': item.customer_name || 'Walk-in',
                    'Date': item.invoice_date || '',
                    'Total Amount': parseFloat(item.total_amount) || 0,
                    'Amount Paid': parseFloat(item.amount_paid) || 0,
                    'Balance': parseFloat(item.balance) || 0,
                    'Payment Type': item.payment_type || 'Cash',
                    'Sales Person': item.sales_person || '-',
                    'Items': parseInt(item.total_items) || 0
                }));
                fileName = `Sales_Summary_${new Date().toISOString().split('T')[0]}`;
                sheetName = 'Sales Summary';
                
                // Add summary row
                if (salesSummaryStats) {
                    dataToExport.push({
                        'S.No': '',
                        'Invoice No': 'TOTAL',
                        'Customer Name': '',
                        'Date': '',
                        'Total Amount': salesSummaryStats.totalSales || 0,
                        'Amount Paid': salesSummaryStats.totalCollected || 0,
                        'Balance': salesSummaryStats.totalOutstanding || 0,
                        'Payment Type': '',
                        'Sales Person': '',
                        'Items': ''
                    });
                }
            }
            
            if (dataToExport.length === 0) {
                toast.warning('No data to export!');
                return;
            }
            
            console.log('Data to export:', dataToExport);
            
            // Create workbook
            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            
            // Auto column widths
            const colWidths = [];
            if (dataToExport.length > 0) {
                const keys = Object.keys(dataToExport[0]);
                for (let i = 0; i < keys.length; i++) {
                    colWidths.push({ wch: 20 });
                }
            }
            ws['!cols'] = colWidths;
            
            // Generate Excel file
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const data = new Blob([excelBuffer], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            saveAs(data, `${fileName}.xlsx`);
            
            toast.success(`Excel exported successfully! (${dataToExport.length - 1} rows)`);
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export Excel: ' + error.message);
        }
    };

    const handleExportPDF = () => {
        toast.info('PDF export will use print functionality. Click Print and select "Save as PDF".');
        setTimeout(() => {
            window.print();
        }, 1000);
    };

    const handlePrint = () => {
        window.print();
    };

    const resetFilters = () => {
        setFilters({
            startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            category: 'All Categories',
            customerId: 'All Customers'
        });
        toast.info('Filters reset!');
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

    if (loading) return <LoadingSpinner />;

    return (
        <div className="report-container" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 className="page-title">Reports</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaPrint /> Print
                    </button>
                    <button className="btn-success" onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaFileExcel /> Export Excel
                    </button>
                    <button className="btn-danger" onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaFilePdf /> Export PDF
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ 
                display: 'flex', 
                gap: '10px', 
                marginBottom: '20px',
                borderBottom: '2px solid #e2e8f0',
                paddingBottom: '10px',
                flexWrap: 'wrap'
            }}>
                <button
                    onClick={() => setActiveTab('stock')}
                    style={{
                        padding: '10px 24px',
                        background: activeTab === 'stock' ? '#1976d2' : 'none',
                        color: activeTab === 'stock' ? 'white' : '#4a5568',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: activeTab === 'stock' ? '600' : '400',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <FaBox /> Stock Report (Item-wise)
                </button>
                <button
                    onClick={() => setActiveTab('sales')}
                    style={{
                        padding: '10px 24px',
                        background: activeTab === 'sales' ? '#1976d2' : 'none',
                        color: activeTab === 'sales' ? 'white' : '#4a5568',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: activeTab === 'sales' ? '600' : '400',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <FaUsers /> Sales Summary (Customer-wise)
                </button>
            </div>

            {/* Filters Section */}
            <div className="card-shadow" style={{ padding: '20px', marginBottom: '20px' }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '20px', 
                    flexWrap: 'wrap' 
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaCalendarAlt style={{ color: '#555' }} />
                        <label style={{ fontWeight: '500', color: '#555' }}>From:</label>
                        <input
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            style={{
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label style={{ fontWeight: '500', color: '#555' }}>To:</label>
                        <input
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            style={{
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                        />
                    </div>
                    {activeTab === 'stock' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FaList style={{ color: '#555' }} />
                            <label style={{ fontWeight: '500', color: '#555' }}>Category:</label>
                            <select
                                name="category"
                                value={filters.category}
                                onChange={handleFilterChange}
                                style={{
                                    padding: '8px 12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    minWidth: '150px'
                                }}
                            >
                                <option value="All Categories">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {activeTab === 'sales' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FaUser style={{ color: '#555' }} />
                            <label style={{ fontWeight: '500', color: '#555' }}>Customer:</label>
                            <select
                                name="customerId"
                                value={filters.customerId}
                                onChange={handleFilterChange}
                                style={{
                                    padding: '8px 12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    minWidth: '150px'
                                }}
                            >
                                <option value="All Customers">All Customers</option>
                                {customers.map(customer => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.customerName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <button 
                        className="btn-primary" 
                        onClick={handleViewReport}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <FaSync /> View Report
                    </button>
                    <button 
                        className="btn-secondary" 
                        onClick={resetFilters}
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            padding: '8px 16px',
                            background: '#e2e8f0',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#4a5568'
                        }}
                    >
                        <FaFilter /> Reset Filters
                    </button>
                </div>
            </div>

            {/* Stock Report Tab - Item-wise */}
            {activeTab === 'stock' && (
                <>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '15px',
                        marginBottom: '20px'
                    }}>
                        <div className="card-shadow" style={{ padding: '15px', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Total Items</h3>
                            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#4299e1' }}>
                                {summary.totalItems}
                            </div>
                        </div>
                        <div className="card-shadow" style={{ padding: '15px', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Opening Stock</h3>
                            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#48bb78' }}>
                                {summary.totalOpeningQty}
                            </div>
                        </div>
                        <div className="card-shadow" style={{ padding: '15px', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Purchases</h3>
                            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#ed8936' }}>
                                {summary.totalPurchaseQty}
                            </div>
                        </div>
                        <div className="card-shadow" style={{ padding: '15px', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Sales</h3>
                            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#e53e3e' }}>
                                {summary.totalSalesQty}
                            </div>
                        </div>
                        <div className="card-shadow" style={{ padding: '15px', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Closing Stock</h3>
                            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#9f7aea' }}>
                                {summary.totalClosingQty}
                            </div>
                        </div>
                    </div>

                    <div className="card-shadow" style={{ padding: '20px', overflow: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3>Item-wise Stock Movement Summary</h3>
                            <span style={{ fontSize: '13px', color: '#888' }}>
                                Period: {formatDate(filters.startDate)} - {formatDate(filters.endDate)}
                            </span>
                        </div>

                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Item Code</th>
                                        <th>Item Name</th>
                                        <th>Category</th>
                                        <th>Unit</th>
                                        <th>Opening Stock</th>
                                        <th>Purchases</th>
                                        <th>Sales</th>
                                        <th>Closing Stock</th>
                                        <th>Rate (Avg. Cost)</th>
                                        <th>Stock Value (Cost)</th>
                                        <th>Stock Value (Sale)</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStock.map((item, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td><strong>{item.item_code}</strong></td>
                                            <td>{item.item_name}</td>
                                            <td>{item.category}</td>
                                            <td>{item.unit || 'Nos'}</td>
                                            <td>{parseFloat(item.opening_stock) || 0}</td>
                                            <td style={{ color: '#ed8936' }}>{parseFloat(item.purchases) || 0}</td>
                                            <td style={{ color: '#e53e3e' }}>{parseFloat(item.sales) || 0}</td>
                                            <td><strong>{parseFloat(item.closing_stock) || 0}</strong></td>
                                            <td>{formatCurrency(parseFloat(item.rate_avg_cost) || 0)}</td>
                                            <td>{formatCurrency(parseFloat(item.stock_value_cost) || 0)}</td>
                                            <td>{formatCurrency(parseFloat(item.stock_value_sale) || 0)}</td>
                                            <td>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    backgroundColor: item.status === 'In Stock' ? '#c6f6d5' : 
                                                                  item.status === 'Low Stock' ? '#fefcbf' : '#fed7d7',
                                                    color: item.status === 'In Stock' ? '#276749' : 
                                                           item.status === 'Low Stock' ? '#975a16' : '#9b2c2c'
                                                }}>
                                                    {item.status || 'In Stock'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{ fontWeight: 'bold', background: '#f7fafc' }}>
                                        <td colSpan="5" style={{ textAlign: 'right' }}><strong>Total</strong></td>
                                        <td>{summary.totalOpeningQty}</td>
                                        <td>{summary.totalPurchaseQty}</td>
                                        <td>{summary.totalSalesQty}</td>
                                        <td>{summary.totalClosingQty}</td>
                                        <td>-</td>
                                        <td>{formatCurrency(summary.totalStockValueCost)}</td>
                                        <td>{formatCurrency(summary.totalStockValueSale)}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                            {filteredStock.length === 0 && (
                                <p style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                                    No stock data available for the selected period
                                </p>
                            )}
                        </div>

                        <div style={{ 
                            marginTop: '20px', 
                            padding: '15px',
                            background: '#f7fafc',
                            borderRadius: '4px',
                            fontSize: '13px',
                            color: '#666'
                        }}>
                            <p><strong>Note:</strong> Opening Stock is the stock available at the start of the period. 
                            Closing Stock = Opening Stock + Purchases - Sales.</p>
                            <p style={{ marginTop: '5px' }}>
                                <strong>Report Generated on:</strong> {new Date().toLocaleString()}
                            </p>
                        </div>
                    </div>
                </>
            )}

            {/* Sales Summary Tab - Customer-wise */}
            {activeTab === 'sales' && (
                <>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '15px',
                        marginBottom: '20px'
                    }}>
                        <div className="card-shadow" style={{ padding: '15px', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Total Sales</h3>
                            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#4299e1' }}>
                                {formatCurrency(salesSummaryStats.totalSales)}
                            </div>
                        </div>
                        <div className="card-shadow" style={{ padding: '15px', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Total Collected</h3>
                            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#48bb78' }}>
                                {formatCurrency(salesSummaryStats.totalCollected)}
                            </div>
                        </div>
                        <div className="card-shadow" style={{ padding: '15px', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Total Outstanding</h3>
                            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#ed8936' }}>
                                {formatCurrency(salesSummaryStats.totalOutstanding)}
                            </div>
                        </div>
                        <div className="card-shadow" style={{ padding: '15px', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Transactions</h3>
                            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#9f7aea' }}>
                                {salesSummaryStats.totalTransactions}
                            </div>
                        </div>
                    </div>

                    <div className="card-shadow" style={{ padding: '20px', overflow: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3>Customer-wise Sales Summary</h3>
                            <span style={{ fontSize: '13px', color: '#888' }}>
                                {filters.customerId !== 'All Customers' && filters.customerId ? 
                                    `Customer: ${customers.find(c => c.id === parseInt(filters.customerId))?.customerName || 'All'}` : 
                                    `Period: ${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`}
                            </span>
                        </div>

                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Invoice No</th>
                                        <th>Customer Name</th>
                                        <th>Date</th>
                                        <th>Total Amount</th>
                                        <th>Amount Paid</th>
                                        <th>Balance</th>
                                        <th>Payment Type</th>
                                        <th>Sales Person</th>
                                        <th>Items</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSales.map((item, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td><strong>{item.invoice_no}</strong></td>
                                            <td style={{ fontWeight: '500' }}>{item.customer_name || 'Walk-in'}</td>
                                            <td>{formatDate(item.invoice_date)}</td>
                                            <td style={{ fontWeight: 'bold', color: '#2b6cb0' }}>
                                                {formatCurrency(parseFloat(item.total_amount) || 0)}
                                            </td>
                                            <td style={{ color: '#276749' }}>
                                                {formatCurrency(parseFloat(item.amount_paid) || 0)}
                                            </td>
                                            <td style={{ 
                                                color: parseFloat(item.balance) > 0 ? '#c62828' : '#2e7d32',
                                                fontWeight: 'bold'
                                            }}>
                                                {formatCurrency(parseFloat(item.balance) || 0)}
                                            </td>
                                            <td>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    backgroundColor: item.payment_type === 'Cash' ? '#c6f6d5' : 
                                                                  item.payment_type === 'Credit' ? '#fefcbf' : '#ebf8ff',
                                                    color: item.payment_type === 'Cash' ? '#276749' : 
                                                           item.payment_type === 'Credit' ? '#975a16' : '#2b6cb0'
                                                }}>
                                                    {item.payment_type}
                                                </span>
                                            </td>
                                            <td>{item.sales_person || '-'}</td>
                                            <td style={{ textAlign: 'center' }}>{item.total_items || 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{ fontWeight: 'bold', background: '#f7fafc' }}>
                                        <td colSpan="4" style={{ textAlign: 'right' }}><strong>Total</strong></td>
                                        <td>{formatCurrency(salesSummaryStats.totalSales)}</td>
                                        <td>{formatCurrency(salesSummaryStats.totalCollected)}</td>
                                        <td>{formatCurrency(salesSummaryStats.totalOutstanding)}</td>
                                        <td colSpan="3"></td>
                                    </tr>
                                </tfoot>
                            </table>
                            {filteredSales.length === 0 && (
                                <p style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                                    No sales data available for the selected filters
                                </p>
                            )}
                        </div>

                        <div style={{ 
                            marginTop: '20px', 
                            padding: '15px',
                            background: '#f7fafc',
                            borderRadius: '4px',
                            fontSize: '13px',
                            color: '#666'
                        }}>
                            <p><strong>Note:</strong> Sales summary showing all transactions with customer-wise breakdown and payment status.</p>
                            <p style={{ marginTop: '5px' }}>
                                <strong>Report Generated on:</strong> {new Date().toLocaleString()}
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Reports;