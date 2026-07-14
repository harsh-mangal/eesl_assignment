import { SearchOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  FormControl,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { api, getApiError } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import type { ApiResponse, RfidRecord } from '../types/api';

const statuses = ['ACTIVE', 'INACTIVE', 'BLOCKED', 'EXPIRED'] as const;
type RfidStatus = (typeof statuses)[number];

type RfidListResponse = { items: RfidRecord[] };

export function RfidPage() {
  const [records, setRecords] = useState<RfidRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<ApiResponse<RfidListResponse>>('/admin/rfid', {
        params: { search: search || undefined, page: 1, limit: 50 },
      });
      setRecords(response.data.data.items);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 300);
    return () => window.clearTimeout(timer);
  }, [load]);

  const updateStatus = async (record: RfidRecord, status: RfidStatus) => {
    try {
      const response = await api.patch<ApiResponse<RfidRecord>>(`/admin/rfid/${record.id}`, { status });
      setRecords((current) => current.map((item) => (item.id === record.id ? response.data.data : item)));
      setMessage('RFID status updated. Mobile clients will receive the new status on refresh.');
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  };

  return (
    <>
      <PageHeader title="RFID Records" subtitle="Activate, deactivate, block and review mock RFID cards." />
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box p={2} borderBottom="1px solid" borderColor="divider">
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search member, RFID reference or card number"
            size="small"
            fullWidth
            sx={{ maxWidth: 520 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined /></InputAdornment> }}
          />
        </Box>
        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
        {loading ? (
          <Box minHeight={260} display="grid" sx={{ placeItems: 'center' }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Member</TableCell>
                  <TableCell>RFID Reference</TableCell>
                  <TableCell>Card Number</TableCell>
                  <TableCell>Expiry</TableCell>
                  <TableCell>Verification</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell>
                      <Typography fontWeight={700}>{record.member.fullName}</Typography>
                      <Typography variant="caption" color="text.secondary">{record.member.memberCode}</Typography>
                    </TableCell>
                    <TableCell>{record.referenceNumber}</TableCell>
                    <TableCell>{record.cardNumber}</TableCell>
                    <TableCell>{new Date(record.expiryDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={record.lastVerificationResult ?? 'Not verified'}
                        color={record.lastVerificationResult === 'VALID' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 130 }}>
                        <Select
                          value={record.status}
                          onChange={(event) => void updateStatus(record, event.target.value as RfidStatus)}
                        >
                          {statuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      <Snackbar open={Boolean(message)} autoHideDuration={3500} onClose={() => setMessage('')} message={message} />
    </>
  );
}
