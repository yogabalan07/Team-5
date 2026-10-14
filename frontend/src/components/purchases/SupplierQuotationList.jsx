// src/components/purchases/SupplierQuotationList.jsx
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
  RequestPage,
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
  SENT: 'info',
  ACCEPTED: 'success',
  REJECTED: 'error',
  CONVERTED: 'primary',
};

const emptyForm = () => ({
  quoteDate: todayISO(),
  validUntil: '',
  supplierId: '',
  supplierName: '',
  contactPerson: '',
  paymentTerms: '',
  freightCharges: 0,
  notes: '',
  items: [{ itemId: '', itemName: '', itemCode: '', quantity: 1, unitPrice: 0, totalAmount: 0 }],
});

const SupplierQuotationList = () => {
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
      const data = await purchaseWorkflowService.getSupplierQuotations(page, rowsPerPage, search);
      setRows(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      toast.error('Failed to load supplier quotations');
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
      quoteDate: row.quoteDate || todayISO(),
      validUntil: row.validUntil || '',
      supplierId: row.supplierId || '',
      supplierName: row.supplierName || '',
      contactPerson: row.contactPerson || '',
      paymentTerms: row.paymentTerms || '',
      freightCharges: row.freightCharges || 0,
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
    if (!form.supplierName) {
      setError('Supplier is required');
      return;
    }
    const validLines = form.items.filter((i) => i.itemName && Number(i.quantity) > 0);
    if (!validLines.length) {
      setError('Add at least one valid item line');
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await purchaseWorkflowService.updateSupplierQuotation(editId, { ...form, items: validLines });
        toast.success('Supplier quotation updated');
      } else {
        const res = await purchaseWorkflowService.createSupplierQuotation({ ...form, items: validLines });
        toast.success(`Supplier quotation ${res.quotationNumber} created`);
      }
      setDialogOpen(false);
      setPage(0);
      fetchRows();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save quotation');
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (row, action, fn) => {
    setBusyId(row.id);
    try {
      const res = await fn();
      toast.success(`${row.quotationNumber}: ${action}`);
      if (res && res.poId) navigate('/purchases/orders');
      fetchRows();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || `${action} failed`);
    } finally {
      setBusyId(null);
    }
  };

  const totals = invoiceTotals(form.items);
  const grandTotal = round2(totals.netAmount + (Number(form.freightCharges) || 0));
  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amt || 0);

  const renderActions = (row) => {
    const busy = busyId === row.id;
    const editable = row.status !== 'CONVERTED';
    return (
      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
        {row.status === 'DRAFT' && (
          <Tooltip title="Mark as Sent to Supplier">
            <IconButton size="small" color="info" disabled={busy} onClick={() => runAction(row, 'marked as sent', () => purchaseWorkflowService.setSupplierQuotationStatus(row.id, 'SENT'))}>
              <Send fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {['SENT', 'DRAFT'].includes(row.status) && (
          <Tooltip title="Accept Quote">
            <IconButton size="small" color="success" disabled={busy} onClick={() => runAction(row, 'accepted', () => purchaseWorkflowService.setSupplierQuotationStatus(row.id, 'ACCEPTED'))}>
              <CheckCircle fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {row.status !== 'CONVERTED' && row.status !== 'REJECTED' && (
          <Tooltip title="Reject Quote">
            <IconButton size="small" color="error" disabled={busy} onClick={() => runAction(row, 'rejected', () => purchaseWorkflowService.setSupplierQuotationStatus(row.id, 'REJECTED'))}>
              <Cancel fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {row.status === 'ACCEPTED' && (
          <Tooltip title="Convert to Purchase Order">
            <IconButton size="small" color="primary" disabled={busy} onClick={() => runAction(row, 'converted to purchase order', () => purchaseWorkflowService.convertSupplierQuotationToOrder(row.id))}>
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
        {editable && (
          <Tooltip title="Delete">
            <IconButton size="small" color="error" disabled={busy} onClick={() => runAction(row, 'deleted', () => purchaseWorkflowService.deleteSupplierQuotation(row.id))}>
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
          <RequestPage sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Supplier Quotations
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Track quotes received from suppliers and convert accepted quotes into purchase orders
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ borderRadius: 2 }}>
          New Supplier Quote
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by quote number, supplier..."
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
              <TableCell><strong>Supplier</strong></TableCell>
              <TableCell><strong>Valid Until</strong></TableCell>
              <TableCell align="right"><strong>Quote Value (₹)</strong></TableCell>
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
                      {row.quotationNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.quoteDate}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="600">{row.supplierName}</Typography>
                    <Typography variant="caption" color="textSecondary">{row.contactPerson}</Typography>
                  </TableCell>
                  <TableCell>{row.validUntil || '-'}</TableCell>
                  <TableCell align="right"><strong>{formatCurrency(row.grandTotal)}</strong></TableCell>
                  <TableCell align="center">
                    <Chip label={row.status || 'DRAFT'} color={STATUS_COLORS[row.status] || 'default'} size="small" />
                  </TableCell>
                  <TableCell align="center">{renderActions(row)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">
                    {loading ? 'Loading supplier quotations...' : 'No supplier quotations found'}
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
          {editId ? 'Edit Supplier Quotation' : 'New Supplier Quotation'}
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} mb={2}>
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
                    contactPerson: sup ? (sup.contactPerson || '') : form.contactPerson,
                  })
                }
                renderInput={(params) => <TextField {...params} label="Supplier" required />}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Quote Date"
                value={form.quoteDate}
                onChange={(e) => setForm({ ...form, quoteDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Valid Until"
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Contact Person"
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Payment Terms"
                value={form.paymentTerms}
                onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                placeholder="e.g. 30 Days Net"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Freight / Other Charges"
                value={form.freightCharges}
                onChange={(e) => setForm({ ...form, freightCharges: e.target.value })}
                inputProps={{ min: 0, step: '0.01' }}
              />
            </Grid>
          </Grid>

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle1" fontWeight="bold">
              Quoted Items
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
                  <TableCell width="15%"><strong>Quoted Unit Price</strong></TableCell>
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
              Quote Total: {formatCurrency(grandTotal)}
            </Typography>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            sx={{ mt: 2 }}
          />
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
            {editId ? 'Update Quotation' : 'Create Quotation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupplierQuotationList;
