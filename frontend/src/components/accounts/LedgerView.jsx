import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  Person,
  AccountBalance,
  Print,
  Download,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { accountService } from '../../services/accountService';
import { customerService } from '../../services/customerService';
import CustomerSearch from '../customers/CustomerSearch';

const LedgerView = () => {
  const [customer, setCustomer] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [error, setError] = useState('');

  const handleCustomerSelect = async (selectedCustomer) => {
    setCustomer(selectedCustomer);
    await fetchLedger(selectedCustomer.id);
  };

  const fetchLedger = async (customerId) => {
    setLoading(true);
    try {
      const data = await accountService.getCustomerLedger(customerId);
      console.log('📋 Raw ledger data:', JSON.stringify(data, null, 2));
      setLedger(data);
      setError('');
    } catch (error) {
      console.error('❌ Error fetching ledger:', error);
      setError('Failed to fetch ledger details');
      toast.error('Failed to fetch ledger');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeColor = (type) => {
    const colors = {
      'Invoice': 'primary',
      'Cash Sale': 'info',
      'Credit Sale': 'primary',
      'Receipt': 'success',
      'Payment': 'warning',
      'Credit Note': 'error',
      'Opening Balance': 'default',
    };
    return colors[type] || 'default';
  };

  const getTransactionType = (entry) => {
    if (entry.type === 'Invoice') {
      // Check paymentMode from entry
      const isCash = entry.paymentMode === 'CASH' || 
                     entry.paymentMode === 'Cash' ||
                     entry.paymentType === 'CASH' ||
                     entry.paymentType === 'Cash' ||
                     (entry.amount === entry.paidAmount && entry.paidAmount > 0);
      
      if (isCash) {
        return 'Cash Sale';
      } else {
        return 'Credit Sale';
      }
    } else if (entry.type === 'Receipt') {
      return 'Receipt';
    } else if (entry.type === 'Payment') {
      return 'Payment';
    } else if (entry.type === 'Credit Note') {
      return 'Credit Note';
    } else if (entry.type === 'Opening Balance') {
      return 'Opening Balance';
    }
    return entry.type || 'Transaction';
  };

  const isCashSale = (entry) => {
    if (entry.type !== 'Invoice') return false;
    
    const isCash = entry.paymentMode === 'CASH' || 
                   entry.paymentMode === 'Cash' ||
                   entry.paymentType === 'CASH' ||
                   entry.paymentType === 'Cash' ||
                   (entry.amount === entry.paidAmount && entry.paidAmount > 0);
    
    return isCash;
  };

  const calculateTotals = () => {
    let totalDebit = 0;
    let totalCredit = 0;
    let runningBalance = 0;

    const updatedLedger = ledger.map((entry) => {
      const amount = entry.amount || 0;
      const paidAmount = entry.paidAmount || entry.payment || 0;
      const isCash = isCashSale(entry);
      
      let debitAmount = 0;
      let creditAmount = 0;
      let balanceChange = 0;

      // Opening Balance
      if (entry.type === 'Opening Balance') {
        if (amount > 0) {
          debitAmount = amount;
          balanceChange = amount;
          totalDebit += amount;
        } else {
          creditAmount = Math.abs(amount);
          balanceChange = -Math.abs(amount);
          totalCredit += Math.abs(amount);
        }
      }
      // Invoice (Sale)
      else if (entry.type === 'Invoice') {
        if (isCash) {
          // Cash Sale - NO balance effect
          debitAmount = 0;
          creditAmount = 0;
          balanceChange = 0;
        } else {
          // Credit Sale - customer owes us
          const outstanding = amount - paidAmount;
          if (outstanding > 0) {
            debitAmount = outstanding;
            balanceChange = outstanding;
            totalDebit += outstanding;
          }
        }
      }
      // Receipt (Payment received from customer)
      else if (entry.type === 'Receipt') {
        creditAmount = amount;
        balanceChange = -amount;
        totalCredit += amount;
      }
      // Payment (Payment made to customer)
      else if (entry.type === 'Payment') {
        debitAmount = amount;
        balanceChange = amount;
        totalDebit += amount;
      }
      // Credit Note
      else if (entry.type === 'Credit Note') {
        creditAmount = amount;
        balanceChange = -amount;
        totalCredit += amount;
      }

      // Update running balance
      runningBalance += balanceChange;

      return {
        ...entry,
        debitAmount: debitAmount,
        creditAmount: creditAmount,
        balance: runningBalance,
        isCashSale: isCash,
        transactionType: getTransactionType(entry),
        outstanding: entry.type === 'Invoice' ? amount - paidAmount : 0,
      };
    });

    return { 
      totalDebit, 
      totalCredit, 
      balance: runningBalance,
      updatedLedger 
    };
  };

  const totals = calculateTotals();
  const displayLedger = totals.updatedLedger || ledger;

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <AccountBalance sx={{ fontSize: 40, color: '#1976d2' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Customer Ledger
          </Typography>
          <Typography variant="body2" color="textSecondary">
            View customer transaction history
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box display="flex" gap={2} mb={3} alignItems="center" flexWrap="wrap">
              <TextField
                label="Customer"
                value={customer?.name || ''}
                placeholder="Search customer..."
                sx={{ flexGrow: 1, minWidth: 200 }}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <IconButton onClick={() => setCustomerSearchOpen(true)}>
                      <Search />
                    </IconButton>
                  ),
                }}
              />
              {customer && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    setCustomer(null);
                    setLedger([]);
                  }}
                >
                  Clear
                </Button>
              )}
              {ledger.length > 0 && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<Print />}
                    onClick={() => window.print()}
                  >
                    Print
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                  >
                    Export
                  </Button>
                </>
              )}
            </Box>

            {customer && (
              <Box mb={3}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="textSecondary">
                          Customer Name
                        </Typography>
                        <Typography variant="h6">{customer.name}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="textSecondary">
                          Phone
                        </Typography>
                        <Typography variant="h6">{customer.phone}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="textSecondary">
                          Current Balance
                        </Typography>
                        <Typography 
                          variant="h6" 
                          color={totals.balance > 0 ? 'error' : totals.balance < 0 ? 'success' : 'textSecondary'}
                        >
                          {totals.balance === 0 ? '₹0.00 (Settled)' : 
                            totals.balance > 0 ? `₹${totals.balance.toFixed(2)} (Receivable)` : 
                            `₹${Math.abs(totals.balance).toFixed(2)} (Payable)`}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Grid container spacing={2} mt={1}>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="textSecondary">
                          Total Sales
                        </Typography>
                        <Typography variant="h6" color="primary">
                          ₹{displayLedger.reduce((sum, entry) => {
                            if (entry.type === 'Invoice') return sum + (entry.amount || 0);
                            return sum;
                          }, 0).toFixed(2)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="textSecondary">
                          Total Payments Received
                        </Typography>
                        <Typography variant="h6" color="success">
                          ₹{displayLedger.reduce((sum, entry) => {
                            if (entry.type === 'Receipt') return sum + (entry.amount || 0);
                            return sum;
                          }, 0).toFixed(2)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="textSecondary">
                          Outstanding Balance
                        </Typography>
                        <Typography variant="h6" color={totals.balance > 0 ? 'error' : 'success'}>
                          {totals.balance === 0 ? '₹0.00' : 
                            totals.balance > 0 ? `₹${totals.balance.toFixed(2)} (Due)` : 
                            `₹${Math.abs(totals.balance).toFixed(2)} (Credit)`}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : displayLedger.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Invoice No</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Debit</TableCell>
                      <TableCell align="right">Credit</TableCell>
                      <TableCell align="right">Balance</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayLedger.map((entry, index) => {
                      const isCash = entry.isCashSale;
                      
                      return (
                        <TableRow 
                          key={index} 
                          sx={{ 
                            backgroundColor: isCash ? '#f0f7ff' : 'inherit',
                          }}
                        >
                          <TableCell>
                            {entry.date ? new Date(entry.date).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={entry.transactionType}
                              color={getTransactionTypeColor(entry.transactionType)}
                              size="small"
                            />
                            {isCash && (
                              <Chip
                                label="✓ Paid"
                                color="success"
                                size="small"
                                sx={{ ml: 0.5 }}
                              />
                            )}
                          </TableCell>
                          <TableCell>{entry.invoiceNo || '-'}</TableCell>
                          <TableCell>
                            {entry.description || entry.remarks || '-'}
                          </TableCell>
                          <TableCell align="right">
                            {entry.debitAmount > 0 ? `₹${entry.debitAmount.toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell align="right">
                            {entry.creditAmount > 0 ? `₹${entry.creditAmount.toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              fontWeight={500}
                              color={entry.balance > 0 ? 'error' : entry.balance < 0 ? 'success' : 'textSecondary'}
                            >
                              {entry.balance === 0 ? '₹0.00' : 
                                entry.balance > 0 ? `₹${entry.balance.toFixed(2)}` : 
                                `₹${Math.abs(entry.balance).toFixed(2)}`}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {entry.type === 'Invoice' && (
                              <Chip
                                label={isCash ? 'Settled' : 
                                      entry.outstanding <= 0 ? 'Settled' : 
                                      `Due: ₹${entry.outstanding.toFixed(2)}`}
                                color={isCash ? 'success' : 
                                       entry.outstanding <= 0 ? 'success' : 'warning'}
                                size="small"
                              />
                            )}
                            {entry.type === 'Receipt' && (
                              <Chip label="Received" color="success" size="small" />
                            )}
                            {entry.type === 'Credit Note' && (
                              <Chip label="Credit Note" color="info" size="small" />
                            )}
                            {entry.type === 'Opening Balance' && (
                              <Chip label="Opening" color="default" size="small" />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : customer ? (
              <Box textAlign="center" py={4}>
                <Typography color="textSecondary">
                  No transactions found for this customer
                </Typography>
              </Box>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="textSecondary">
                  Search and select a customer to view ledger
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <CustomerSearch
        open={customerSearchOpen}
        onClose={() => setCustomerSearchOpen(false)}
        onSelect={handleCustomerSelect}
      />
    </Box>
  );
};

export default LedgerView;