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
  Alert,
  LinearProgress,
  Autocomplete,
} from '@mui/material';
import {
  Search,
  Download,
  Print,
  ShoppingCart,
  Refresh,
  PictureAsPdf,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { reportService } from '../../services/reportService';
import { supplierService } from '../../services/supplierService';

const PurchaseReport = () => {
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    dateType: 'INVOICE_DATE',
  });
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await supplierService.getAll(0, 1000);
      setSuppliers(response.content || []);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
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
        dateType: filters.dateType,
        supplierIds: selectedSuppliers.length > 0 ? selectedSuppliers.map(s => s.id) : null,
      };
      const response = await reportService.getPurchaseReport(requestData);
      setData(response.content || []);
      setSummary(response.summary || null);
      toast.success('Report loaded successfully');
    } catch (error) {
      console.error('Error fetching report:', error);
      setError('Failed to load report');
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const requestData = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        dateType: filters.dateType,
        supplierIds: selectedSuppliers.length > 0 ? selectedSuppliers.map(s => s.id) : null,
      };
      
      console.log('📤 Exporting purchase report with data:', requestData);
      
      await reportService.exportPurchaseReport(requestData);
      toast.success('Purchase report exported successfully');
    } catch (error) {
      console.error('Error exporting purchase report:', error);
      toast.error(error.message || 'Failed to export purchase report');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const requestData = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        dateType: filters.dateType,
        supplierIds: selectedSuppliers.length > 0 ? selectedSuppliers.map(s => s.id) : null,
      };
      
      await reportService.exportPurchaseReportPDF(requestData);
      toast.success('Purchase report exported as PDF successfully');
    } catch (error) {
      console.error('Error exporting purchase report PDF:', error);
      toast.error(error.message || 'Failed to export purchase report as PDF');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <ShoppingCart sx={{ fontSize: 40, color: '#1976d2' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">Purchase Report</Typography>
          <Typography variant="body2" color="textSecondary">View and analyze purchase data</Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              options={suppliers}
              getOptionLabel={(option) => `${option.name} (${option.code || option.id})`}
              value={selectedSuppliers}
              onChange={(event, newValue) => setSelectedSuppliers(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Suppliers (Optional)" placeholder="Search suppliers..." />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button 
                variant="contained" 
                startIcon={<Search />} 
                onClick={fetchReport} 
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Generate'}
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<Refresh />} 
                onClick={fetchReport}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<Download />} 
                onClick={handleExportExcel}
                disabled={exporting || loading}
              >
                {exporting ? 'Exporting...' : 'Excel'}
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<PictureAsPdf />} 
                onClick={handleExportPDF}
                disabled={exporting || loading}
              >
                {exporting ? 'Exporting...' : 'PDF'}
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<Print />} 
                onClick={handlePrint}
              >
                Print
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {summary && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="textSecondary">Total Purchases</Typography>
                <Typography variant="h5" color="primary">₹{summary.totalPurchases?.toFixed(2) || '0.00'}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="textSecondary">Total Invoices</Typography>
                <Typography variant="h5">{summary.totalInvoices || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="textSecondary">Total Suppliers</Typography>
                <Typography variant="h5">{summary.totalSuppliers || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="textSecondary">Average Invoice</Typography>
                <Typography variant="h5">₹{summary.averageInvoice?.toFixed(2) || '0.00'}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {loading ? (
        <Box sx={{ width: '100%', py: 4 }}>
          <LinearProgress />
          <Typography textAlign="center" sx={{ mt: 2 }} color="textSecondary">
            Loading purchase report...
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
                  <TableCell>Supplier</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Discount</TableCell>
                  <TableCell align="right">Tax</TableCell>
                  <TableCell align="right">Net Amount</TableCell>
                  <TableCell>Payment</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{row.invoiceNo}</TableCell>
                    <TableCell>{row.invoiceDate}</TableCell>
                    <TableCell>{row.supplierName}</TableCell>
                    <TableCell align="right">₹{row.totalAmount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell align="right">₹{row.discountAmount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell align="right">₹{row.taxAmount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold" color="primary">
                        ₹{row.netAmount?.toFixed(2) || '0.00'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.paymentType}
                        color={row.paymentType === 'CASH' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
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
              ? 'No purchase data found for the selected period'
              : 'Select date range and generate report'}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default PurchaseReport;