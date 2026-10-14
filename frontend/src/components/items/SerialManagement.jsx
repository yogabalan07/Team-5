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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search,
  Add,
  Refresh,
  QrCode2,
  CheckCircle,
  LocalShipping,
  AssignmentTurnedIn,
  ErrorOutline,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const INITIAL_SERIALS = [
  {
    serialNo: 'SN-ENG-2026-00912',
    productName: 'Heavy Duty 3-Phase Induction Motor 5HP',
    sku: 'MOT-3PH-5HP',
    status: 'IN_STOCK',
    warehouse: 'Central Warehouse WH-01 (Bin M-12)',
    customer: '—',
    warrantyEnd: '2028-10-10',
    linkedDoc: 'PO-20260915-000004',
  },
  {
    serialNo: 'SN-ENG-2026-00913',
    productName: 'Heavy Duty 3-Phase Induction Motor 5HP',
    sku: 'MOT-3PH-5HP',
    status: 'SOLD',
    warehouse: 'Dispatched to Customer',
    customer: 'Apex Global Logistics Inc.',
    warrantyEnd: '2028-10-02',
    linkedDoc: 'INV-20261002-000021',
  },
  {
    serialNo: 'SN-CTRL-99410',
    productName: 'Digital Programmable Logic Controller PLC-8X',
    sku: 'PLC-MOD-8X',
    status: 'ALLOCATED',
    warehouse: 'Staging Area - Bay 4 (Reserved)',
    customer: 'Nordic Automation Oy',
    warrantyEnd: '2027-05-18',
    linkedDoc: 'SO-20261009-000015',
  },
  {
    serialNo: 'SN-CTRL-99411',
    productName: 'Digital Programmable Logic Controller PLC-8X',
    sku: 'PLC-MOD-8X',
    status: 'IN_STOCK',
    warehouse: 'Central Warehouse WH-01 (Safe Rack C)',
    customer: '—',
    warrantyEnd: '2027-05-18',
    linkedDoc: 'PO-20260812-000019',
  },
  {
    serialNo: 'SN-PMP-11045',
    productName: 'High Pressure Diaphragm Water Pump 12V',
    sku: 'PMP-DIAPH-12V',
    status: 'DEFECTIVE',
    warehouse: 'RMA Inspection Quarantine',
    customer: 'Highland Agricultural Co.',
    warrantyEnd: '2027-01-15',
    linkedDoc: 'RET-20261005-000003',
  },
  {
    serialNo: 'SN-PMP-11046',
    productName: 'High Pressure Diaphragm Water Pump 12V',
    sku: 'PMP-DIAPH-12V',
    status: 'RETURNED',
    warehouse: 'Refurbishment Center WH-02',
    customer: 'Highland Agricultural Co.',
    warrantyEnd: '2027-01-15',
    linkedDoc: 'RET-20261005-000003',
  },
];

const SerialManagement = () => {
  const [serials, setSerials] = useState(INITIAL_SERIALS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [bulkProduct, setBulkProduct] = useState('Heavy Duty 3-Phase Induction Motor 5HP');
  const [bulkSku, setBulkSku] = useState('MOT-3PH-5HP');

  const filteredSerials = useMemo(() => {
    return serials.filter((s) => {
      const matchSearch =
        search === '' ||
        s.serialNo.toLowerCase().includes(search.toLowerCase()) ||
        s.productName.toLowerCase().includes(search.toLowerCase()) ||
        s.sku.toLowerCase().includes(search.toLowerCase()) ||
        s.customer.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [serials, search, statusFilter]);

  const handleRegisterBulk = () => {
    const lines = bulkInput
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      toast.error('Please enter at least one serial number');
      return;
    }

    const newEntries = lines.map((sn) => ({
      serialNo: sn.toUpperCase(),
      productName: bulkProduct,
      sku: bulkSku,
      status: 'IN_STOCK',
      warehouse: 'Central Warehouse WH-01 (General Intake)',
      customer: '—',
      warrantyEnd: new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      linkedDoc: 'MANUAL_IMPORT',
    }));

    setSerials((prev) => [...newEntries, ...prev]);
    setCreateDialogOpen(false);
    setBulkInput('');
    toast.success(`Successfully enrolled ${newEntries.length} serial numbers into repository.`);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ color: 'text.primary', mb: 0.5 }}>
            Serial Number Registry
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Individual piece unit tracking, warranty coverage dates, shipment link tracing, and RMA lifecycle history.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              setSerials(INITIAL_SERIALS);
              toast.info('Serial records reloaded');
            }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Enroll Serial Numbers
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                In Warehouse Stock
              </Typography>
              <Typography variant="h5" fontWeight={700} color="success.main" sx={{ mt: 0.5 }}>
                {serials.filter((s) => s.status === 'IN_STOCK').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Allocated to Orders
              </Typography>
              <Typography variant="h5" fontWeight={700} color="info.main" sx={{ mt: 0.5 }}>
                {serials.filter((s) => s.status === 'ALLOCATED').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Sold & Dispatched
              </Typography>
              <Typography variant="h5" fontWeight={700} color="primary.main" sx={{ mt: 0.5 }}>
                {serials.filter((s) => s.status === 'SOLD').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Defective / RMA
              </Typography>
              <Typography variant="h5" fontWeight={700} color="error.main" sx={{ mt: 0.5 }}>
                {serials.filter((s) => s.status === 'DEFECTIVE' || s.status === 'RETURNED').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search & Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={7}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search serial #, product name, customer, or SKU..."
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
              label="Serial Lifecycle Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="ALL">All Serial States</MenuItem>
              <MenuItem value="IN_STOCK">In Stock (Available)</MenuItem>
              <MenuItem value="ALLOCATED">Allocated to Sales Order</MenuItem>
              <MenuItem value="SOLD">Sold & Delivered</MenuItem>
              <MenuItem value="RETURNED">Customer Return</MenuItem>
              <MenuItem value="DEFECTIVE">Defective / Quarantine</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Serials Table */}
      <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Serial Number</TableCell>
              <TableCell>Product Item</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell>Location / Assigned Holder</TableCell>
              <TableCell>Warranty Until</TableCell>
              <TableCell>Trace Document</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSerials.map((s) => (
              <TableRow key={s.serialNo} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                    {s.serialNo}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {s.productName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    SKU: {s.sku}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    size="small"
                    label={s.status.replace('_', ' ')}
                    color={
                      s.status === 'IN_STOCK'
                        ? 'success'
                        : s.status === 'ALLOCATED'
                        ? 'info'
                        : s.status === 'SOLD'
                        ? 'primary'
                        : 'error'
                    }
                    sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{s.warehouse}</Typography>
                  {s.customer !== '—' && (
                    <Typography variant="caption" color="text.secondary">
                      Customer: {s.customer}
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{s.warrantyEnd}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{s.linkedDoc}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Enroll Serials Modal */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Enroll Serialized Stock Numbers</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Product Item"
              fullWidth
              size="small"
              value={bulkProduct}
              onChange={(e) => setBulkProduct(e.target.value)}
            />
            <TextField
              label="Item SKU"
              fullWidth
              size="small"
              value={bulkSku}
              onChange={(e) => setBulkSku(e.target.value)}
            />
            <TextField
              label="Enter Serial Numbers (One Per Line or Scanned)"
              fullWidth
              multiline
              rows={5}
              size="small"
              placeholder="SN-ENG-2026-00920&#10;SN-ENG-2026-00921&#10;SN-ENG-2026-00922"
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              helperText="Paste list of barcode scans or serial tags from packaging."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleRegisterBulk}>
            Enroll to Inventory
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SerialManagement;
