// src/components/inventory/StockLedger.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  TextField,
  InputAdornment,
  LinearProgress,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  SwapVert,
  Search,
  ArrowDownward,
  ArrowUpward,
  Download,
  Inventory,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import inventoryService from '../../services/inventoryService';

const TYPE_COLORS = {
  SALES: 'error',
  PURCHASE: 'success',
  SALES_RETURN: 'info',
  PURCHASE_RETURN: 'warning',
  RETURN_IN: 'info',
  RETURN_OUT: 'warning',
  ADJUSTMENT: 'primary',
  STOCK_IN: 'success',
  STOCK_OUT: 'error',
  WAREHOUSE_TRANSFER: 'secondary',
};

const StockLedger = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
    itemId: searchParams.get('itemId') || '',
  });

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getLedger(page, rowsPerPage, search, filters);
      setRows(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      toast.error('Failed to load stock ledger');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, filters]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await inventoryService.exportLedgerCsv({ ...filters, search });
      toast.success('Stock ledger exported');
    } catch (e) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setFilters({ type: '', startDate: '', endDate: '', itemId: '' });
    setSearch('');
    setPage(0);
    setSearchParams({});
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <SwapVert sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Stock Ledger
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Every stock-changing event with before/after quantities, references and actor
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={() => navigate('/inventory')} startIcon={<Inventory />}>
            Current Stock
          </Button>
          <Button variant="outlined" onClick={handleExport} disabled={exporting} startIcon={<Download />}>
            Export CSV
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search item, reference, actor..."
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
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Transaction Type</InputLabel>
              <Select
                value={filters.type}
                onChange={(e) => {
                  setFilters({ ...filters, type: e.target.value });
                  setPage(0);
                }}
                label="Transaction Type"
              >
                <MenuItem value="">All Types</MenuItem>
                {Object.keys(TYPE_COLORS).map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="From"
              value={filters.startDate}
              onChange={(e) => {
                setFilters({ ...filters, startDate: e.target.value });
                setPage(0);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="To"
              value={filters.endDate}
              onChange={(e) => {
                setFilters({ ...filters, endDate: e.target.value });
                setPage(0);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Button variant="outlined" onClick={clearFilters} fullWidth>
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Timestamp</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Item</strong></TableCell>
              <TableCell align="right"><strong>Qty</strong></TableCell>
              <TableCell align="right"><strong>Before</strong></TableCell>
              <TableCell align="right"><strong>After</strong></TableCell>
              <TableCell><strong>Reference</strong></TableCell>
              <TableCell><strong>Reason / Actor</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="caption" display="block">
                      {row.createdAt ? new Date(row.createdAt).toLocaleString('en-IN') : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={row.type} color={TYPE_COLORS[row.type] || 'default'} size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="600">{row.itemName}</Typography>
                    <Typography variant="caption" color="textSecondary">{row.itemCode}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      fontWeight="700"
                      color={(Number(row.stockAfter) || 0) >= (Number(row.stockBefore) || 0) ? 'success.main' : 'error.main'}
                      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}
                    >
                      {(Number(row.stockAfter) || 0) >= (Number(row.stockBefore) || 0) ? <ArrowUpward fontSize="inherit" /> : <ArrowDownward fontSize="inherit" />}
                      {Math.abs(Number(row.quantity) || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{row.stockBefore}</TableCell>
                  <TableCell align="right">
                    <strong>{row.stockAfter}</strong>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{row.referenceNumber || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" display="block" color={row.reason ? 'text.primary' : 'text.secondary'}>
                      {row.reason || '-'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {row.createdBy}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">
                    {loading ? 'Loading ledger...' : 'No stock movements found'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[20, 50, 100]}
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

export default StockLedger;
