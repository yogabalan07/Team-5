import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  MenuItem,
  Button,
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
  Grid,
  Card,
  CardContent,
  Tooltip,
} from '@mui/material';
import {
  Search,
  FilterList,
  Refresh,
  FileDownload,
  Visibility,
  History,
  Security,
  CheckCircle,
  WarningAmber,
  ErrorOutline,
  Computer,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const INITIAL_AUDIT_LOGS = [
  {
    id: 'LOG-20261010-0089',
    timestamp: '2026-10-10 09:22:14',
    user: 'Alexander Vance',
    email: 'admin@ebms.enterprise',
    role: 'ADMIN',
    action: 'USER_ROLE_PROMOTION',
    module: 'Security & Auth',
    entityId: 'USR-88219 (David Chen)',
    severity: 'WARNING',
    status: 'SUCCESS',
    ip: '192.168.1.104',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
    details: {
      changedBy: 'admin@ebms.enterprise',
      targetUser: 'david.chen@ebms.enterprise',
      previousRole: 'STAFF',
      newRole: 'BILLING_CLERK',
      reason: 'Department transfer to Regional Billing Desk',
      approvedBy: 'Alexander Vance (System Admin)',
    },
  },
  {
    id: 'LOG-20261010-0088',
    timestamp: '2026-10-10 09:14:02',
    user: 'David Chen',
    email: 'billing@ebms.enterprise',
    role: 'BILLING_CLERK',
    action: 'INVOICE_ISSUANCE',
    module: 'Sales & Billing',
    entityId: 'INV-20261010-000042',
    severity: 'INFO',
    status: 'SUCCESS',
    ip: '192.168.1.112',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1',
    details: {
      customer: 'Apex Global Logistics Inc.',
      invoiceTotal: 14250.0,
      taxTotal: 1710.0,
      paymentTerms: 'Net 30 Days',
      stockDeducted: true,
      itemsCount: 6,
    },
  },
  {
    id: 'LOG-20261010-0087',
    timestamp: '2026-10-10 08:58:40',
    user: 'Elena Rostova',
    email: 'purchase@ebms.enterprise',
    role: 'PURCHASE_MANAGER',
    action: 'PURCHASE_ORDER_APPROVE',
    module: 'Procurement',
    entityId: 'PO-20261010-000018',
    severity: 'INFO',
    status: 'SUCCESS',
    ip: '192.168.1.115',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/129.0',
    details: {
      supplier: 'Precision Components Corp',
      poTotal: 38400.0,
      expectedDelivery: '2026-10-18',
      warehouseDestination: 'Central Warehouse WH-01',
      approvalLevel: 'L2_DIRECTOR',
    },
  },
  {
    id: 'LOG-20261010-0086',
    timestamp: '2026-10-10 08:45:11',
    user: 'Sarah Jenkins',
    email: 'store@ebms.enterprise',
    role: 'STORE_MANAGER',
    action: 'STOCK_TRANSFER_DISPATCH',
    module: 'Warehouses',
    entityId: 'TRF-20261010-000007',
    severity: 'INFO',
    status: 'SUCCESS',
    ip: '192.168.1.120',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/127.0',
    details: {
      sourceWarehouse: 'Central Warehouse WH-01',
      destinationWarehouse: 'North Regional Hub WH-02',
      skusTransferred: 4,
      totalQuantity: 250,
      transportCarrier: 'FastFreight Express',
    },
  },
  {
    id: 'LOG-20261010-0085',
    timestamp: '2026-10-10 08:12:33',
    user: 'External System',
    email: 'auth-gateway@ebms.enterprise',
    role: 'SYSTEM',
    action: 'LOGIN_FAILURE',
    module: 'Security & Auth',
    entityId: 'UNKNOWN_IP (45.33.22.11)',
    severity: 'CRITICAL',
    status: 'DENIED',
    ip: '45.33.22.11',
    userAgent: 'Python-requests/2.31.0',
    details: {
      attemptedEmail: 'root@ebms.enterprise',
      failureReason: 'Account does not exist; IP rate-limited for 30 minutes',
      blockedByPolicy: 'ENTERPRISE_SHIELD_V4',
    },
  },
  {
    id: 'LOG-20261010-0084',
    timestamp: '2026-10-10 07:30:19',
    user: 'Marcus Brody',
    email: 'accounts@ebms.enterprise',
    role: 'ACCOUNTS',
    action: 'PAYMENT_VOUCHER_POST',
    module: 'Financial Ledger',
    entityId: 'VCH-20261010-000012',
    severity: 'INFO',
    status: 'SUCCESS',
    ip: '192.168.1.118',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/128.0',
    details: {
      beneficiary: 'Reliable Industrial Supplies',
      amountPaid: 8900.0,
      paymentMethod: 'Corporate Wire Transfer',
      referenceNumber: 'TXN-99823101-WIRE',
      reconciledInLedger: true,
    },
  },
];

const AuditLogs = () => {
  const [logs, setLogs] = useState(INITIAL_AUDIT_LOGS);
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [detailLog, setDetailLog] = useState(null);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        search === '' ||
        log.user.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.entityId.toLowerCase().includes(search.toLowerCase()) ||
        log.id.toLowerCase().includes(search.toLowerCase());

      const matchModule = selectedModule === 'ALL' || log.module === selectedModule;
      const matchSeverity = selectedSeverity === 'ALL' || log.severity === selectedSeverity;

      return matchSearch && matchModule && matchSeverity;
    });
  }, [logs, search, selectedModule, selectedSeverity]);

  const handleExportCSV = () => {
    const headers = 'Log ID,Timestamp,User,Email,Role,Action,Module,Entity,Severity,Status,IP Address\n';
    const rows = filteredLogs
      .map(
        (l) =>
          `"${l.id}","${l.timestamp}","${l.user}","${l.email}","${l.role}","${l.action}","${l.module}","${l.entityId}","${l.severity}","${l.status}","${l.ip}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success('Audit log export initiated');
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ color: 'text.primary', mb: 0.5 }}>
            Enterprise Audit Trail
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Immutable system activity record capturing role modifications, financial postings, inventory movements, and auth events.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              setLogs(INITIAL_AUDIT_LOGS);
              toast.info('Audit log synchronized');
            }}
          >
            Refresh Logs
          </Button>
          <Button
            variant="contained"
            startIcon={<FileDownload />}
            onClick={handleExportCSV}
          >
            Export Audit Trail (CSV)
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Total Recorded Events
              </Typography>
              <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
                {logs.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Administrative Actions
              </Typography>
              <Typography variant="h5" fontWeight={700} color="warning.main" sx={{ mt: 0.5 }}>
                {logs.filter((l) => l.module.includes('Security') || l.role === 'ADMIN').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Financial & Stock Postings
              </Typography>
              <Typography variant="h5" fontWeight={700} color="primary.main" sx={{ mt: 0.5 }}>
                {logs.filter((l) => l.module.includes('Sales') || l.module.includes('Procurement') || l.module.includes('Warehouses')).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Security Interventions
              </Typography>
              <Typography variant="h5" fontWeight={700} color="error.main" sx={{ mt: 0.5 }}>
                {logs.filter((l) => l.severity === 'CRITICAL' || l.status === 'DENIED').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Toolbar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by action, user, entity ID, or log number..."
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
          <Grid item xs={6} md={3.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Module"
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
            >
              <MenuItem value="ALL">All Operational Modules</MenuItem>
              <MenuItem value="Security & Auth">Security & Auth</MenuItem>
              <MenuItem value="Sales & Billing">Sales & Billing</MenuItem>
              <MenuItem value="Procurement">Procurement</MenuItem>
              <MenuItem value="Warehouses">Warehouses</MenuItem>
              <MenuItem value="Financial Ledger">Financial Ledger</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} md={3.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Severity"
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
            >
              <MenuItem value="ALL">All Severities</MenuItem>
              <MenuItem value="INFO">Informational (INFO)</MenuItem>
              <MenuItem value="WARNING">Audited Changes (WARNING)</MenuItem>
              <MenuItem value="CRITICAL">Security Alert (CRITICAL)</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Audit Log Table */}
      <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Log ID & Timestamp</TableCell>
              <TableCell>Actor / User</TableCell>
              <TableCell>Action Category</TableCell>
              <TableCell>Module</TableCell>
              <TableCell>Target Entity</TableCell>
              <TableCell align="center">Severity</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    No matching audit records found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => {
                const isCrit = log.severity === 'CRITICAL';
                const isWarn = log.severity === 'WARNING';

                return (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                        {log.id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        {log.timestamp}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {log.user}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {log.email} ({log.role})
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={log.action}
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', fontWeight: 600, fontFamily: 'monospace' }}
                      />
                    </TableCell>
                    <TableCell>{log.module}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {log.entityId}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={log.severity}
                        color={isCrit ? 'error' : isWarn ? 'warning' : 'default'}
                        sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={log.status}
                        color={log.status === 'SUCCESS' ? 'success' : 'error'}
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Detailed Payload">
                        <IconButton size="small" onClick={() => setDetailLog(log)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Log Detail Modal */}
      <Dialog open={Boolean(detailLog)} onClose={() => setDetailLog(null)} maxWidth="md" fullWidth>
        {detailLog && (
          <>
            <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Audit Event Inspector — {detailLog.id}</span>
              <Chip size="small" label={detailLog.action} color="primary" />
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Timestamp</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>{detailLog.timestamp}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">User Account</Typography>
                  <Typography variant="body2" fontWeight={600}>{detailLog.user}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">IP Address</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>{detailLog.ip}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Outcome</Typography>
                  <Typography variant="body2" fontWeight={600} color={detailLog.status === 'SUCCESS' ? 'success.main' : 'error.main'}>{detailLog.status}</Typography>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Event Payload & State Attributes
              </Typography>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#070d1e' : '#f8fafc'),
                  border: '1px solid',
                  borderColor: 'divider',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  maxHeight: 260,
                  overflowY: 'auto',
                }}
              >
                <pre style={{ margin: 0 }}>{JSON.stringify(detailLog.details, null, 2)}</pre>
              </Paper>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                Client User Agent: {detailLog.userAgent}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setDetailLog(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AuditLogs;
