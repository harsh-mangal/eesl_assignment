import { EditOutlined, SearchOutlined, VerifiedOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { api, getApiError } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import type { ApiResponse, RfidRecord } from '../types/api';

const statuses = ['ACTIVE', 'INACTIVE', 'BLOCKED', 'EXPIRED'] as const;
type RfidStatus = (typeof statuses)[number];
type RfidListResponse = { items: RfidRecord[] };

type VerifyResult = {
  valid: boolean;
  result: 'VALID' | 'INVALID';
  reason: string;
  record?: Pick<RfidRecord, 'referenceNumber' | 'cardNumber' | 'status' | 'expiryDate' | 'accessAllowed'>;
  member?: { memberCode: string; fullName: string };
};

function dateInput(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

export function RfidPage() {
  const [records, setRecords] = useState<RfidRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RfidStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState<RfidRecord | null>(null);
  const [editForm, setEditForm] = useState({ referenceNumber: '', cardNumber: '', expiryDate: '', status: 'INACTIVE' as RfidStatus });
  const [saving, setSaving] = useState(false);
  const [verifyReference, setVerifyReference] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<ApiResponse<RfidListResponse>>('/admin/rfid', {
        params: { search: search || undefined, status: statusFilter === 'ALL' ? undefined : statusFilter, page: 1, limit: 100 },
      });
      setRecords(response.data.data.items);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  const openEdit = (record: RfidRecord) => {
    setEditing(record);
    setEditForm({
      referenceNumber: record.referenceNumber,
      cardNumber: record.cardNumber,
      expiryDate: dateInput(record.expiryDate),
      status: record.status,
    });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setError('');
    try {
      await api.patch(`/admin/rfid/${editing.id}`, editForm);
      setMessage('RFID assignment, expiry and access state updated.');
      setEditing(null);
      await load();
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (record: RfidRecord, status: RfidStatus) => {
    try {
      const response = await api.patch<ApiResponse<RfidRecord>>(`/admin/rfid/${record.id}`, { status });
      setRecords((current) => current.map((item) => (item.id === record.id ? response.data.data : item)));
      setMessage('RFID status updated. Mobile clients receive the new state on refresh.');
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  };

  const verify = async () => {
    if (verifyReference.trim().length < 3) return;
    setVerifying(true);
    setError('');
    try {
      const response = await api.post<ApiResponse<VerifyResult>>('/admin/rfid/verify', { referenceNumber: verifyReference.trim() });
      setVerifyResult(response.data.data);
      await load();
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <>
      <PageHeader title="RFID Records" subtitle="Assign references, change expiry, control access and verify mock RFID cards." />

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 3 }}>
        <Typography fontWeight={800} mb={0.5}>Verify RFID reference</Typography>
        <Typography variant="body2" color="text.secondary" mb={1.5}>Blocked, inactive or expired cards return an invalid result and access is denied.</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.25}>
          <TextField fullWidth size="small" label="RFID reference number" value={verifyReference} onChange={(event) => setVerifyReference(event.target.value)} />
          <Button variant="contained" startIcon={<VerifiedOutlined />} onClick={() => void verify()} disabled={verifying || verifyReference.trim().length < 3}>{verifying ? 'Verifying…' : 'Verify'}</Button>
        </Stack>
        {verifyResult && <Alert severity={verifyResult.valid ? 'success' : 'error'} sx={{ mt: 2 }}>
          <Typography fontWeight={800}>{verifyResult.valid ? 'Valid RFID card' : 'Invalid RFID card'}</Typography>
          <Typography variant="body2">{verifyResult.reason}</Typography>
          {verifyResult.member && <Typography variant="body2" mt={0.5}>{verifyResult.member.fullName} ({verifyResult.member.memberCode})</Typography>}
        </Alert>}
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} p={2} borderBottom="1px solid" borderColor="divider">
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search member, RFID reference or card number"
            size="small"
            fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as RfidStatus | 'ALL')}>
              <MenuItem value="ALL">All statuses</MenuItem>
              {statuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
        {loading ? (
          <Box minHeight={260} display="grid" sx={{ placeItems: 'center' }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Member</TableCell><TableCell>RFID Reference</TableCell><TableCell>Card Number</TableCell><TableCell>Expiry</TableCell><TableCell>Verification</TableCell><TableCell>Status</TableCell><TableCell align="right">Edit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell><Typography fontWeight={700}>{record.member.fullName}</Typography><Typography variant="caption" color="text.secondary">{record.member.memberCode}</Typography></TableCell>
                    <TableCell>{record.referenceNumber}</TableCell>
                    <TableCell>{record.cardNumber}</TableCell>
                    <TableCell>{new Date(record.expiryDate).toLocaleDateString()}</TableCell>
                    <TableCell><Chip size="small" label={record.lastVerificationResult ?? 'Not verified'} color={record.lastVerificationResult === 'VALID' ? 'success' : record.lastVerificationResult === 'INVALID' ? 'error' : 'default'} /></TableCell>
                    <TableCell><FormControl size="small" sx={{ minWidth: 130 }}><Select value={record.status} onChange={(event) => void updateStatus(record, event.target.value as RfidStatus)}>{statuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}</Select></FormControl></TableCell>
                    <TableCell align="right"><Tooltip title="Edit RFID assignment and expiry"><IconButton onClick={() => openEdit(record)}><EditOutlined /></IconButton></Tooltip></TableCell>
                  </TableRow>
                ))}
                {records.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}>No RFID records found.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={Boolean(editing)} onClose={() => !saving && setEditing(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit RFID assignment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} pt={1}>
            <Grid size={{ xs: 12 }}><TextField fullWidth label="Member" value={editing ? `${editing.member.fullName} (${editing.member.memberCode})` : ''} disabled /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Reference number" value={editForm.referenceNumber} onChange={(event) => setEditForm((current) => ({ ...current, referenceNumber: event.target.value }))} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Card number" value={editForm.cardNumber} onChange={(event) => setEditForm((current) => ({ ...current, cardNumber: event.target.value }))} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth type="date" label="Expiry date" InputLabelProps={{ shrink: true }} value={editForm.expiryDate} onChange={(event) => setEditForm((current) => ({ ...current, expiryDate: event.target.value }))} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><FormControl fullWidth><Select value={editForm.status} onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value as RfidStatus }))}>{statuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}</Select></FormControl></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setEditing(null)} disabled={saving}>Cancel</Button><Button variant="contained" onClick={() => void save()} disabled={saving || editForm.referenceNumber.trim().length < 3 || editForm.cardNumber.trim().length < 3 || !editForm.expiryDate}>{saving ? 'Saving…' : 'Save RFID'}</Button></DialogActions>
      </Dialog>

      <Snackbar open={Boolean(message)} autoHideDuration={3500} onClose={() => setMessage('')} message={message} />
    </>
  );
}
