// src/components/warehouses/WarehouseList.jsx
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
  Chip,
  TextField,
  InputAdornment,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Search,
  Warehouse,
  Edit,
  Delete,
  Close,
  Save,
  Inventory,
  Place,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import ConfirmDialog from '../common/ConfirmDialog';
import warehouseService from '../../services/warehouseService';

const WarehouseList = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState('');
  const [form, setForm] = useState({ code: '', name: '', location: '', address: '', isActive: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await warehouseService.getWarehouses(0, 200, search);
      setRows(data.content || []);
    } catch (err) {
      toast.error('Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const openCreate = () => {
    setEditId('');
    setForm({ code: '', name: '', location: '', address: '', isActive: true });
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id);
    setForm({
      code: row.code || '',
      name: row.name || '',
      location: row.location || '',
      address: row.address || '',
      isActive: row.isActive !== false,
    });
    setError('');
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    setError('');
    try {
      setSaving(true);
      if (editId) {
        await warehouseService.updateWarehouse(editId, form);
        toast.success('Warehouse updated');
      } else {
        const res = await warehouseService.createWarehouse(form);
        toast.success(`Warehouse ${res.code} created`);
      }
      setDialogOpen(false);
      fetchRows();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save warehouse');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await warehouseService.deleteWarehouse(deleteTarget.id);
      toast.success('Warehouse deleted');
      setDeleteTarget(null);
      fetchRows();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Delete failed');
      setDeleteTarget(null);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <Warehouse sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Warehouses
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage storage facilities and their locations (aisles, racks, shelves, bins)
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Place />} onClick={() => navigate('/warehouses/locations')}>
            Locations
          </Button>
          <Button variant="outlined" startIcon={<Inventory />} onClick={() => navigate('/warehouses/stock')}>
            Warehouse Stock
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            New Warehouse
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search warehouses by code, name, location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
              <TableCell><strong>Code</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Location</strong></TableCell>
              <TableCell align="center"><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="700" color="primary.main">{row.code}</Typography>
                    {row.isMain && <Chip label="DEFAULT" size="small" color="primary" variant="outlined" />}
                  </TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.location || row.address || '-'}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={row.isActive === false ? 'INACTIVE' : 'ACTIVE'}
                      size="small"
                      color={row.isActive === false ? 'default' : 'success'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title="Edit">
                        <IconButton size="small" color="primary" onClick={() => openEdit(row)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {!row.isMain && (
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteTarget(row)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">
                    {loading ? 'Loading warehouses...' : 'No warehouses found'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {editId ? 'Edit Warehouse' : 'New Warehouse'}
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                disabled={!!editId}
                placeholder="e.g. WH1"
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location / City"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </Grid>
          </Grid>
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
            {editId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Warehouse"
        message={`Delete warehouse "${deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
};

export default WarehouseList;
