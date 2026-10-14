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
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  People,
  ReceiptLong,
  FileDownload,
  AccountBalanceWallet,
  Warning,
  Category as GroupIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { customerService } from '../../services/customerService';
import { customerGroupService } from '../../services/customerGroupService';
import PartyStatementDialog from '../common/PartyStatementDialog';
import ConfirmDialog from '../common/ConfirmDialog';

const CustomerList = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const [groups, setGroups] = useState([]);
  const [groupFilter, setGroupFilter] = useState('ALL');

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalBalance: 0,
    partiesWithDue: 0,
  });

  const [statementDialog, setStatementDialog] = useState({ open: false, customer: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, customer: null });

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [page, rowsPerPage, search, groupFilter]);

  const fetchGroups = async () => {
    try {
      const data = await customerGroupService.getAll();
      setGroups(data || []);
    } catch (e) {
      console.error('Failed to load groups:', e);
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const [statsData, pagedData] = await Promise.all([
        customerService.getStats().catch(() => ({ total: 0, active: 0, totalBalance: 0, partiesWithDue: 0 })),
        customerService.getAll(0, 500, search),
      ]);
      setStats(statsData);

      let content = pagedData.content || [];
      if (groupFilter !== 'ALL') {
        content = content.filter((c) => c.groupId === groupFilter || c.groupName === groupFilter);
      }

      setTotalElements(content.length);
      const start = page * rowsPerPage;
      setCustomers(content.slice(start, start + rowsPerPage));
    } catch (err) {
      console.error('Fetch customers error:', err);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await customerService.exportToExcel({ search });
      toast.success('Customer list exported');
    } catch (e) {
      toast.error('Export failed');
    }
  };

  const handleDeleteClick = (customer) => {
    setDeleteDialog({ open: true, customer });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.customer) return;
    try {
      await customerService.delete(deleteDialog.customer.id);
      toast.success(`Customer "${deleteDialog.customer.name}" removed`);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete customer');
    } finally {
      setDeleteDialog({ open: false, customer: null });
    }
  };

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amt || 0);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <People sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Customer Accounts & Receivables
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage client directory, credit limits, outstanding balances, and statements
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button variant="outlined" startIcon={<GroupIcon />} onClick={() => navigate('/customers/groups')}>
            Manage Groups
          </Button>
          <Button variant="outlined" startIcon={<FileDownload />} onClick={handleExport}>
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/customers/new')}
            sx={{ borderRadius: 2 }}
          >
            Add Customer
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: '#e3f2fd', borderLeft: '4px solid #1976d2' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="textSecondary" fontWeight="600">TOTAL CLIENTS</Typography>
              <Typography variant="h5" fontWeight="bold" color="primary.main">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: '#e8f5e9', borderLeft: '4px solid #2e7d32' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="textSecondary" fontWeight="600">ACTIVE ACCOUNTS</Typography>
              <Typography variant="h5" fontWeight="bold" color="success.main">{stats.active}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: '#ffebee', borderLeft: '4px solid #d32f2f' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="textSecondary" fontWeight="600">OUTSTANDING RECEIVABLES</Typography>
              <Typography variant="h6" fontWeight="bold" color="error.main">{formatCurrency(stats.totalBalance)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: '#fff3e0', borderLeft: '4px solid #ed6c02' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="textSecondary" fontWeight="600">CLIENTS WITH DUE</Typography>
              <Typography variant="h5" fontWeight="bold" color="warning.main">{stats.partiesWithDue}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search & Filter */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by Customer Name, Phone, Contact Person, City, GSTIN, or Territory..."
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
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Customer Group</InputLabel>
              <Select
                value={groupFilter}
                onChange={(e) => {
                  setGroupFilter(e.target.value);
                  setPage(0);
                }}
                label="Customer Group"
              >
                <MenuItem value="ALL">All Groups</MenuItem>
                {groups.map((g) => (
                  <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Customer Name</strong></TableCell>
              <TableCell><strong>Contact / Phone</strong></TableCell>
              <TableCell><strong>Group / Territory</strong></TableCell>
              <TableCell><strong>GSTIN / PAN</strong></TableCell>
              <TableCell align="right"><strong>Credit Limit (₹)</strong></TableCell>
              <TableCell align="right"><strong>Receivable Due (₹)</strong></TableCell>
              <TableCell align="center"><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.length > 0 ? (
              customers.map((c) => {
                const due = Number(c.creditBalance) || 0;
                const hasDue = due > 0;
                return (
                  <TableRow key={c.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="700">
                        {c.name}
                      </Typography>
                      {c.city && (
                        <Typography variant="caption" color="textSecondary" display="block">
                          {c.city}{c.state ? `, ${c.state}` : ''}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{c.phone || '-'}</Typography>
                      {c.contactPerson && (
                        <Typography variant="caption" color="textSecondary" display="block">
                          Attn: {c.contactPerson}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={c.groupName || 'General'} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" fontFamily="monospace">
                        {c.gstNo || 'Unregistered'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {c.creditLimit ? formatCurrency(c.creditLimit) : '-'}
                      </Typography>
                      {c.creditDays ? (
                        <Typography variant="caption" color="textSecondary" display="block">
                          {c.creditDays}d terms
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight="700"
                        color={hasDue ? 'error.main' : 'success.main'}
                      >
                        {formatCurrency(due)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={c.isActive !== false ? 'Active' : 'Inactive'}
                        size="small"
                        color={c.isActive !== false ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Account Statement & Ledger">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => setStatementDialog({ open: true, customer: c })}
                        >
                          <ReceiptLong fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Customer">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/customers/edit/${c.id}`)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Customer">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(c)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">
                    {loading ? 'Loading customer accounts...' : 'No customers found'}
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

      {/* Account Statement Dialog */}
      <PartyStatementDialog
        open={statementDialog.open}
        onClose={() => setStatementDialog({ open: false, customer: null })}
        party={statementDialog.customer}
        service={customerService}
        isCustomer={true}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, customer: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Customer"
        message={`Are you sure you want to delete customer "${deleteDialog.customer?.name}"?`}
      />
    </Box>
  );
};

export default CustomerList;