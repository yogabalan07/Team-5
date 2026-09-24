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
  LocalShipping,
  ReceiptLong,
  FileDownload,
  AccountBalanceWallet,
  Category as GroupIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { supplierService } from '../../services/supplierService';
import { supplierGroupService } from '../../services/supplierGroupService';
import PartyStatementDialog from '../common/PartyStatementDialog';
import ConfirmDialog from '../common/ConfirmDialog';

const SupplierList = () => {
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
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

  const [statementDialog, setStatementDialog] = useState({ open: false, supplier: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, supplier: null });

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [page, rowsPerPage, search, groupFilter]);

  const fetchGroups = async () => {
    try {
      const data = await supplierGroupService.getAll();
      setGroups(data || []);
    } catch (e) {
      console.error('Failed to load supplier groups:', e);
    }
  };

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const [statsData, pagedData] = await Promise.all([
        supplierService.getStats().catch(() => ({ total: 0, active: 0, totalBalance: 0, partiesWithDue: 0 })),
        supplierService.getAll(0, 500, search),
      ]);
      setStats(statsData);

      let content = pagedData.content || [];
      if (groupFilter !== 'ALL') {
        content = content.filter((s) => s.groupId === groupFilter || s.groupName === groupFilter);
      }

      setTotalElements(content.length);
      const start = page * rowsPerPage;
      setSuppliers(content.slice(start, start + rowsPerPage));
    } catch (err) {
      console.error('Fetch suppliers error:', err);
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await supplierService.exportToExcel({ search });
      toast.success('Supplier list exported');
    } catch (e) {
      toast.error('Export failed');
    }
  };

  const handleDeleteClick = (supplier) => {
    setDeleteDialog({ open: true, supplier });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.supplier) return;
    try {
      await supplierService.delete(deleteDialog.supplier.id);
      toast.success(`Supplier "${deleteDialog.supplier.name}" removed`);
      fetchSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete supplier');
    } finally {
      setDeleteDialog({ open: false, supplier: null });
    }
  };

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amt || 0);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <LocalShipping sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Supplier / Vendor Accounts
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage vendor records, payment terms, outstanding payables, and account statements
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button variant="outlined" startIcon={<GroupIcon />} onClick={() => navigate('/suppliers/groups')}>
            Manage Groups
          </Button>
          <Button variant="outlined" startIcon={<FileDownload />} onClick={handleExport}>
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/suppliers/new')}
            sx={{ borderRadius: 2 }}
          >
            Add Supplier
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: '#e8f5e9', borderLeft: '4px solid #2e7d32' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="textSecondary" fontWeight="600">TOTAL VENDORS</Typography>
              <Typography variant="h5" fontWeight="bold" color="success.main">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: '#e3f2fd', borderLeft: '4px solid #1976d2' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="textSecondary" fontWeight="600">ACTIVE VENDORS</Typography>
              <Typography variant="h5" fontWeight="bold" color="primary.main">{stats.active}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: '#fff3e0', borderLeft: '4px solid #ed6c02' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="textSecondary" fontWeight="600">OUTSTANDING PAYABLES</Typography>
              <Typography variant="h6" fontWeight="bold" color="warning.main">{formatCurrency(stats.totalBalance)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: '#fce4ec', borderLeft: '4px solid #c2185b' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="textSecondary" fontWeight="600">VENDORS WITH PAYABLES</Typography>
              <Typography variant="h5" fontWeight="bold" sx={{ color: '#c2185b' }}>{stats.partiesWithDue}</Typography>
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
              placeholder="Search by Supplier Name, Contact Person, Phone, City, GSTIN, or Group..."
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
              <InputLabel>Supplier Group</InputLabel>
              <Select
                value={groupFilter}
                onChange={(e) => {
                  setGroupFilter(e.target.value);
                  setPage(0);
                }}
                label="Supplier Group"
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
              <TableCell><strong>Supplier / Vendor Name</strong></TableCell>
              <TableCell><strong>Contact / Phone</strong></TableCell>
              <TableCell><strong>Group / City</strong></TableCell>
              <TableCell><strong>GSTIN / PAN</strong></TableCell>
              <TableCell align="center"><strong>Terms</strong></TableCell>
              <TableCell align="right"><strong>Payable Due (₹)</strong></TableCell>
              <TableCell align="center"><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {suppliers.length > 0 ? (
              suppliers.map((s) => {
                const due = Number(s.creditBalance) || 0;
                const hasDue = due > 0;
                return (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="700">
                        {s.name}
                      </Typography>
                      {s.city && (
                        <Typography variant="caption" color="textSecondary" display="block">
                          {s.city}{s.state ? `, ${s.state}` : ''}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{s.phone || '-'}</Typography>
                      {s.contactPerson && (
                        <Typography variant="caption" color="textSecondary" display="block">
                          Attn: {s.contactPerson}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={s.groupName || 'Domestic'} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" fontFamily="monospace">
                        {s.gstNo || 'Unregistered'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {s.creditDays ? `${s.creditDays}d` : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight="700"
                        color={hasDue ? 'warning.main' : 'text.primary'}
                      >
                        {formatCurrency(due)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={s.isActive !== false ? 'Active' : 'Inactive'}
                        size="small"
                        color={s.isActive !== false ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Account Statement & Ledger">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => setStatementDialog({ open: true, supplier: s })}
                        >
                          <ReceiptLong fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Supplier">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/suppliers/edit/${s.id}`)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Supplier">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(s)}
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
                    {loading ? 'Loading vendor accounts...' : 'No suppliers found'}
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
        onClose={() => setStatementDialog({ open: false, supplier: null })}
        party={statementDialog.supplier}
        service={supplierService}
        isCustomer={false}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, supplier: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Supplier"
        message={`Are you sure you want to delete supplier "${deleteDialog.supplier?.name}"?`}
      />
    </Box>
  );
};

export default SupplierList;