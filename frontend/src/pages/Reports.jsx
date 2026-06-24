import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Bar, Line, Pie } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import api from '../services/api';
import reportService from '../services/reportService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/helpers';

const Reports = () => {
    const [reportType, setReportType] = useState('sales');
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState(null);
    const [reportData, setReportData] = useState([]);

    useEffect(() => {
        loadReport();
    }, [reportType]);

    const loadReport = async () => {
        try {
            setLoading(true);
            const data = await reportService[reportType === 'sales' ? 'getSalesReport' : reportType === 'purchases' ? 'getPurchaseReport' : 'getStockReport']({
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                endDate: new Date()
            });

            setReportData(data);

            // Process data for chart
            if (Array.isArray(data)) {
                const groupedData = {};
                data.forEach(item => {
                    const date = formatDate(item.createdAt);
                    groupedData[date] = (groupedData[date] || 0) + (item.quantity * item.unitPrice);
                });

                const labels = Object.keys(groupedData);
                const values = Object.values(groupedData);

                setChartData({
                    labels,
                    datasets: [{
                        label: reportType.charAt(0).toUpperCase() + reportType.slice(1),
                        data: values,
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                });
            }
        } catch (error) {
            toast.error('Failed to load report');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                display: true,
                position: 'top'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value) => formatCurrency(value)
                }
            }
        }
    };

    return (
        <div className="page-container">
            <h1 className="page-title">Reports</h1>

            <div className="report-controls">
                <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="form-control">
                    <option value="sales">Sales Report</option>
                    <option value="purchases">Purchases Report</option>
                    <option value="stock">Stock Report</option>
                </select>
            </div>

            {chartData && (
                <div className="chart-container">
                    <h2>{reportType.charAt(0).toUpperCase() + reportType.slice(1)} Chart</h2>
                    <div style={{ position: 'relative', height: '400px' }}>
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </div>
            )}

            <div className="table-container">
                <h2>Detailed {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Data</h2>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>{reportType === 'sales' ? 'Customer' : reportType === 'purchases' ? 'Supplier' : 'Item'}</th>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((item, idx) => (
                            <tr key={idx}>
                                <td>{item.id}</td>
                                <td>{reportType === 'sales' ? item.customerId : reportType === 'purchases' ? item.supplierId : item.name}</td>
                                <td>{item.itemId || item.name}</td>
                                <td>{item.quantity}</td>
                                <td>{formatCurrency(item.unitPrice)}</td>
                                <td>{formatCurrency(item.quantity * item.unitPrice)}</td>
                                <td>{formatDate(item.createdAt)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Reports;
