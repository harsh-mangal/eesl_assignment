import { RefreshOutlined, SearchOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
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
import type { ApiResponse, Member, Payment, PaymentStatus, PaymentType } from '../types/api';

export function PaymentsPage() {
  const [items, setItems] = useState<Payment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<PaymentStatus | ''>('');
  const [type, setType] = useState<PaymentType | ''>('');
  const [memberId, setMemberId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<ApiResponse<{ items: Member[] }>>('/admin/members', { params: { page: 1, limit: 100 } })
      .then((response) => setMembers(response.data.data.items))
      .catch((requestError) => setError(getApiError(requestError)));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<ApiResponse<{ items: Payment[]; totalAmount: number }>>('/admin/payments', {
        params: {
          search: search || undefined,
          status: status || undefined,
          paymentType: type || undefined,
          memberId: memberId || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          page: 1,
          limit: 200,
        },
      });
      setItems(response.data.data.items);
      setTotalAmount(response.data.data.totalAmount);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, memberId, search, status, type]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timeout);
  }, [load]);

  return (
    <>
      <PageHeader
        title="Payments"
        subtitle="Review invoice and booking transactions by date, member, method, type and status."
        action={<IconButton onClick={() => void load()}><RefreshOutlined /></IconButton>}
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Stack direction={{ xs: 'column', xl: 'row' }} spacing={1.25} mb={2} flexWrap="wrap" useFlexGap>
        <TextField
          size="small"
          placeholder="Search transaction or member"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ minWidth: 260 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> } }}
        />
        <TextField select size="small" label="Member" value={memberId} onChange={(event) => setMemberId(event.target.value)} sx={{ minWidth: 210 }}>
          <MenuItem value="">All members</MenuItem>
          {members.map((member) => <MenuItem key={member.id} value={member.id}>{member.fullName} · {member.memberCode}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Status" value={status} onChange={(event) => setStatus(event.target.value as PaymentStatus | '')} sx={{ minWidth: 145 }}>
          <MenuItem value="">All</MenuItem>
          {(['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'] as PaymentStatus[]).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Type" value={type} onChange={(event) => setType(event.target.value as PaymentType | '')} sx={{ minWidth: 180 }}>
          <MenuItem value="">All</MenuItem>
          {(['INVOICE', 'ROOM_BOOKING', 'EVENT_BOOKING'] as PaymentType[]).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
        </TextField>
        <TextField size="small" label="From" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField size="small" label="To" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: dateFrom || undefined } }} />
        <Box ml={{ xl: 'auto' }} bgcolor="#101828" color="white" px={2.5} py={1.1} borderRadius={2} minWidth={160}>
          <Typography variant="caption" color="#98A2B3">FILTERED TOTAL</Typography>
          <Typography fontWeight={900}>₹{totalAmount.toLocaleString('en-IN')}</Typography>
        </Box>
      </Stack>
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {loading ? (
          <Box minHeight={320} display="grid" sx={{ placeItems: 'center' }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead><TableRow><TableCell>Transaction</TableCell><TableCell>Member</TableCell><TableCell>Related record</TableCell><TableCell>Amount</TableCell><TableCell>Method</TableCell><TableCell>Status</TableCell><TableCell>Date</TableCell></TableRow></TableHead>
              <TableBody>
                {items.map((payment) => {
                  const related = payment.eventBooking
                    ? `${payment.eventBooking.event.title} · ${payment.eventBooking.ticketNumber}`
                    : payment.invoice
                      ? `${payment.invoice.invoiceNumber} · ${payment.invoice.description}`
                      : payment.roomBooking
                        ? payment.roomBooking.bookingNumber
                        : '—';
                  return (
                    <TableRow key={payment.id} hover>
                      <TableCell><Typography fontWeight={700}>{payment.transactionId}</Typography><Typography variant="caption" color="text.secondary">{payment.paymentType}</Typography></TableCell>
                      <TableCell><Typography fontWeight={700}>{payment.member.fullName}</Typography><Typography variant="caption" color="text.secondary">{payment.member.memberCode}</Typography></TableCell>
                      <TableCell>{related}</TableCell>
                      <TableCell>₹{payment.amount.toLocaleString('en-IN')}</TableCell>
                      <TableCell>{payment.paymentMethod}</TableCell>
                      <TableCell><Chip size="small" label={payment.status} color={payment.status === 'SUCCESS' ? 'success' : payment.status === 'REFUNDED' ? 'warning' : payment.status === 'FAILED' ? 'error' : 'default'} /></TableCell>
                      <TableCell>{new Date(payment.paidAt).toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
                {items.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}>No payments match the current filters.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </>
  );
}
