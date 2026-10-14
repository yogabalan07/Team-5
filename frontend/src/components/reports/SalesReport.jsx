import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Alert,
  Autocomplete,
} from '@mui/material';
import {
  Search,
  Download,
  Print,
  BarChart,
  Refresh,
  PictureAsPdf,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { reportService } from '../../services/reportService';
import { customerService } from '../../services/customerService';

const SalesReport = () => {
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await customerService.getAll(0, 1000);
      setCustomers(response.content || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const fetchReport = async () => {
    if (!filters.startDate || !filters.endDate) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const requestData = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        customerIds: selectedCustomers.length > 0 ? selectedCustomers.map(c => c.id) : null,
      };
      const response = await reportService.getSalesReport(requestData);
      setData(response.content || []);
      setSummary(response.summary || null);
      toast.success('Report loaded successfully');
    } catch (error) {
      setError('Failed to load report');
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const requestData = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        customerIds: selectedCustomers.length > 0 ? selectedCustomers.map(c => c.id) : null,
      };
      await reportService.exportSalesReport(requestData);
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const handleExportPDF = async () => {
    try {
      const requestData = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        customerIds: selectedCustomers.length > 0 ? selectedCustomers.map(c => c.id) : null,
      };
      await reportService.exportSalesReportPDF(requestData);
      toast.success('PDF exported successfully');
    } catch (error) {
      toast.error('Failed to export PDF');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusChip = (status) => {
    const colors = {
      'PAID': 'success',
      'PENDING': 'warning',
      'OVERDUE': 'error',
      'PARTIAL': 'info',
    };
    return <Chip label={status || 'PENDING'} color={colors[status] || 'default'} size="small" />;
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <BarChart sx={{ fontSize: 40, color: '#1976d2' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Sales Report
          </Typography>
          <Typography variant="body2" color="textSecondary">
            View and analyze sales data with customer filtering
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Autocomplete
              multiple
              options={customers}
              getOptionLabel={(option) => `${option.name} (${option.code || option.id})`}
              value={selectedCustomers}
              onChange={(event, newValue) => setSelectedCustomers(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Customers (Optional)"
                  placeholder="Search customers..."
                  size="medium"
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Search />}
              onClick={fetchReport}
              disabled={loading}
              sx={{ height: 56 }}
            >
              {loading ? 'Loading...' : 'Generate'}
            </Button>
          </Grid>
          <Grid item xs={12} md={2}>
            <Box display="flex" gap={1}>
              <Button variant="outlined" startIcon={<Refresh />} onClick={fetchReport}>
                Refresh
              </Button>
            </Box>
          </Grid>
        </Grid>

        <Box display="flex" gap={1} mt={2} flexWrap="wrap">
          <Button variant="outlined" startIcon={<Download />} onClick={handleExportExcel}>
            Excel
          </Button>
          <Button variant="outlined" startIcon={<PictureAsPdf />} onClick={handleExportPDF}>
            PDF
          </Button>
          <Button variant="outlined" startIcon={<Print />} onClick={handlePrint}>
            Print
          </Button>
        </Box>
      </Paper>

      {summary && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  Total Sales
                </Typography>
                <Typography variant="h5" color="primary">
                  ₹{summary.totalSales?.toFixed(2) || '0.00'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  Total Invoices
                </Typography>
                <Typography variant="h5">{summary.totalInvoices || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  Total Customers
                </Typography>
                <Typography variant="h5">{summary.totalCustomers || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  Average Invoice Value
                </Typography>
                <Typography variant="h5">
                  ₹{summary.averageInvoice?.toFixed(2) || '0.00'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {loading ? (
        <Box sx={{ width: '100%', py: 4 }}>
          <LinearProgress />
          <Typography textAlign="center" sx={{ mt: 2 }} color="textSecondary">
            Loading report data...
          </Typography>
        </Box>
      ) : data.length > 0 ? (
        <Paper sx={{ p: 2, borderRadius: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                  <TableCell>Invoice No</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Discount</TableCell>
                  <TableCell align="right">Tax</TableCell>
                  <TableCell align="right">Net Amount</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {row.invoiceNo}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.invoiceDate}</TableCell>
                    <TableCell>{row.customerName}</TableCell>
                    <TableCell align="right">₹{row.totalAmount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell align="right">₹{row.discountAmount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell align="right">₹{row.taxAmount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold" color="primary">
                        ₹{row.netAmount?.toFixed(2) || '0.00'}
                      </Typography>
                    </TableCell>
                    <TableCell>{getStatusChip(row.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography color="textSecondary">
            {filters.startDate && filters.endDate
              ? 'No data found for the selected period'
              : 'Select date range and generate report'}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default SalesReport;