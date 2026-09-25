import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  LinearProgress,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  RequestQuote,
  ArrowForward,
  CheckCircle,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { salesService } from '../../services/salesService';

const SalesQuotationList = () => {
  const navigate = useNavigate();

  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    fetchQuotations();
  }, [page, rowsPerPage, search]);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const data = await salesService.getQuotations(page, rowsPerPage, search);
      setQuotations(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      toast.error('Failed to load sales quotations');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amt || 0);

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACCEPTED':
      case 'CONVERTED':
        return 'success';
      case 'SENT':
        return 'info';
      case 'REJECTED':
      case 'EXPIRED':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <RequestQuote sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Sales Quotations
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage client price estimates, proposals, and convert accepted quotes to confirmed Sales Orders
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/sales/quotations/new')}
          sx={{ borderRadius: 2 }}
        >
          New Quotation
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search quotations by Quote Number, Customer Name, Phone, or Salesperson..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Quote #</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Customer</strong></TableCell>
              <TableCell><strong>Valid Until</strong></TableCell>
              <TableCell><strong>Salesperson</strong></TableCell>
              <TableCell align="right"><strong>Quote Total (₹)</strong></TableCell>
              <TableCell align="center"><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {quotations.length > 0 ? (
              quotations.map((q) => (
                <TableRow key={q.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="700" color="primary.main">
                      {q.quotationNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>{q.quotationDate}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="600">{q.customerName}</Typography>
                    {q.customerPhone && <Typography variant="caption" color="textSecondary">{q.customerPhone}</Typography>}
                  </TableCell>
                  <TableCell>{q.validUntil || '-'}</TableCell>
                  <TableCell>{q.salespersonName || '-'}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="700">
                      {formatCurrency(q.grandTotal)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={q.status || 'DRAFT'} color={getStatusColor(q.status)} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Convert to Sales Order">
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        endIcon={<ArrowForward fontSize="small" />}
                        onClick={() => navigate(`/sales/orders/new?quotationId=${q.id}`)}
                        sx={{ mr: 1, textTransform: 'none' }}
                        disabled={q.status === 'CONVERTED'}
                      >
                        {q.status === 'CONVERTED' ? 'Converted' : 'To Order'}
                      </Button>
                    </Tooltip>
                    <Tooltip title="Edit Quotation">
                      <IconButton size="small" color="primary" onClick={() => navigate(`/sales/quotations/edit/${q.id}`)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">
                    {loading ? 'Loading quotations...' : 'No sales quotations found'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={totalElements}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>
    </Box>
  );
};

export default SalesQuotationList;
