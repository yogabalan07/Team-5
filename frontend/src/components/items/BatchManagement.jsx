import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import {
  Search,
  Add,
  Refresh,
  QrCode,
  WarningAmber,
  CheckCircle,
  LocalShipping,
  Assignment,
  Delete,
  Edit,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const INITIAL_BATCHES = [
  {
    id: 'BATCH-2026-A101',
    productName: 'High Precision Ball Bearing 6205',
    sku: 'BEAR-6205-HP',
    mfgDate: '2026-03-15',
    expDate: '2028-03-15',
    initialQty: 1000,
    currentQty: 740,
    unit: 'PCS',
    warehouse: 'Central Warehouse WH-01',
    binLocation: 'Aisle 3 - Rack B - Bin 12',
    status: 'ACTIVE',
  },
  {
    id: 'BATCH-2026-B204',
    productName: 'Hydraulic Seal Kit Type-R',
    sku: 'SEAL-KIT-R',
    mfgDate: '2025-11-20',
    expDate: '2026-11-20',
    initialQty: 400,
    currentQty: 85,
    unit: 'SET',
    warehouse: 'North Regional Hub WH-02',
    binLocation: 'Aisle 1 - Rack A - Bin 04',
    status: 'EXPIRING_SOON',
  },
  {
    id: 'BATCH-2026-C309',
    productName: 'Industrial Synthetic Lubricant 500ml',
    sku: 'LUB-SYN-500',
    mfgDate: '2024-08-10',
    expDate: '2026-08-10',
    initialQty: 500,
    currentQty: 12,
    unit: 'BTL',
    warehouse: 'Central Warehouse WH-01',
    binLocation: 'Hazardous Cage - Bin 02',
    status: 'EXPIRED',
  },
  {
    id: 'BATCH-2026-D412',
    productName: 'Stainless Steel Flange Bolt M12',
    sku: 'BLT-SS-M12',
    mfgDate: '2026-06-01',
    expDate: '2031-06-01',
    initialQty: 5000,
    currentQty: 4620,
    unit: 'PCS',
    warehouse: 'West Logistics Center WH-03',
    binLocation: 'Aisle 5 - Rack D - Bin 08',
    status: 'ACTIVE',
  },
  {
    id: 'BATCH-2026-E519',
    productName: 'Ceramic Thermal Barrier Tile',
    sku: 'TILE-THERM-C',
    mfgDate: '2026-02-18',
    expDate: '2029-02-18',
    initialQty: 250,
    currentQty: 180,
    unit: 'PCS',
    warehouse: 'Central Warehouse WH-01',
    binLocation: 'Quality Inspection Hold',
    status: 'QUARANTINED',
  },
];

const BatchManagement = () => {
  const [batches, setBatches] = useState(INITIAL_BATCHES);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [form, setForm] = useState({
    id: '',
    productName: '',
    sku: '',
    mfgDate: new Date().toISOString().slice(0, 10),
    expDate: new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    initialQty: 500,
    unit: 'PCS',
    warehouse: 'Central Warehouse WH-01',
    binLocation: '',
  });

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const matchSearch =
        search === '' ||
        b.id.toLowerCase().includes(search.toLowerCase()) ||
        b.productName.toLowerCase().includes(search.toLowerCase()) ||
        b.sku.toLowerCase().includes(search.toLowerCase()) ||
        b.warehouse.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [batches, search, statusFilter]);

  const handleCreateBatch = () => {
    if (!form.id.trim() || !form.productName.trim() || !form.sku.trim()) {
      toast.error('Batch identifier, SKU, and Product Name are required');
      return;
    }

    const newBatch = {
      ...form,
      id: form.id.trim().toUpperCase(),
      currentQty: Number(form.initialQty),
      initialQty: Number(form.initialQty),
      status: 'ACTIVE',
    };

    setBatches((prev) => [newBatch, ...prev]);
    setCreateDialogOpen(false);
    toast.success(`Batch ${newBatch.id} successfully registered into warehouse inventory.`);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ color: 'text.primary', mb: 0.5 }}>
            Batch & Lot Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track multi-warehouse batches, manufacturing runs, expiry timelines, and bin storage allocations.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              setBatches(INITIAL_BATCHES);
              toast.info('Batch data reloaded');
            }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Register New Batch
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Total Active Batches
              </Typography>
              <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
                {batches.filter((b) => b.status === 'ACTIVE').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Expiring Soon (&lt; 90 Days)
              </Typography>
              <Typography variant="h5" fontWeight={700} color="warning.main" sx={{ mt: 0.5 }}>
                {batches.filter((b) => b.status === 'EXPIRING_SOON').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Expired Lots
              </Typography>
              <Typography variant="h5" fontWeight={700} color="error.main" sx={{ mt: 0.5 }}>
                {batches.filter((b) => b.status === 'EXPIRED').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Quarantined Holds
              </Typography>
              <Typography variant="h5" fontWeight={700} color="info.main" sx={{ mt: 0.5 }}>
                {batches.filter((b) => b.status === 'QUARANTINED').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Toolbar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={7}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by batch lot #, product name, SKU, or warehouse..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Batch Lifecycle Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="ALL">All Lifecycle Stages</MenuItem>
              <MenuItem value="ACTIVE">Active & In-Stock</MenuItem>
              <MenuItem value="EXPIRING_SOON">Expiring Soon</MenuItem>
              <MenuItem value="EXPIRED">Expired</MenuItem>
              <MenuItem value="QUARANTINED">Quality Quarantine</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Batches Table */}
      <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Batch #</TableCell>
              <TableCell>Product & SKU</TableCell>
              <TableCell>Mfg Date</TableCell>
              <TableCell>Expiry Date</TableCell>
              <TableCell align="right">Current Stock</TableCell>
              <TableCell>Warehouse & Bin</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBatches.map((batch) => {
              const isExpired = batch.status === 'EXPIRED';
              const isExpSoon = batch.status === 'EXPIRING_SOON';
              const isQuarantine = batch.status === 'QUARANTINED';

              return (
                <TableRow key={batch.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                      {batch.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {batch.productName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      SKU: {batch.sku}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{batch.mfgDate}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{batch.expDate}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                      {batch.currentQty} {batch.unit}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      of {batch.initialQty} init
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{batch.warehouse}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {batch.binLocation}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={batch.status.replace('_', ' ')}
                      color={
                        isExpired
                          ? 'error'
                          : isExpSoon
                          ? 'warning'
                          : isQuarantine
                          ? 'info'
                          : 'success'
                      }
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Register Batch Modal */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Register New Manufacturing Batch</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Batch Number / Lot Code"
              fullWidth
              size="small"
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              placeholder="e.g. BATCH-2026-F620"
              helperText="Unique lot identifier on packaging / carton"
            />
            <TextField
              label="Product Name"
              fullWidth
              size="small"
              value={form.productName}
              onChange={(e) => setForm({ ...form, productName: e.target.value })}
              placeholder="e.g. Precision CNC Aluminum Housing"
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Product SKU"
                  fullWidth
                  size="small"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="e.g. CNC-AL-HOUS"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Initial Batch Quantity"
                  type="number"
                  fullWidth
                  size="small"
                  value={form.initialQty}
                  onChange={(e) => setForm({ ...form, initialQty: Number(e.target.value) })}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Manufacturing Date"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={form.mfgDate}
                  onChange={(e) => setForm({ ...form, mfgDate: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Expiration Date"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={form.expDate}
                  onChange={(e) => setForm({ ...form, expDate: e.target.value })}
                />
              </Grid>
            </Grid>
            <TextField
              select
              label="Destination Warehouse"
              fullWidth
              size="small"
              value={form.warehouse}
              onChange={(e) => setForm({ ...form, warehouse: e.target.value })}
            >
              <MenuItem value="Central Warehouse WH-01">Central Warehouse WH-01</MenuItem>
              <MenuItem value="North Regional Hub WH-02">North Regional Hub WH-02</MenuItem>
              <MenuItem value="West Logistics Center WH-03">West Logistics Center WH-03</MenuItem>
            </TextField>
            <TextField
              label="Bin / Rack Allocation Location"
              fullWidth
              size="small"
              value={form.binLocation}
              onChange={(e) => setForm({ ...form, binLocation: e.target.value })}
              placeholder="e.g. Aisle 4 - Rack C - Bin 15"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateBatch}>
            Confirm Registration
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BatchManagement;
