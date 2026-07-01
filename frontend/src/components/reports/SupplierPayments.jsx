import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Search,
  Payment,
  Download,
  Print,
  Refresh,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { reportService } from '../../services/reportService';

const SupplierPayments = () => {
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);

  const fetchReport = async () => {
    if (!filters.startDate || !filters.endDate) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await reportService.getSupplierPayments(filters);
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

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Payment sx={{ fontSize: 40, color: '#1976d2' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Supplier Payments
          </Typography>
          <Typography variant="body2" color="textSecondary">
            View all supplier payment records
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
          <Grid item xs={12} md={4}>
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
          <Grid item xs={12} md={4}>
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
        </Grid>
      </Paper>

      {summary && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  Total Payments
                </Typography>
                <Typography variant="h5">{summary.totalPayments}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  Total Amount
                </Typography>
                <Typography variant="h5" color="primary">
                  ₹{summary.totalAmount?.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  Average Payment
                </Typography>
                <Typography variant="h5">
                  ₹{summary.averageAmount?.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {loading ? (
        <Box sx={{ width: '100%', py: 4 }}>
          <LinearProgress />
        </Box>
      ) : data.length > 0 ? (
        <Paper sx={{ p: 2, borderRadius: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                  <TableCell>Payment No</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Invoice No</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Payment Mode</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{row.paymentNo}</TableCell>
                    <TableCell>{row.paymentDate}</TableCell>
                    <TableCell>{row.supplierName}</TableCell>
                    <TableCell>{row.invoiceNo}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold" color="primary">
                        ₹{row.amount?.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.paymentMode}
                        color={row.paymentMode === 'CASH' ? 'success' : 'info'}
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
            No payments found for the selected period
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default SupplierPayments;