// src/components/purchases/PurchaseRequisitionList.jsx
import React, { useState, useEffect, useCallback } from 'react';
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
  TextField,
  InputAdornment,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Search,
  Assignment,
  Send,
  CheckCircle,
  Cancel,
  Sync,
  Close,
  Save,
  Delete,
  Edit,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import purchaseWorkflowService from '../../services/purchaseWorkflowService';
import { supplierService } from '../../services/supplierService';
import { itemService } from '../../services/itemService';
import { todayISO, round2, invoiceTotals } from '../../services/businessLogic';

const STATUS_COLORS = {
  DRAFT: 'default',
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  CONVERTED: 'info',
};

const emptyForm = () => ({
  requisitionDate: todayISO(),
  requiredBy: '',
  department: '',
  priority: 'NORMAL',
  supplierId: '',
  supplierName: '',
  notes: '',
  items: [{ itemId: '', itemName: '', itemCode: '', quantity: 1, unitPrice: 0, totalAmount: 0 }],
});

const PurchaseRequisitionList = () => {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [busyId, setBusyId] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState('');
  const [form, setForm] = useState(emptyForm());
  const [suppliers, setSuppliers] = useState([]);
  const [catalogItems, setCatalogItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await purchaseWorkflowService.getRequisitions(page, rowsPerPage, search);
      setRows(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      toast.error('Failed to load purchase requisitions');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const loadMasters = async () => {
    try {
      const [sups, prods] = await Promise.all([
        supplierService.getAll(0, 500).catch(() => ({ content: [] })),
        itemService.getAll(0, 1000).catch(() => ({ content: [] })),
      ]);
      setSuppliers((sups && sups.content) || []);
      setCatalogItems((prods && prods.content) || []);
    } catch (e) {
      console.error('Failed to load masters', e);
    }
  };

  const openCreate = () => {
    setEditId('');
    setForm(emptyForm());
    setError('');
    setDialogOpen(true);
    loadMasters();
  };

  const openEdit = async (row) => {
    setError('');
    setEditId(row.id);
    setForm({
      requisitionDate: row.requisitionDate || todayISO(),
      requiredBy: row.requiredBy || '',
      department: row.department || '',
      priority: row.priority || 'NORMAL',
      supplierId: row.supplierId || '',
      supplierName: row.supplierName || '',
      notes: row.notes || '',
      items: (row.items || []).map((l) => ({
        itemId: l.itemId || '',
        itemName: l.itemName || '',
        itemCode: l.itemCode || '',
        quantity: l.quantity || 1,
        unitPrice: l.unitPrice || 0,
        totalAmount: l.totalAmount || 0,
      })),
    });
    setDialogOpen(true);
    loadMasters();
  };

  const handleItemChange = (index, field, value) => {
    const next = form.items.map((l) => ({ ...l }));
    next[index][field] = value;
    if (field === 'itemId') {
      const selected = catalogItems.find((p) => p.id === value);
      if (selected) {
        next[index].itemName = selected.name;
        next[index].itemCode = selected.itemCode || selected.sku || '';
        next[index].unitPrice = selected.purchasePrice || selected.sellingPrice || 0;
      }
    }
    next[index].totalAmount = round2((Number(next[index].quantity) || 0) * (Number(next[index].unitPrice) || 0));
    setForm({ ...form, items: next });
  };

  const addItemRow = () => {
    setForm({
      ...form,
      items: [...form.items, { itemId: '', itemName: '', itemCode: '', quantity: 1, unitPrice: 0, totalAmount: 0 }],
    });
  };

  const removeItemRow = (index) => {
    if (form.items.length <= 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const handleSubmit = async () => {
    setError('');
    const validLines = form.items.filter((i) => i.itemName && Number(i.quantity) > 0);
    if (!validLines.length) {
      setError('Add at least one valid item line');
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await purchaseWorkflowService.updateRequisition(editId, { ...form, items: validLines });
        toast.success('Requisition updated');
      } else {
        const res = await purchaseWorkflowService.createRequisition({ ...form, items: validLines });
        toast.success(`Requisition ${res.requisitionNumber} created`);
      }
      setDialogOpen(false);
      setPage(0);
      fetchRows();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save requisition');
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (row, action, fn) => {
    setBusyId(row.id);
    try {
      const res = await fn();
      toast.success(`${row.requisitionNumber}: ${action} successful`);
      if (res && res.poId) navigate('/purchases/orders');
      fetchRows();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || `${action} failed`);
    } finally {
      setBusyId(null);
    }
  };

  const totals = invoiceTotals(form.items);
  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amt || 0);

  const renderActions = (row) => {
    const busy = busyId === row.id;
    const editable = ['DRAFT', 'REJECTED'].includes(row.status);
    return (
      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
        {row.status === 'DRAFT' && (
          <Tooltip title="Submit for approval">
            <IconButton size="small" color="info" disabled={busy} onClick={() => runAction(row, 'submitted', () => purchaseWorkflowService.submitRequisition(row.id))}>
              <Send fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {row.status === 'PENDING' && (
          <>
            <Tooltip title="Approve">
              <IconButton size="small" color="success" disabled={busy} onClick={() => runAction(row, 'approved', () => purchaseWorkflowService.approveRequisition(row.id))}>
                <CheckCircle fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reject">
              <IconButton size="small" color="error" disabled={busy} onClick={() => runAction(row, 'rejected', () => purchaseWorkflowService.rejectRequisition(row.id, 'Rejected from list'))}>
                <Cancel fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
        {row.status === 'APPROVED' && (
          <Tooltip title="Convert to Purchase Order">
            <IconButton size="small" color="primary" disabled={busy} onClick={() => runAction(row, 'converted to purchase order', () => purchaseWorkflowService.convertRequisitionToOrder(row.id))}>
              <Sync fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {editable && (
          <Tooltip title="Edit">
            <IconButton size="small" color="primary" disabled={busy} onClick={() => openEdit(row)}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {row.status === 'DRAFT' && (
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              disabled={busy}
              onClick={() => runAction(row, 'deleted', () => purchaseWorkflowService.deleteRequisition(row.id))}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <Assignment sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Purchase Requisitions
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Raise internal purchase requests, route them for approval, and convert approved requests to purchase orders
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ borderRadius: 2 }}>
          New Requisition
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by requisition number, department, requester..."
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
              <TableCell><strong>Requisition #</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Department</strong></TableCell>
              <TableCell><strong>Priority</strong></TableCell>
              <TableCell align="right"><strong>Lines</strong></TableCell>
              <TableCell align="right"><strong>Est. Value (₹)</strong></TableCell>
              <TableCell align="center"><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="700" color="primary.main">
                      {row.requisitionNumber}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      by {row.requestedBy || row.createdBy}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.requisitionDate}</TableCell>
                  <TableCell>{row.department || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.priority || 'NORMAL'}
                      size="small"
                      color={row.priority === 'URGENT' ? 'error' : row.priority === 'HIGH' ? 'warning' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">{(row.items || []).length}</TableCell>
                  <TableCell align="right"><strong>{formatCurrency(row.grandTotal)}</strong></TableCell>
                  <TableCell align="center">
                    <Chip label={row.status || 'DRAFT'} color={STATUS_COLORS[row.status] || 'default'} size="small" />
                  </TableCell>
                  <TableCell align="center">{renderActions(row)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">
                    {loading ? 'Loading requisitions...' : 'No purchase requisitions found'}
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {editId ? 'Edit Purchase Requisition' : 'New Purchase Requisition'}
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Requisition Date"
                value={form.requisitionDate}
                onChange={(e) => setForm({ ...form, requisitionDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Required By"
                value={form.requiredBy}
                onChange={(e) => setForm({ ...form, requiredBy: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Department"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="e.g. Warehouse, Production"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  label="Priority"
                >
                  <MenuItem value="NORMAL">NORMAL</MenuItem>
                  <MenuItem value="HIGH">HIGH</MenuItem>
                  <MenuItem value="URGENT">URGENT</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={suppliers}
                getOptionLabel={(s) => `${s.name} (${s.phone || 'no phone'})`}
                value={suppliers.find((s) => s.id === form.supplierId) || null}
                onChange={(e, sup) =>
                  setForm({
                    ...form,
                    supplierId: sup ? sup.id : '',
                    supplierName: sup ? sup.name : '',
                  })
                }
                renderInput={(params) => <TextField {...params} label="Preferred Supplier (optional)" />}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Notes / Justification"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Grid>
          </Grid>

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle1" fontWeight="bold">
              Requested Items
            </Typography>
            <Button variant="outlined" size="small" onClick={addItemRow}>
              Add Line
            </Button>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell width="40%"><strong>Item</strong></TableCell>
                  <TableCell width="12%"><strong>Qty</strong></TableCell>
                  <TableCell width="15%"><strong>Est. Unit Price</strong></TableCell>
                  <TableCell width="15%" align="right"><strong>Total</strong></TableCell>
                  <TableCell width="8%" align="center"><strong>Del</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {form.items.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <FormControl fullWidth size="small">
                        <Select
                          value={row.itemId}
                          onChange={(e) => handleItemChange(idx, 'itemId', e.target.value)}
                          displayEmpty
                        >
                          <MenuItem value=""><em>Select item...</em></MenuItem>
                          {catalogItems.map((p) => (
                            <MenuItem key={p.id} value={p.id}>
                              {p.name} ({p.itemCode || p.sku})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        inputProps={{ min: 1 }}
                        value={row.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        inputProps={{ min: 0, step: '0.01' }}
                        value={row.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                      />
                    </TableCell>
                    <TableCell align="right">{formatCurrency(row.totalAmount)}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="error" onClick={() => removeItemRow(idx)} disabled={form.items.length <= 1}>
                        <Close fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Typography variant="h6" fontWeight="bold">
              Estimated Total: {formatCurrency(totals.totalAmount)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} startIcon={<Close />} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
            disabled={saving}
          >
            {editId ? 'Update Requisition' : 'Create Requisition'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PurchaseRequisitionList;
