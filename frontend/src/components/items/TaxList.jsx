import React, { useState, useEffect } from 'react';
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
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
  Chip,
} from '@mui/material';
import { Add, Edit, Delete, LocalOffer } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { taxService } from '../../services/taxService';
import TaxForm from './TaxForm';

const TaxList = () => {
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTax, setSelectedTax] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchTaxes();
  }, []);

  const fetchTaxes = async () => {
    try {
      setLoading(true);
      const data = await taxService.getAll();
      setTaxes(data);
    } catch (error) {
      toast.error('Failed to fetch taxes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await taxService.delete(selectedTax.id);
      toast.success('Tax deleted successfully');
      setDeleteDialogOpen(false);
      fetchTaxes();
    } catch (error) {
      toast.error('Failed to delete tax');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Taxes
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage tax rates
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setSelectedTax(null);
            setFormOpen(true);
          }}
          sx={{ borderRadius: 2 }}
        >
          Add Tax
        </Button>
      </Box>

      <Paper sx={{ p: 2, borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ width: '100%', py: 4 }}>
            <LinearProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                  <TableCell>#</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Tax Percentage</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {taxes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      No taxes found
                    </TableCell>
                  </TableRow>
                ) : (
                  taxes.map((tax, index) => (
                    <TableRow key={tax.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LocalOffer sx={{ color: '#1976d2' }} />
                          <Typography fontWeight={500}>{tax.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={`${tax.taxPercentage}%`} color="primary" size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tax.isActive ? 'Active' : 'Inactive'}
                          color={tax.isActive ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setSelectedTax(tax);
                              setFormOpen(true);
                            }}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setSelectedTax(tax);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <TaxForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedTax(null);
        }}
        tax={selectedTax}
        onSuccess={fetchTaxes}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Tax</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete tax "{selectedTax?.name}"?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaxList;