import {
  CalendarMonthOutlined,
  CancelOutlined,
  CheckCircleOutline,
  EventAvailableOutlined,
  SearchOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Dialog,
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
import { VisibilityOutlined } from '@mui/icons-material';
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api, getApiError } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import type {
  AdminBooking,
  AdminBookingListResult,
  AdminBookingType,
  ApiResponse,
  BookingStatus,
} from '../types/api';

const statuses: Array<BookingStatus | 'ALL'> = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
const types: Array<AdminBookingType | 'ALL'> = ['ALL', 'RESTAURANT', 'ROOM', 'EVENT'];

const statusColor = (status: BookingStatus) => {
  if (status === 'COMPLETED') return 'info';
  if (status === 'CONFIRMED') return 'success';
  if (status === 'CANCELLED') return 'error';
  return 'warning';
};

function DetailLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '150px 1fr' }} gap={1} py={1} borderBottom="1px solid" borderColor="divider">
      <Typography color="text.secondary" variant="body2">{label}</Typography>
      <Typography fontWeight={700} variant="body2">{value || '—'}</Typography>
    </Box>
  );
}

export function BookingsPage() {
  const [data, setData] = useState<AdminBookingListResult | null>(null);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<AdminBookingType | 'ALL'>('ALL');
  const [status, setStatus] = useState<BookingStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState<AdminBooking | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<ApiResponse<AdminBookingListResult>>('/admin/bookings', {
        params: {
          search: search || undefined,
          type: type === 'ALL' ? undefined : type,
          status: status === 'ALL' ? undefined : status,
          page: 1,
          limit: 100,
        },
      });
      setData(response.data.data);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, [search, status, type]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  const updateStatus = async (booking: AdminBooking, nextStatus: BookingStatus) => {
    setUpdatingId(booking.id);
    setError('');
    try {
      await api.patch(`/admin/bookings/${booking.type}/${booking.id}/status`, { status: nextStatus });
      setMessage(`${booking.bookingNumber} updated to ${nextStatus}.`);
      await load();
      if (selected?.id === booking.id) setSelected(null);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setUpdatingId(null);
    }
  };

  const summary = data?.summary ?? { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };

  return (
    <>
      <PageHeader title="Booking Management" subtitle="Search, filter, review and update restaurant, room and event bookings from one place." />

      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatCard label="All bookings" value={summary.total} icon={<CalendarMonthOutlined />} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatCard label="Confirmed" value={summary.confirmed} icon={<EventAvailableOutlined />} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatCard label="Completed" value={summary.completed} icon={<CheckCircleOutline />} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatCard label="Cancelled" value={summary.cancelled} icon={<CancelOutlined />} /></Grid>
      </Grid>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} p={2} borderBottom="1px solid" borderColor="divider">
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Booking number, ticket or member"
            size="small"
            fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <Select value={type} onChange={(event) => setType(event.target.value as AdminBookingType | 'ALL')}>
              {types.map((item) => <MenuItem key={item} value={item}>{item === 'ALL' ? 'All services' : item}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <Select value={status} onChange={(event) => setStatus(event.target.value as BookingStatus | 'ALL')}>
              {statuses.map((item) => <MenuItem key={item} value={item}>{item === 'ALL' ? 'All statuses' : item}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>

        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
        {loading ? (
          <Box minHeight={280} display="grid" sx={{ placeItems: 'center' }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Booking</TableCell>
                  <TableCell>Member</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data?.items ?? []).map((booking) => (
                  <TableRow key={`${booking.type}-${booking.id}`} hover>
                    <TableCell>
                      <Typography fontWeight={800}>{booking.bookingNumber}</Typography>
                      <Typography variant="caption" color="text.secondary">{booking.type}{booking.ticketNumber ? ` · ${booking.ticketNumber}` : ''}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={700}>{booking.member.fullName}</Typography>
                      <Typography variant="caption" color="text.secondary">{booking.member.memberCode}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={700}>{booking.serviceName}</Typography>
                      <Typography variant="caption" color="text.secondary">{booking.detail}</Typography>
                    </TableCell>
                    <TableCell>{new Date(booking.serviceDate).toLocaleDateString()}</TableCell>
                    <TableCell>{booking.amount == null ? '—' : `₹${booking.amount.toLocaleString('en-IN')}`}</TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 135 }} disabled={updatingId === booking.id}>
                        <Select
                          value={booking.status}
                          onChange={(event) => void updateStatus(booking, event.target.value as BookingStatus)}
                          renderValue={(value) => <Chip size="small" label={value} color={statusColor(value) as 'success' | 'error' | 'warning' | 'info'} />}
                        >
                          {(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as BookingStatus[]).map((item) => (
                            <MenuItem key={item} value={item}>{item}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View booking details"><IconButton onClick={() => setSelected(booking)}><VisibilityOutlined /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {(data?.items.length ?? 0) === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 7 }}>No matching bookings.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="sm">
        <DialogTitle>Booking details</DialogTitle>
        <DialogContent>
          {selected && (
            <Box pt={1}>
              <DetailLine label="Booking number" value={selected.bookingNumber} />
              <DetailLine label="Ticket number" value={selected.ticketNumber} />
              <DetailLine label="Service type" value={selected.type} />
              <DetailLine label="Service" value={selected.serviceName} />
              <DetailLine label="Member" value={`${selected.member.fullName} (${selected.member.memberCode})`} />
              <DetailLine label="Member email" value={selected.member.email} />
              <DetailLine label="Service date" value={new Date(selected.serviceDate).toLocaleString()} />
              <DetailLine label="Details" value={selected.detail} />
              <DetailLine label="Amount" value={selected.amount == null ? 'Not applicable' : `₹${selected.amount.toLocaleString('en-IN')}`} />
              <DetailLine label="Status" value={<Chip size="small" label={selected.status} color={statusColor(selected.status) as 'success' | 'error' | 'warning' | 'info'} />} />
              <DetailLine label="Created" value={new Date(selected.createdAt).toLocaleString()} />
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar open={Boolean(message)} autoHideDuration={3500} onClose={() => setMessage('')} message={message} />
    </>
  );
}
