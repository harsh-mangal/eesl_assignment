import { AddOutlined, EditOutlined, EventOutlined, RefreshOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { api, getApiError } from '../api/client';
import { ImageUploadField } from '../components/ImageUploadField';
import { PageHeader } from '../components/PageHeader';
import type { ApiResponse, BookingStatus, Event, EventBooking, EventStatus } from '../types/api';

const eventStatuses: EventStatus[] = ['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'];
const bookingStatuses: BookingStatus[] = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

function localDate(offsetDays = 1) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const emptyEvent = {
  title: '',
  description: '',
  category: 'Community',
  eventDate: localDate(7),
  startTime: '18:00',
  endTime: '20:00',
  venue: '',
  ticketPrice: 0,
  totalCapacity: 100,
  status: 'DRAFT' as EventStatus,
  bannerUrl: '',
};

export function EventsPage() {
  const [tab, setTab] = useState(0);
  const [events, setEvents] = useState<Event[]>([]);
  const [bookings, setBookings] = useState<EventBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [form, setForm] = useState(emptyEvent);
  const [saving, setSaving] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [eventsResponse, bookingsResponse] = await Promise.all([
        api.get<ApiResponse<{ items: Event[] }>>('/admin/events'),
        api.get<ApiResponse<{ items: EventBooking[] }>>('/admin/events/bookings/list', { params: { page: 1, limit: 200 } }),
      ]);
      setEvents(eventsResponse.data.data.items);
      setBookings(bookingsResponse.data.data.items);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const openDialog = (event?: Event) => {
    setEditing(event ?? null);
    setBannerFile(null);
    setForm(event ? {
      title: event.title,
      description: event.description,
      category: event.category,
      eventDate: event.eventDate.slice(0, 10),
      startTime: event.startTime,
      endTime: event.endTime,
      venue: event.venue,
      ticketPrice: event.ticketPrice,
      totalCapacity: event.totalCapacity,
      status: event.status,
      bannerUrl: event.bannerUrl ?? '',
    } : { ...emptyEvent, eventDate: localDate(7) });
    setDialogOpen(true);
  };

  const saveEvent = async () => {
    setSaving(true);
    setError('');
    try {
      const response = editing
        ? await api.patch<ApiResponse<Event>>(`/admin/events/${editing.id}`, form)
        : await api.post<ApiResponse<Event>>('/admin/events', form);
      const savedEvent = response.data.data;

      if (bannerFile) {
        const upload = new FormData();
        upload.append('image', bannerFile);
        await api.post(`/admin/events/${savedEvent.id}/banner`, upload, {
          timeout: 45000,
        });
      }

      setMessage(editing
        ? 'Event updated. Mobile availability now reflects the changes.'
        : 'Event created. Publish it when it is ready for member booking.');
      setDialogOpen(false);
      setBannerFile(null);
      await load();
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  const updateBookingStatus = async (booking: EventBooking, status: BookingStatus) => {
    try {
      await api.patch(`/admin/events/bookings/${booking.id}/status`, { status });
      setMessage(status === 'CANCELLED' ? 'Ticket cancelled, seats restored and successful payment marked refunded.' : 'Ticket status updated.');
      await load();
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  };

  return (
    <>
      <PageHeader
        title="Events"
        subtitle="Publish events, manage ticket capacity, review bookings and monitor check-ins."
        action={<Stack direction="row" spacing={1}><IconButton onClick={() => void load()}><RefreshOutlined /></IconButton><Button variant="contained" startIcon={<AddOutlined />} onClick={() => openDialog()}>Add event</Button></Stack>}
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tab label={`Events (${events.length})`} />
          <Tab label={`Tickets (${bookings.length})`} />
        </Tabs>
        {loading ? <Box minHeight={360} display="grid" sx={{ placeItems: 'center' }}><CircularProgress /></Box> : tab === 0 ? (
          <Box p={2.5}>
            <Grid container spacing={2}>
              {events.map((event) => {
                const sold = event.totalCapacity - event.availableSeats;
                return (
                  <Grid size={{ xs: 12, md: 6, xl: 4 }} key={event.id}>
                    <Card variant="outlined" sx={{ height: '100%', overflow: 'hidden' }}>
                      {event.bannerUrl ? <Box component="img" src={event.bannerUrl} alt={event.title} sx={{ width: '100%', height: 150, objectFit: 'cover' }} /> : null}
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" gap={1}>
                          <Box display="flex" gap={1.25} minWidth={0}>
                            <Box width={42} height={42} borderRadius={2} bgcolor="primary.50" display="grid" sx={{ placeItems: 'center', flexShrink: 0 }}><EventOutlined color="primary" /></Box>
                            <Box minWidth={0}><Typography variant="h6" fontWeight={800} noWrap>{event.title}</Typography><Typography variant="body2" color="text.secondary">{event.category} · {event.venue}</Typography></Box>
                          </Box>
                          <IconButton size="small" onClick={() => openDialog(event)}><EditOutlined fontSize="small" /></IconButton>
                        </Box>
                        <Stack direction="row" gap={1} flexWrap="wrap" mt={2}>
                          <Chip size="small" label={event.status} color={event.status === 'PUBLISHED' ? 'success' : event.status === 'CANCELLED' ? 'error' : 'default'} />
                          <Chip size="small" label={event.ticketPrice === 0 ? 'Free' : `₹${event.ticketPrice.toLocaleString('en-IN')}`} />
                          <Chip size="small" label={`${event.availableSeats} seats left`} />
                        </Stack>
                        <Typography variant="body2" mt={2} color="text.secondary">{new Date(event.eventDate).toLocaleDateString()} · {event.startTime}–{event.endTime}</Typography>
                        <Typography variant="body2" mt={1}>{event.description}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block" mt={1.5}>{sold} ticket(s) booked from {event.totalCapacity} capacity</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
              {events.length === 0 && <Grid size={{ xs: 12 }}><Box py={6} textAlign="center">No events found.</Box></Grid>}
            </Grid>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead><TableRow><TableCell>Ticket</TableCell><TableCell>Member</TableCell><TableCell>Event</TableCell><TableCell>Qty / Amount</TableCell><TableCell>Payment</TableCell><TableCell>Check-in</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id} hover>
                    <TableCell><Typography fontWeight={700}>{booking.ticketNumber}</Typography><Typography variant="caption" color="text.secondary">{booking.bookingNumber}</Typography></TableCell>
                    <TableCell><Typography fontWeight={700}>{booking.member.fullName}</Typography><Typography variant="caption" color="text.secondary">{booking.member.memberCode}</Typography></TableCell>
                    <TableCell>{booking.event.title}<br /><Typography variant="caption" color="text.secondary">{new Date(booking.event.eventDate).toLocaleDateString()} · {booking.event.startTime}</Typography></TableCell>
                    <TableCell>{booking.ticketQuantity} ticket(s)<br /><Typography variant="caption">₹{booking.amount.toLocaleString('en-IN')}</Typography></TableCell>
                    <TableCell>{booking.amount === 0 ? <Chip label="FREE" size="small" /> : <Chip label={booking.payments[0]?.status ?? 'MISSING'} size="small" color={booking.payments[0]?.status === 'SUCCESS' ? 'success' : booking.payments[0]?.status === 'REFUNDED' ? 'warning' : 'default'} />}</TableCell>
                    <TableCell>{booking.checkedInAt ? <><Chip size="small" label="CHECKED IN" color="success" /><Typography variant="caption" display="block" mt={0.5}>{new Date(booking.checkedInAt).toLocaleString()}</Typography></> : <Chip size="small" label="NOT USED" variant="outlined" />}</TableCell>
                    <TableCell><FormControl size="small" sx={{ minWidth: 135 }}><Select value={booking.status} onChange={(event) => void updateBookingStatus(booking, event.target.value as BookingStatus)}>{bookingStatuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}</Select></FormControl></TableCell>
                  </TableRow>
                ))}
                {bookings.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}>No event tickets found.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editing ? 'Edit event' : 'Add event'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Event title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <TextField label="Description" multiline minRows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}><TextField label="Category" fullWidth value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /><TextField label="Venue" fullWidth value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}><TextField label="Event date" type="date" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} /><TextField label="Start" type="time" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /><TextField label="End" type="time" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}><TextField label="Ticket price" type="number" fullWidth value={form.ticketPrice} onChange={(e) => setForm({ ...form, ticketPrice: Number(e.target.value) })} /><TextField label="Total capacity" type="number" fullWidth value={form.totalCapacity} onChange={(e) => setForm({ ...form, totalCapacity: Number(e.target.value) })} /><TextField label="Status" select fullWidth value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as EventStatus })}>{eventStatuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}</TextField></Stack>
            <ImageUploadField
              label="Event banner"
              value={form.bannerUrl}
              file={bannerFile}
              onFileChange={setBannerFile}
              onError={setError}
              aspectRatio="16 / 7"
            />
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancel</Button><Button variant="contained" disabled={saving} onClick={() => void saveEvent()}>{saving ? 'Saving…' : 'Save event'}</Button></DialogActions>
      </Dialog>
      <Snackbar open={Boolean(message)} autoHideDuration={4000} onClose={() => setMessage('')} message={message} />
    </>
  );
}
