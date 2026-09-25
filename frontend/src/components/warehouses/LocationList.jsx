// src/components/warehouses/LocationList.jsx
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
  Autocomplete,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Search,
  Place,
  Delete,
  Close,
  Save,
  Warehouse,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import ConfirmDialog from '../common/ConfirmDialog';
import warehouseService from '../../services/warehouseService';

const LocationList = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ warehouseId: '', warehouseName: '', code: '', aisle: '', rack: '', shelf: '', bin: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [locs, whs] = await Promise.all([
        warehouseService.getLocations(warehouseFilter ? warehouseFilter.id : ''),
        warehouseService.getAllWarehouses(),
      ]);
      setRows(locs);
      setWarehouses(whs);
    } catch (err) {
      toast.error('Failed to load warehouse locations');
    } finally {
      setLoading(false);
    }
  }, [warehouseFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setForm({
      warehouseId: warehouseFilter ? warehouseFilter.id : '',
      warehouseName: warehouseFilter ? warehouseFilter.name : '',
      code: '',
      aisle: '',
      rack: '',
      shelf: '',
      bin: '',
    });
    setError('');
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.warehouseId) {
      setError('Select a warehouse');
      return;
    }
    try {
      setSaving(true);
      const res = await warehouseService.createLocation(form);
      toast.success(`Location ${res.code} created`);
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await warehouseService.deleteLocation(deleteTarget.id);
      toast.success('Location deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Delete failed');
      setDeleteTarget(null);
    }
  };

  const filtered = rows.filter((r) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return [r.code, r.aisle, r.rack, r.shelf, r.bin, r.warehouseName]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(term));
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <Place sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Warehouse Locations
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Aisles, racks, shelves and bins inside each warehouse
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Warehouse />} onClick={() => navigate('/warehouses')}>
            Warehouses
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            New Location
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by code, aisle, rack, shelf, bin..."
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
          </Grid>
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={[{ id: '', name: 'All Warehouses', code: '' }, ...warehouses]}
              getOptionLabel={(w) => (w.id ? `${w.code} — ${w.name}` : w.name)}
              value={warehouseFilter}
              onChange={(e, w) => setWarehouseFilter(w && w.id ? w : null)}
              renderInput={(params) => <TextField {...params} label="Filter by Warehouse" size="small" />}
            />
          </Grid>
        </Grid>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Code</strong></TableCell>
              <TableCell><strong>Warehouse</strong></TableCell>
              <TableCell><strong>Aisle</strong></TableCell>
              <TableCell><strong>Rack</strong></TableCell>
              <TableCell><strong>Shelf</strong></TableCell>
              <TableCell><strong>Bin</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Chip label={row.code} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>{row.warehouseName || row.warehouseId}</TableCell>
                  <TableCell>{row.aisle || '-'}</TableCell>
                  <TableCell>{row.rack || '-'}</TableCell>
                  <TableCell>{row.shelf || '-'}</TableCell>
                  <TableCell>{row.bin || '-'}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">
                    {loading ? 'Loading locations...' : 'No locations found. Create your first rack/shelf/bin location.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>New Warehouse Location</DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Autocomplete
                options={warehouses}
                getOptionLabel={(w) => `${w.code} — ${w.name}`}
                value={warehouses.find((w) => w.id === form.warehouseId) || null}
                onChange={(e, w) =>
                  setForm({ ...form, warehouseId: w ? w.id : '', warehouseName: w ? w.name : '' })
                }
                renderInput={(params) => <TextField {...params} label="Warehouse" required />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location Code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g. A1-R2-S3-B4"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Aisle" value={form.aisle} onChange={(e) => setForm({ ...form, aisle: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Rack" value={form.rack} onChange={(e) => setForm({ ...form, rack: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Shelf" value={form.shelf} onChange={(e) => setForm({ ...form, shelf: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Bin" value={form.bin} onChange={(e) => setForm({ ...form, bin: e.target.value })} />
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
            Create Location
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Location"
        message={`Delete location "${deleteTarget?.code}"?`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
};

export default LocationList;
