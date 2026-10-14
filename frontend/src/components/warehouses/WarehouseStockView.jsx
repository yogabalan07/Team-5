// src/components/warehouses/WarehouseStockView.jsx
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
  Autocomplete,
} from '@mui/material';
import {
  Inventory,
  Search,
  SwapVert,
  Warehouse,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import warehouseService from '../../services/warehouseService';

const WarehouseStockView = () => {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const whs = await warehouseService.getAllWarehouses();
        setWarehouses(whs);
        const main = whs.find((w) => w.isMain) || whs[0] || null;
        setSelected(main);
      } catch (e) {
        toast.error('Failed to load warehouses');
      }
    })();
  }, []);

  const fetchRows = useCallback(async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const data = await warehouseService.getStockForWarehouse(selected.id, page, rowsPerPage, search);
      setRows(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      toast.error('Failed to load warehouse stock');
    } finally {
      setLoading(false);
    }
  }, [selected, page, rowsPerPage, search]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <Inventory sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Warehouse Stock
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Stock held in each warehouse. Use transfers to move stock between warehouses.
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Warehouse />} onClick={() => navigate('/warehouses')}>
            Warehouses
          </Button>
          <Button variant="outlined" startIcon={<SwapVert />} onClick={() => navigate('/inventory/transfers')}>
            Stock Transfers
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Autocomplete
            options={warehouses}
            getOptionLabel={(w) => `${w.code} — ${w.name}`}
            value={selected}
            onChange={(e, w) => {
              setSelected(w);
              setPage(0);
            }}
            sx={{ minWidth: 280 }}
            renderInput={(params) => <TextField {...params} label="Warehouse" size="small" />}
          />
          <TextField
            size="small"
            placeholder="Search items in this warehouse..."
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
            sx={{ flexGrow: 1, minWidth: 220 }}
          />
        </Box>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Item</strong></TableCell>
              <TableCell><strong>SKU</strong></TableCell>
              <TableCell align="right"><strong>Quantity</strong></TableCell>
              <TableCell align="right"><strong>Reorder Level</strong></TableCell>
              <TableCell align="center"><strong>Status</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow key={row.id || `${row.warehouseId}_${row.itemId}`} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="600">{row.itemName}</Typography>
                  </TableCell>
                  <TableCell>{row.itemCode || '-'}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="700">{row.quantity}</Typography>
                  </TableCell>
                  <TableCell align="right">{row.minStock || '-'}</TableCell>
                  <TableCell align="center">
                    {Number(row.quantity) <= 0 ? (
                      <Chip label="OUT" color="error" size="small" />
                    ) : row.minStock && Number(row.quantity) <= Number(row.minStock) ? (
                      <Chip label="LOW" color="warning" size="small" />
                    ) : (
                      <Chip label="OK" color="success" size="small" variant="outlined" />
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">
                    {loading ? 'Loading stock...' : 'No stock records for this warehouse yet'}
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

export default WarehouseStockView;
