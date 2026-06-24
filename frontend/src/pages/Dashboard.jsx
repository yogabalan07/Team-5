import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import reportService from '../services/reportService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/helpers';
import { FiBox, FiUsers, FiTruck, FiTrendingUp, FiDollarSign, FiShoppingCart } from 'react-icons/fi';

const Dashboard = () => {
    const [summary, setSummary] = useState({
        totalItems: 0,
        totalCustomers: 0,
        totalSuppliers: 0,
        totalSales: 0,
        totalPurchases: 0,
        lowStockItems: 0
    });
    const [loading, setLoading] = useState(true);
    const [recentSales, setRecentSales] = useState([]);
    const [recentPurchases, setRecentPurchases] = useState([]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [items, customers, suppliers, sales, purchases] = await Promise.all([
                api.get('/items'),
                api.get('/customers'),
                api.get('/suppliers'),
                api.get('/sales'),
                api.get('/purchases')
            ]);

            const itemsData = items.data || [];
            const lowStockItems = itemsData.filter(item => item.quantity < 10).length;
            const totalSales = sales.data?.reduce((sum, s) => sum + (s.quantity * s.unitPrice), 0) || 0;
            const totalPurchases = purchases.data?.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0) || 0;

            setSummary({
                totalItems: itemsData.length,
                totalCustomers: customers.data?.length || 0,
                totalSuppliers: suppliers.data?.length || 0,
                totalSales: totalSales,
                totalPurchases: totalPurchases,
                lowStockItems: lowStockItems
            });

            setRecentSales(sales.data?.slice(-5) || []);
            setRecentPurchases(purchases.data?.slice(-5) || []);
        } catch (error) {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <h1 className="page-title">Dashboard</h1>
            
            <div className="dashboard-grid">
                <div className="stat-card">
                    <div className="stat-icon items"><FiBox /></div>
                    <div className="stat-content">
                        <h3>Total Items</h3>
                        <p className="stat-value">{summary.totalItems}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon customers"><FiUsers /></div>
                    <div className="stat-content">
                        <h3>Total Customers</h3>
                        <p className="stat-value">{summary.totalCustomers}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon suppliers"><FiTruck /></div>
                    <div className="stat-content">
                        <h3>Total Suppliers</h3>
                        <p className="stat-value">{summary.totalSuppliers}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon low-stock"><FiTrendingUp /></div>
                    <div className="stat-content">
                        <h3>Low Stock Items</h3>
                        <p className="stat-value" style={{ color: summary.lowStockItems > 0 ? '#ff6b6b' : '#51cf66' }}>
                            {summary.lowStockItems}
                        </p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon sales"><FiDollarSign /></div>
                    <div className="stat-content">
                        <h3>Total Sales</h3>
                        <p className="stat-value">{formatCurrency(summary.totalSales)}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon purchases"><FiShoppingCart /></div>
                    <div className="stat-content">
                        <h3>Total Purchases</h3>
                        <p className="stat-value">{formatCurrency(summary.totalPurchases)}</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-section">
                <h2>Recent Sales</h2>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Customer</th>
                                <th>Item</th>
                                <th>Quantity</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentSales.map(sale => (
                                <tr key={sale.id}>
                                    <td>{sale.id}</td>
                                    <td>{sale.customerId}</td>
                                    <td>{sale.itemId}</td>
                                    <td>{sale.quantity}</td>
                                    <td>{formatCurrency(sale.quantity * sale.unitPrice)}</td>
                                    <td><span className="status">{sale.paymentStatus}</span></td>
                                    <td>{formatDate(sale.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="dashboard-section">
                <h2>Recent Purchases</h2>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Supplier</th>
                                <th>Item</th>
                                <th>Quantity</th>
                                <th>Total</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentPurchases.map(purchase => (
                                <tr key={purchase.id}>
                                    <td>{purchase.id}</td>
                                    <td>{purchase.supplierId}</td>
                                    <td>{purchase.itemId}</td>
                                    <td>{purchase.quantity}</td>
                                    <td>{formatCurrency(purchase.quantity * purchase.unitPrice)}</td>
                                    <td>{formatDate(purchase.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
