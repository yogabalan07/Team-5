import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  TextField,
  Divider,
} from '@mui/material';
import {
  Print as PrintIcon,
  FileDownload as ExportIcon,
  AccountBalanceWallet as WalletIcon,
  Receipt,
  Payment,
  Undo,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const PartyStatementDialog = ({ open, onClose, party, service, isCustomer = true }) => {
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (open && party && service) {
      loadStatement();
    }
  }, [open, party]);

  const loadStatement = async () => {
    if (!party) return;
    setLoading(true);
    try {
      const data = await service.getStatement(party.id, startDate, endDate);
      setStatement(data);
    } catch (err) {
      console.error('Failed to load statement:', err);
      toast.error('Failed to load account statement');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amt || 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!statement || !statement.transactions.length) return;
    const headers = ['Date', 'Type', 'Reference No', 'Description', 'Debit (INR)', 'Credit (INR)', 'Running Balance (INR)'];
    const rows = statement.transactions.map((t) => [
      t.date,
      t.type,
      t.refNo || '',
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.debit,
      t.credit,
      t.balance,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `statement-${party?.name || 'account'}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success('Statement exported');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <WalletIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            {isCustomer ? 'Customer Account Statement' : 'Supplier Account Statement'}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button size="small" variant="outlined" startIcon={<ExportIcon />} onClick={handleExportCsv}>
            Export CSV
          </Button>
          <Button size="small" variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
            Print Statement
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {party && (
          <Box mb={3}>
            {/* Party Profile Header */}
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" fontWeight="bold">
                    {party.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Contact: {party.contactPerson || '-'} | Phone: {party.phone || '-'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    GSTIN: {party.gstNo || 'Unregistered'} | PAN: {party.panNo || '-'}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" display="block">
                    Address: {party.address || party.billingAddress || '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">OPENING BALANCE</Typography>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {formatCurrency(statement?.openingBalance || party.openingBalance || 0)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">CURRENT DUE BALANCE</Typography>
                      <Typography variant="h6" fontWeight="bold" color="error.main">
                        {formatCurrency(statement?.closingBalance || party.creditBalance || 0)}
                      </Typography>
                    </Grid>
                    {isCustomer && party.creditLimit > 0 && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">CREDIT LIMIT</Typography>
                        <Typography variant="body2" fontWeight="600">
                          {formatCurrency(party.creditLimit)}
                        </Typography>
                      </Grid>
                    )}
                    {party.creditDays > 0 && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">PAYMENT TERMS</Typography>
                        <Typography variant="body2" fontWeight="600">
                          {party.creditDays} Days Net
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Grid>
              </Grid>
            </Paper>

            {/* Date Filters */}
            <Box display="flex" gap={2} mb={2} alignItems="center">
              <TextField
                size="small"
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                size="small"
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <Button variant="outlined" onClick={loadStatement}>
                Apply Date Range
              </Button>
            </Box>

            {loading && <LinearProgress sx={{ mb: 2 }} />}

            {/* Transactions Ledger */}
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.200' }}>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell><strong>Ref #</strong></TableCell>
                    <TableCell><strong>Description</strong></TableCell>
                    <TableCell align="right"><strong>Debit (₹)</strong></TableCell>
                    <TableCell align="right"><strong>Credit (₹)</strong></TableCell>
                    <TableCell align="right"><strong>Running Balance (₹)</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {statement?.transactions && statement.transactions.length > 0 ? (
                    statement.transactions.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={row.type}
                            color={
                              row.type === 'INVOICE' || row.type === 'PURCHASE'
                                ? 'primary'
                                : row.type === 'RECEIPT' || row.type === 'PAYMENT'
                                ? 'success'
                                : 'warning'
                            }
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell><strong>{row.refNo || '-'}</strong></TableCell>
                        <TableCell>{row.description}</TableCell>
                        <TableCell align="right">{row.debit > 0 ? formatCurrency(row.debit) : '-'}</TableCell>
                        <TableCell align="right">{row.credit > 0 ? formatCurrency(row.credit) : '-'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(row.balance)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        <Typography color="textSecondary">
                          {loading ? 'Calculating ledger statement...' : 'No transactions recorded for this account.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PartyStatementDialog;
