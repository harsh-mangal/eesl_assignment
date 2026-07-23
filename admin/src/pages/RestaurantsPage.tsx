import {
  AddOutlined,
  EditOutlined,
  EventSeatOutlined,
  RefreshOutlined,
  RestaurantOutlined,
} from '@mui/icons-material';
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
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, getApiError } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import type {
  ApiResponse,
  BookingStatus,
  Restaurant,
  RestaurantBooking,
  RestaurantSlot,
} from '../types/api';

const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
const statusOptions: BookingStatus[] = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
const emptyRestaurant = {
  name: '',
  description: '',
  openingTime: '12:00',
  closingTime: '23:00',
  isActive: true,
  imageUrl: '',
};
const emptySlot = {
  bookingDate: today,
  startTime: '19:00',
  endTime: '20:30',
  capacity: 20,
  isAvailable: true,
};

export function RestaurantsPage() {
  const [tab, setTab] = useState(0);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [bookings, setBookings] = useState<RestaurantBooking[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [restaurantDialog, setRestaurantDialog] = useState(false);
  const [slotDialog, setSlotDialog] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [editingSlot, setEditingSlot] = useState<RestaurantSlot | null>(null);
  const [restaurantForm, setRestaurantForm] = useState(emptyRestaurant);
  const [slotForm, setSlotForm] = useState(emptySlot);
  const [saving, setSaving] = useState(false);

  const selectedRestaurant = useMemo(
    () => restaurants.find((item) => item.id === selectedRestaurantId) ?? restaurants[0],
    [restaurants, selectedRestaurantId],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [restaurantResponse, bookingResponse] = await Promise.all([
        api.get<ApiResponse<{ items: Restaurant[] }>>('/admin/restaurants'),
        api.get<ApiResponse<{ items: RestaurantBooking[] }>>('/admin/restaurants/bookings/list', {
          params: { page: 1, limit: 100 },
        }),
      ]);
      setRestaurants(restaurantResponse.data.data.items);
      setBookings(bookingResponse.data.data.items);
      setSelectedRestaurantId((current) => current || restaurantResponse.data.data.items[0]?.id || '');
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const openRestaurantDialog = (restaurant?: Restaurant) => {
    setEditingRestaurant(restaurant ?? null);
    setRestaurantForm(
      restaurant
        ? {
            name: restaurant.name,
            description: restaurant.description,
            openingTime: restaurant.openingTime,
            closingTime: restaurant.closingTime,
            isActive: restaurant.isActive,
            imageUrl: restaurant.imageUrl ?? '',
          }
        : emptyRestaurant,
    );
    setRestaurantDialog(true);
  };

  const saveRestaurant = async () => {
    setSaving(true);
    setError('');
    try {
      if (editingRestaurant) {
        await api.patch(`/admin/restaurants/${editingRestaurant.id}`, restaurantForm);
        setMessage('Restaurant updated. Mobile availability will reflect the change on refresh.');
      } else {
        await api.post('/admin/restaurants', restaurantForm);
        setMessage('Restaurant created.');
      }
      setRestaurantDialog(false);
      await load();
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  const openSlotDialog = (slot?: RestaurantSlot) => {
    setEditingSlot(slot ?? null);
    setSlotForm(
      slot
        ? {
            bookingDate: slot.bookingDate.slice(0, 10),
            startTime: slot.startTime,
            endTime: slot.endTime,
            capacity: slot.capacity,
            isAvailable: slot.isAvailable,
          }
        : emptySlot,
    );
    setSlotDialog(true);
  };

  const saveSlot = async () => {
    if (!selectedRestaurant) return;
    setSaving(true);
    setError('');
    try {
      if (editingSlot) {
        await api.patch(`/admin/restaurants/slots/${editingSlot.id}`, slotForm);
        setMessage('Restaurant slot updated.');
      } else {
        await api.post(`/admin/restaurants/${selectedRestaurant.id}/slots`, slotForm);
        setMessage('Restaurant slot created.');
      }
      setSlotDialog(false);
      await load();
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  const updateBookingStatus = async (booking: RestaurantBooking, status: BookingStatus) => {
    try {
      await api.patch(`/admin/restaurants/bookings/${booking.id}/status`, { status });
      setMessage(status === 'CANCELLED' ? 'Booking cancelled and slot capacity restored.' : 'Booking status updated.');
      await load();
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  };

  return (
    <>
      <PageHeader
        title="Restaurants"
        subtitle="Manage restaurants, date-based slots, capacity and member reservations."
        action={
          <Stack direction="row" spacing={1}>
            <IconButton onClick={() => void load()}><RefreshOutlined /></IconButton>
            <Button variant="contained" startIcon={<AddOutlined />} onClick={() => openRestaurantDialog()}>
              Add restaurant
            </Button>
          </Stack>
        }
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tab label="Restaurants & slots" />
          <Tab label={`Reservations (${bookings.length})`} />
        </Tabs>
        {loading ? (
          <Box minHeight={360} display="grid" sx={{ placeItems: 'center' }}><CircularProgress /></Box>
        ) : tab === 0 ? (
          <Box p={2.5}>
            <Grid container spacing={2}>
              {restaurants.map((restaurant) => (
                <Grid size={{ xs: 12, md: 6, xl: 4 }} key={restaurant.id}>
                  <Card
                    variant="outlined"
                    onClick={() => setSelectedRestaurantId(restaurant.id)}
                    sx={{
                      height: '100%', cursor: 'pointer', borderWidth: selectedRestaurant?.id === restaurant.id ? 2 : 1,
                      borderColor: selectedRestaurant?.id === restaurant.id ? 'primary.main' : 'divider',
                    }}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" gap={1}>
                        <Box>
                          <Typography variant="h6" fontWeight={800}>{restaurant.name}</Typography>
                          <Typography variant="body2" color="text.secondary" mt={0.5}>{restaurant.description}</Typography>
                        </Box>
                        <IconButton size="small" onClick={(event) => { event.stopPropagation(); openRestaurantDialog(restaurant); }}>
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Box>
                      <Stack direction="row" gap={1} flexWrap="wrap" mt={2}>
                        <Chip size="small" color={restaurant.isActive ? 'success' : 'default'} label={restaurant.isActive ? 'Active' : 'Inactive'} />
                        <Chip size="small" icon={<RestaurantOutlined />} label={`${restaurant.openingTime}–${restaurant.closingTime}`} />
                        <Chip size="small" icon={<EventSeatOutlined />} label={`${restaurant.slots.length} upcoming slots`} />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {selectedRestaurant && (
              <Box mt={3}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Box>
                    <Typography variant="h6" fontWeight={800}>{selectedRestaurant.name} slots</Typography>
                    <Typography variant="body2" color="text.secondary">Capacity changes are immediately used by the booking API.</Typography>
                  </Box>
                  <Button startIcon={<AddOutlined />} onClick={() => openSlotDialog()}>Add slot</Button>
                </Box>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Time</TableCell><TableCell>Capacity</TableCell><TableCell>Booked</TableCell><TableCell>Remaining</TableCell><TableCell>Status</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead>
                    <TableBody>
                      {selectedRestaurant.slots.map((slot) => (
                        <TableRow key={slot.id} hover>
                          <TableCell>{new Date(slot.bookingDate).toLocaleDateString()}</TableCell>
                          <TableCell>{slot.startTime}–{slot.endTime}</TableCell>
                          <TableCell>{slot.capacity}</TableCell>
                          <TableCell>{slot.bookedCapacity}</TableCell>
                          <TableCell><Typography fontWeight={800}>{slot.availableCapacity}</Typography></TableCell>
                          <TableCell><Chip size="small" label={slot.isAvailable ? 'Available' : 'Closed'} color={slot.isAvailable ? 'success' : 'default'} /></TableCell>
                          <TableCell align="right"><IconButton size="small" onClick={() => openSlotDialog(slot)}><EditOutlined fontSize="small" /></IconButton></TableCell>
                        </TableRow>
                      ))}
                      {selectedRestaurant.slots.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>No upcoming slots. Add the first slot.</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead><TableRow><TableCell>Booking</TableCell><TableCell>Member</TableCell><TableCell>Restaurant</TableCell><TableCell>Date & time</TableCell><TableCell>Guests</TableCell><TableCell>Instructions</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id} hover>
                    <TableCell><Typography fontWeight={700}>{booking.bookingNumber}</Typography></TableCell>
                    <TableCell><Typography fontWeight={700}>{booking.member.fullName}</Typography><Typography variant="caption" color="text.secondary">{booking.member.memberCode}</Typography></TableCell>
                    <TableCell>{booking.restaurant.name}</TableCell>
                    <TableCell>{new Date(booking.slot.bookingDate).toLocaleDateString()}<br />{booking.slot.startTime}–{booking.slot.endTime}</TableCell>
                    <TableCell>{booking.guestCount}</TableCell>
                    <TableCell sx={{ maxWidth: 240 }}>{booking.specialInstructions || '—'}</TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 135 }}>
                        <Select value={booking.status} onChange={(event) => void updateBookingStatus(booking, event.target.value as BookingStatus)}>
                          {statusOptions.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                ))}
                {bookings.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}>No restaurant reservations found.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={restaurantDialog} onClose={() => setRestaurantDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingRestaurant ? 'Edit restaurant' : 'Add restaurant'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Restaurant name" value={restaurantForm.name} onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })} required />
            <TextField label="Description" multiline minRows={3} value={restaurantForm.description} onChange={(e) => setRestaurantForm({ ...restaurantForm, description: e.target.value })} required />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Opening time" type="time" fullWidth value={restaurantForm.openingTime} onChange={(e) => setRestaurantForm({ ...restaurantForm, openingTime: e.target.value })} InputLabelProps={{ shrink: true }} />
              <TextField label="Closing time" type="time" fullWidth value={restaurantForm.closingTime} onChange={(e) => setRestaurantForm({ ...restaurantForm, closingTime: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Stack>
            <TextField label="Image URL" value={restaurantForm.imageUrl} onChange={(e) => setRestaurantForm({ ...restaurantForm, imageUrl: e.target.value })} />
            <FormControlLabel control={<Switch checked={restaurantForm.isActive} onChange={(e) => setRestaurantForm({ ...restaurantForm, isActive: e.target.checked })} />} label="Active and bookable" />
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setRestaurantDialog(false)}>Cancel</Button><Button variant="contained" disabled={saving} onClick={() => void saveRestaurant()}>{saving ? 'Saving…' : 'Save'}</Button></DialogActions>
      </Dialog>

      <Dialog open={slotDialog} onClose={() => setSlotDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingSlot ? 'Edit booking slot' : `Add slot · ${selectedRestaurant?.name ?? ''}`}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField type="date" label="Booking date" value={slotForm.bookingDate} onChange={(e) => setSlotForm({ ...slotForm, bookingDate: e.target.value })} InputLabelProps={{ shrink: true }} inputProps={{ min: today }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField type="time" label="Start time" fullWidth value={slotForm.startTime} onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })} InputLabelProps={{ shrink: true }} />
              <TextField type="time" label="End time" fullWidth value={slotForm.endTime} onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Stack>
            <TextField type="number" label="Capacity" value={slotForm.capacity} onChange={(e) => setSlotForm({ ...slotForm, capacity: Number(e.target.value) })} inputProps={{ min: editingSlot?.bookedCapacity ?? 1 }} />
            {editingSlot && <Alert severity="info">Currently booked: {editingSlot.bookedCapacity}. Capacity cannot be reduced below this value.</Alert>}
            <FormControlLabel control={<Switch checked={slotForm.isAvailable} onChange={(e) => setSlotForm({ ...slotForm, isAvailable: e.target.checked })} />} label="Available for booking" />
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setSlotDialog(false)}>Cancel</Button><Button variant="contained" disabled={saving} onClick={() => void saveSlot()}>{saving ? 'Saving…' : 'Save slot'}</Button></DialogActions>
      </Dialog>
      <Snackbar open={Boolean(message)} autoHideDuration={4000} onClose={() => setMessage('')} message={message} />
    </>
  );
}
