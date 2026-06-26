import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaBox, 
    FaUsers, 
    FaTruck, 
    FaChartBar,
    FaExclamationTriangle,
    FaCheckCircle,
    FaTimesCircle,
    FaPlus,
    FaUserPlus,
    FaTruckLoading,
    FaShoppingCart,
    FaFileInvoice
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        items: [],
        customers: [],
        suppliers: [],
        summary: {
            totalItems: 0,
            totalCustomers: 0,
            totalSuppliers: 0,
            lowStockItems: 0,
            outOfStockItems: 0,
            todayTotalSales: 0,
            todayTotalPurchases: 0
        },
        recentTransactions: [],
        stockStats: {
            inStock: 0,
            lowStock: 0,
            outOfStock: 0,
            total: 0
        },
        totalStockValue: 0
    });
    
    const navigate = useNavigate();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            
            // Check if token exists
            if (!token) {
                toast.error('Please login first');
                navigate('/login');
                setLoading(false);
                return;
            }

            const headers = { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            console.log('Fetching dashboard data with token:', token.substring(0, 20) + '...');

            // Fetch all data in parallel
            const [itemsRes, customersRes, suppliersRes, summaryRes] = await Promise.all([
                axios.get('http://localhost:8080/api/items', { headers }),
                axios.get('http://localhost:8080/api/customers', { headers }),
                axios.get('http://localhost:8080/api/suppliers', { headers }),
                axios.get('http://localhost:8080/api/reports/summary', { headers })
            ]);

            console.log('Items data:', itemsRes.data);
            console.log('Customers data:', customersRes.data);
            console.log('Suppliers data:', suppliersRes.data);
            console.log('Summary data:', summaryRes.data);

            const itemsData = itemsRes.data || [];
            const customersData = customersRes.data || [];
            const suppliersData = suppliersRes.data || [];
            const summaryData = summaryRes.data || {};

            // Calculate stock stats
            let inStock = 0;
            let lowStock = 0;
            let outOfStock = 0;
            let stockValue = 0;

            itemsData.forEach(item => {
                stockValue += (item.price || 0) * (item.stockQty || 0);
                
                if (item.status === 'In Stock' || (item.stockQty > (item.reorderLevel || 5))) {
                    inStock++;
                } else if (item.status === 'Low Stock' || (item.stockQty > 0 && item.stockQty <= (item.reorderLevel || 5))) {
                    lowStock++;
                } else {
                    outOfStock++;
                }
            });

            // Fetch recent transactions
            let recentTransactions = [];
            try {
                const [purchasesRes, salesRes] = await Promise.all([
                    axios.get('http://localhost:8080/api/purchases', { headers }),
                    axios.get('http://localhost:8080/api/sales', { headers })
                ]);

                const purchases = purchasesRes.data || [];
                const sales = salesRes.data || [];

                // Combine transactions
                const allTransactions = [
                    ...purchases.map(p => ({
                        type: 'Purchase',
                        reference: p.purchaseInvoiceNo || 'N/A',
                        party: suppliersData.find(s => s.id === p.supplierId)?.supplierName || 'Unknown',
                        date: p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString('en-IN', { 
                            day: '2-digit', month: 'short', year: 'numeric' 
                        }) : 'N/A',
                        amount: `₹ ${(p.totalAmount || 0).toFixed(2)}`
                    })),
                    ...sales.map(s => ({
                        type: 'Sales',
                        reference: s.invoiceNo || 'N/A',
                        party: customersData.find(c => c.id === s.customerId)?.customerName || 'Unknown',
                        date: s.invoiceDate ? new Date(s.invoiceDate).toLocaleDateString('en-IN', { 
                            day: '2-digit', month: 'short', year: 'numeric' 
                        }) : 'N/A',
                        amount: `₹ ${(s.totalAmount || 0).toFixed(2)}`
                    }))
                ];

                allTransactions.sort((a, b) => {
                    const dateA = new Date(a.date);
                    const dateB = new Date(b.date);
                    return dateB - dateA;
                });

                recentTransactions = allTransactions.slice(0, 5);
            } catch (error) {
                console.log('No transactions found yet');
                recentTransactions = [];
            }

            setData({
                items: itemsData,
                customers: customersData,
                suppliers: suppliersData,
                summary: {
                    totalItems: itemsData.length,
                    totalCustomers: customersData.length,
                    totalSuppliers: suppliersData.length,
                    lowStockItems: lowStock,
                    outOfStockItems: outOfStock,
                    todayTotalSales: summaryData.todayTotalSales || 0,
                    todayTotalPurchases: summaryData.todayTotalPurchases || 0
                },
                recentTransactions,
                stockStats: {
                    inStock,
                    lowStock,
                    outOfStock,
                    total: itemsData.length || 1
                },
                totalStockValue: stockValue
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            
            if (error.response?.status === 401 || error.response?.status === 403) {
                toast.error('Session expired. Please login again.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            } else {
                toast.error('Failed to load dashboard data');
                // Set empty data so dashboard shows zeros instead of error
                setData({
                    items: [],
                    customers: [],
                    suppliers: [],
                    summary: {
                        totalItems: 0,
                        totalCustomers: 0,
                        totalSuppliers: 0,
                        lowStockItems: 0,
                        outOfStockItems: 0,
                        todayTotalSales: 0,
                        todayTotalPurchases: 0
                    },
                    recentTransactions: [],
                    stockStats: {
                        inStock: 0,
                        lowStock: 0,
                        outOfStock: 0,
                        total: 1
                    },
                    totalStockValue: 0
                });
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    const { items, customers, suppliers, summary, recentTransactions, stockStats, totalStockValue } = data;

    // Stats cards data
    const stats = [
        {
            title: 'Total Items',
            value: summary.totalItems || 0,
            icon: <FaBox />,
            color: '#4299e1',
            bgColor: '#ebf8ff',
            link: '/items',
            linkText: 'View all items →'
        },
        {
            title: 'Total Customers',
            value: summary.totalCustomers || 0,
            icon: <FaUsers />,
            color: '#48bb78',
            bgColor: '#f0fff4',
            link: '/customers',
            linkText: 'View all customers →'
        },
        {
            title: 'Total Suppliers',
            value: summary.totalSuppliers || 0,
            icon: <FaTruck />,
            color: '#9f7aea',
            bgColor: '#faf5ff',
            link: '/suppliers',
            linkText: 'View all suppliers →'
        },
        {
            title: 'Total Stock',
            value: `₹ ${totalStockValue.toFixed(0)}`,
            icon: <FaChartBar />,
            color: '#ed8936',
            bgColor: '#fffbeb',
            link: '/reports',
            linkText: 'View stock report →'
        }
    ];

    // Quick actions
    const quickActions = [
        { icon: <FaPlus />, label: 'Add Item', link: '/items', color: '#4299e1' },
        { icon: <FaUserPlus />, label: 'Add Customer', link: '/customers', color: '#48bb78' },
        { icon: <FaTruckLoading />, label: 'Add Supplier', link: '/suppliers', color: '#9f7aea' },
        { icon: <FaShoppingCart />, label: 'Purchase Entry', link: '/purchases', color: '#ed8936' },
        { icon: <FaFileInvoice />, label: 'Sales Entry', link: '/sales', color: '#38b2ac' },
        { icon: <FaChartBar />, label: 'Stock Report', link: '/reports', color: '#667eea' }
    ];

    return (
        <div style={{ padding: '20px' }}>
            <h1 className="page-title" style={{ marginBottom: '30px' }}>Dashboard</h1>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
            }}>
                {stats.map((stat, index) => (
                    <div key={index} className="card-shadow" style={{
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s',
                        cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    onClick={() => navigate(stat.link)}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '10px'
                        }}>
                            <div style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '10px',
                                backgroundColor: stat.bgColor,
                                color: stat.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px'
                            }}>
                                {stat.icon}
                            </div>
                            <span style={{ color: '#667eea', fontSize: '14px', cursor: 'pointer' }}>
                                {stat.linkText}
                            </span>
                        </div>
                        <h2 style={{ margin: '5px 0', fontSize: '28px', fontWeight: 'bold' }}>
                            {stat.value}
                        </h2>
                        <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                            {stat.title}
                        </p>
                    </div>
                ))}
            </div>

            {/* Stock Overview and Recent Transactions - Two Column Layout */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.5fr',
                gap: '24px',
                marginBottom: '30px'
            }}>
                {/* Stock Overview */}
                <div className="card-shadow" style={{ padding: '20px' }}>
                    <h3 style={{ marginBottom: '20px', color: '#333' }}>Stock Overview</h3>
                    
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '10px 0',
                            borderBottom: '1px solid #f0f0f0'
                        }}>
                            <span style={{ color: '#666' }}>In Stock</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontWeight: 'bold' }}>{stockStats.inStock}</span>
                                <span style={{ 
                                    color: '#48bb78', 
                                    fontSize: '12px',
                                    background: '#f0fff4',
                                    padding: '2px 8px',
                                    borderRadius: '12px'
                                }}>
                                    {stockStats.total > 0 ? ((stockStats.inStock / stockStats.total) * 100).toFixed(1) : 0}%
                                </span>
                            </div>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '10px 0',
                            borderBottom: '1px solid #f0f0f0'
                        }}>
                            <span style={{ color: '#666' }}>Low Stock</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontWeight: 'bold' }}>{stockStats.lowStock}</span>
                                <span style={{ 
                                    color: '#ed8936', 
                                    fontSize: '12px',
                                    background: '#fffbeb',
                                    padding: '2px 8px',
                                    borderRadius: '12px'
                                }}>
                                    {stockStats.total > 0 ? ((stockStats.lowStock / stockStats.total) * 100).toFixed(1) : 0}%
                                </span>
                            </div>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '10px 0'
                        }}>
                            <span style={{ color: '#666' }}>Out of Stock</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontWeight: 'bold' }}>{stockStats.outOfStock}</span>
                                <span style={{ 
                                    color: '#fc8181', 
                                    fontSize: '12px',
                                    background: '#fed7d7',
                                    padding: '2px 8px',
                                    borderRadius: '12px'
                                }}>
                                    {stockStats.total > 0 ? ((stockStats.outOfStock / stockStats.total) * 100).toFixed(1) : 0}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '5px',
                            background: '#f0fff4',
                            padding: '6px 12px',
                            borderRadius: '20px'
                        }}>
                            <FaCheckCircle style={{ color: '#48bb78', fontSize: '14px' }} />
                            <span style={{ fontSize: '13px', color: '#276749' }}>
                                In Stock: {stockStats.inStock}
                            </span>
                        </div>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '5px',
                            background: '#fffbeb',
                            padding: '6px 12px',
                            borderRadius: '20px'
                        }}>
                            <FaExclamationTriangle style={{ color: '#ed8936', fontSize: '14px' }} />
                            <span style={{ fontSize: '13px', color: '#975a16' }}>
                                Low Stock: {stockStats.lowStock}
                            </span>
                        </div>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '5px',
                            background: '#fed7d7',
                            padding: '6px 12px',
                            borderRadius: '20px'
                        }}>
                            <FaTimesCircle style={{ color: '#fc8181', fontSize: '14px' }} />
                            <span style={{ fontSize: '13px', color: '#9b2c2c' }}>
                                Out of Stock: {stockStats.outOfStock}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="card-shadow" style={{ padding: '20px' }}>
                    <h3 style={{ marginBottom: '20px', color: '#333' }}>Recent Transactions</h3>
                    {recentTransactions.length > 0 ? (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th style={{ fontSize: '13px' }}>Type</th>
                                        <th style={{ fontSize: '13px' }}>Reference No.</th>
                                        <th style={{ fontSize: '13px' }}>Party</th>
                                        <th style={{ fontSize: '13px' }}>Date</th>
                                        <th style={{ fontSize: '13px' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentTransactions.map((transaction, index) => (
                                        <tr key={index}>
                                            <td>
                                                <span style={{
                                                    padding: '3px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    background: transaction.type === 'Purchase' ? '#ebf8ff' : '#f0fff4',
                                                    color: transaction.type === 'Purchase' ? '#2b6cb0' : '#276749'
                                                }}>
                                                    {transaction.type}
                                                </span>
                                            </td>
                                            <td>{transaction.reference}</td>
                                            <td>{transaction.party}</td>
                                            <td>{transaction.date}</td>
                                            <td style={{ fontWeight: 'bold' }}>{transaction.amount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '30px 0' }}>
                            <p style={{ color: '#888' }}>No recent transactions</p>
                            <p style={{ color: '#aaa', fontSize: '14px' }}>
                                Add a purchase or sales entry to see them here
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card-shadow" style={{ padding: '20px' }}>
                <h3 style={{ marginBottom: '20px', color: '#333' }}>Quick Actions</h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '15px'
                }}>
                    {quickActions.map((action, index) => (
                        <div
                            key={index}
                            onClick={() => navigate(action.link)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '20px 15px',
                                background: '#f7fafc',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                border: '1px solid #edf2f7'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'white';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#f7fafc';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{
                                fontSize: '24px',
                                color: action.color,
                                marginBottom: '8px'
                            }}>
                                {action.icon}
                            </div>
                            <span style={{ fontSize: '13px', color: '#4a5568', textAlign: 'center' }}>
                                {action.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Dashboard Summary Footer */}
            <div style={{
                marginTop: '20px',
                padding: '15px 20px',
                background: '#f7fafc',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
            }}>
                <span style={{ color: '#718096', fontSize: '14px' }}>
                    📊 Last updated: {new Date().toLocaleString()}
                </span>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', color: '#4a5568' }}>
                        📦 Total Items: <strong>{summary.totalItems || 0}</strong>
                    </span>
                    <span style={{ fontSize: '13px', color: '#4a5568' }}>
                        👥 Total Customers: <strong>{summary.totalCustomers || 0}</strong>
                    </span>
                    <span style={{ fontSize: '13px', color: '#4a5568' }}>
                        🚚 Total Suppliers: <strong>{summary.totalSuppliers || 0}</strong>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;