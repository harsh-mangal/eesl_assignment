import { AddOutlined, EditOutlined, HotelOutlined, RefreshOutlined } from '@mui/icons-material';
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
import type { ApiResponse, BookingStatus, Room, RoomBooking, RoomStatus } from '../types/api';

const roomStatuses: RoomStatus[] = ['AVAILABLE', 'UNAVAILABLE', 'MAINTENANCE'];
const bookingStatuses: BookingStatus[] = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
const emptyRoom = {
  roomNumber: '',
  roomName: '',
  roomType: 'Deluxe',
  pricePerNight: 5000,
  guestCapacity: 2,
  amenities: 'Wi-Fi, Breakfast, Air conditioning',
  status: 'AVAILABLE' as RoomStatus,
  imageUrl: '',
};

export function RoomsPage() {
  const [tab, setTab] = useState(0);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState(emptyRoom);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [roomResponse, bookingResponse] = await Promise.all([
        api.get<ApiResponse<{ items: Room[] }>>('/admin/rooms'),
        api.get<ApiResponse<{ items: RoomBooking[] }>>('/admin/rooms/bookings/list', {
          params: { page: 1, limit: 100 },
        }),
      ]);
      setRooms(roomResponse.data.data.items);
      setBookings(bookingResponse.data.data.items);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const openDialog = (room?: Room) => {
    setEditing(room ?? null);
    setImageFile(null);
    setForm(
      room
        ? {
            roomNumber: room.roomNumber,
            roomName: room.roomName,
            roomType: room.roomType,
            pricePerNight: room.pricePerNight,
            guestCapacity: room.guestCapacity,
            amenities: room.amenities.join(', '),
            status: room.status,
            imageUrl: room.imageUrl ?? '',
          }
        : emptyRoom,
    );
    setDialogOpen(true);
  };

  const saveRoom = async () => {
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      amenities: form.amenities.split(',').map((item) => item.trim()).filter(Boolean),
    };
    try {
      const response = editing
        ? await api.patch<ApiResponse<Room>>(`/admin/rooms/${editing.id}`, payload)
        : await api.post<ApiResponse<Room>>('/admin/rooms', payload);
      const savedRoom = response.data.data;

      if (imageFile) {
        const upload = new FormData();
        upload.append('image', imageFile);
        await api.post(`/admin/rooms/${savedRoom.id}/image`, upload, {
          timeout: 45000,
        });
      }

      setMessage(editing
        ? 'Room updated. Availability searches will use the new state.'
        : 'Room created.');
      setDialogOpen(false);
      setImageFile(null);
      await load();
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  const updateBookingStatus = async (booking: RoomBooking, status: BookingStatus) => {
    try {
      await api.patch(`/admin/rooms/bookings/${booking.id}/status`, { status });
      setMessage(status === 'CANCELLED' ? 'Booking cancelled; the dates are available again.' : 'Booking status updated.');
      await load();
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  };

  return (
    <>
      <PageHeader
        title="Rooms"
        subtitle="Manage inventory, availability states, prices, amenities and date-range bookings."
        action={
          <Stack direction="row" spacing={1}>
            <IconButton onClick={() => void load()}><RefreshOutlined /></IconButton>
            <Button variant="contained" startIcon={<AddOutlined />} onClick={() => openDialog()}>Add room</Button>
          </Stack>
        }
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tab label={`Rooms (${rooms.length})`} />
          <Tab label={`Bookings (${bookings.length})`} />
        </Tabs>
        {loading ? (
          <Box minHeight={360} display="grid" sx={{ placeItems: 'center' }}><CircularProgress /></Box>
        ) : tab === 0 ? (
          <Box p={2.5}>
            <Grid container spacing={2}>
              {rooms.map((room) => (
                <Grid size={{ xs: 12, md: 6, xl: 4 }} key={room.id}>
                  <Card variant="outlined" sx={{ height: '100%', overflow: 'hidden' }}>
                    {room.imageUrl ? <Box component="img" src={room.imageUrl} alt={room.roomName} sx={{ width: '100%', height: 150, objectFit: 'cover' }} /> : null}
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" gap={1}>
                        <Box display="flex" gap={1.25}>
                          <Box width={42} height={42} borderRadius={2} bgcolor="primary.50" display="grid" sx={{ placeItems: 'center' }}><HotelOutlined color="primary" /></Box>
                          <Box>
                            <Typography variant="h6" fontWeight={800}>{room.roomName}</Typography>
                            <Typography variant="body2" color="text.secondary">Room {room.roomNumber} · {room.roomType}</Typography>
                          </Box>
                        </Box>
                        <IconButton size="small" onClick={() => openDialog(room)}><EditOutlined fontSize="small" /></IconButton>
                      </Box>
                      <Stack direction="row" gap={1} flexWrap="wrap" mt={2}>
                        <Chip size="small" label={room.status} color={room.status === 'AVAILABLE' ? 'success' : room.status === 'MAINTENANCE' ? 'warning' : 'default'} />
                        <Chip size="small" label={`₹${room.pricePerNight.toLocaleString('en-IN')}/night`} />
                        <Chip size="small" label={`${room.guestCapacity} guests`} />
                      </Stack>
                      <Typography variant="body2" mt={2} color="text.secondary">{room.amenities.join(' · ')}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block" mt={1.5}>
                        {room.bookings?.length ? `${room.bookings.length} upcoming booked range(s)` : 'No upcoming active booking'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {rooms.length === 0 && <Grid size={{ xs: 12 }}><Box py={6} textAlign="center">No rooms found.</Box></Grid>}
            </Grid>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead><TableRow><TableCell>Booking</TableCell><TableCell>Member</TableCell><TableCell>Room</TableCell><TableCell>Stay</TableCell><TableCell>Guests</TableCell><TableCell>Total</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id} hover>
                    <TableCell><Typography fontWeight={700}>{booking.bookingNumber}</Typography></TableCell>
                    <TableCell><Typography fontWeight={700}>{booking.member.fullName}</Typography><Typography variant="caption" color="text.secondary">{booking.member.memberCode}</Typography></TableCell>
                    <TableCell>{booking.room.roomName}<br /><Typography variant="caption" color="text.secondary">Room {booking.room.roomNumber}</Typography></TableCell>
                    <TableCell>{new Date(booking.checkInDate).toLocaleDateString()} → {new Date(booking.checkOutDate).toLocaleDateString()}<br /><Typography variant="caption">{booking.numberOfNights} night(s)</Typography></TableCell>
                    <TableCell>{booking.guestCount}</TableCell>
                    <TableCell>₹{booking.totalAmount.toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 135 }}>
                        <Select value={booking.status} onChange={(event) => void updateBookingStatus(booking, event.target.value as BookingStatus)}>
                          {bookingStatuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                ))}
                {bookings.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}>No room bookings found.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit room' : 'Add room'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Room number" fullWidth value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} />
              <TextField label="Room name" fullWidth value={form.roomName} onChange={(e) => setForm({ ...form, roomName: e.target.value })} />
            </Stack>
            <TextField label="Room type" value={form.roomType} onChange={(e) => setForm({ ...form, roomType: e.target.value })} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField type="number" label="Price per night" fullWidth value={form.pricePerNight} onChange={(e) => setForm({ ...form, pricePerNight: Number(e.target.value) })} />
              <TextField type="number" label="Guest capacity" fullWidth value={form.guestCapacity} onChange={(e) => setForm({ ...form, guestCapacity: Number(e.target.value) })} />
            </Stack>
            <TextField label="Amenities (comma separated)" multiline minRows={2} value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} />
            <FormControl fullWidth>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as RoomStatus })}>
                {roomStatuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
              </Select>
            </FormControl>
            <ImageUploadField
              label="Room image"
              value={form.imageUrl}
              file={imageFile}
              onFileChange={setImageFile}
              onError={setError}
              aspectRatio="16 / 9"
            />
            {editing?.bookings?.length ? <Alert severity="warning">This room has upcoming bookings. It cannot be marked unavailable or under maintenance until they are cancelled or completed.</Alert> : null}
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancel</Button><Button variant="contained" disabled={saving} onClick={() => void saveRoom()}>{saving ? 'Saving…' : 'Save room'}</Button></DialogActions>
      </Dialog>
      <Snackbar open={Boolean(message)} autoHideDuration={4001} onClose={() => setMessage('')} message={message} />
    </>
  );
}
