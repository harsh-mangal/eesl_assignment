import { Ionicons } from '@expo/vector-icons';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { api, getApiError } from '../api/client';
import { Screen } from '../components/Screen';
import type { RootStackParamList } from '../navigation/types';
import type {
  ApiResponse,
  BookingStatus,
  EventBookingSummary,
  RestaurantBooking,
  RoomBooking,
  ServiceType,
} from '../types/api';
import { formatLocalDate } from '../utils/date';

type BookingDetailResult = {
  type: ServiceType;
  booking: RestaurantBooking | RoomBooking | EventBookingSummary;
};

const statusColors: Record<BookingStatus, { bg: string; text: string }> = {
  PENDING: { bg: '#FFFAEB', text: '#B54708' },
  CONFIRMED: { bg: '#ECFDF3', text: '#027A48' },
  COMPLETED: { bg: '#EFF4FF', text: '#175CD3' },
  CANCELLED: { bg: '#FEF3F2', text: '#B42318' },
};

function Row({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color="#667085" />
      <View style={{ flex: 1 }}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>
    </View>
  );
}

export function BookingDetailsScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'BookingDetails'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [data, setData] = useState<BookingDetailResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<BookingDetailResult>>(`/bookings/${route.params.type}/${route.params.bookingId}`);
      setData(response.data.data);
    } catch (error) {
      Alert.alert('Unable to load booking', getApiError(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [route.params.bookingId, route.params.type]);

  useEffect(() => { void load(); }, [load]);

  const cancel = () => {
    if (!data) return;
    Alert.alert('Cancel booking?', 'The reserved capacity or availability will be restored.', [
      { text: 'Keep booking', style: 'cancel' },
      {
        text: 'Cancel booking',
        style: 'destructive',
        onPress: async () => {
          try {
            const base = data.type === 'RESTAURANT' ? 'restaurants' : data.type === 'ROOM' ? 'rooms' : 'events';
            await api.patch(`/${base}/bookings/${data.booking.id}/cancel`);
            await load();
          } catch (error) {
            Alert.alert('Cancellation failed', getApiError(error));
          }
        },
      },
    ]);
  };

  if (loading) return <Screen><ActivityIndicator size="large" color="#175CD3" style={{ marginTop: 90 }} /></Screen>;
  if (!data) return <Screen><Text style={styles.empty}>Booking details are unavailable.</Text></Screen>;

  const booking = data.booking;
  const canCancel = booking.status === 'PENDING' || booking.status === 'CONFIRMED';
  const feedback = booking.feedback;

  let title = '';
  let bookingNumber = booking.bookingNumber;
  let qrToken: string | null = null;
  let rows: Array<{ icon: keyof typeof Ionicons.glyphMap; label: string; value: string }> = [];

  if (data.type === 'RESTAURANT') {
    const item = booking as RestaurantBooking;
    title = item.restaurant.name;
    qrToken = item.qrToken;
    rows = [
      { icon: 'calendar-outline', label: 'Reservation date', value: formatLocalDate(item.slot.bookingDate.slice(0, 10)) },
      { icon: 'time-outline', label: 'Time slot', value: `${item.slot.startTime}-${item.slot.endTime}` },
      { icon: 'people-outline', label: 'Guests', value: `${item.guestCount}` },
      { icon: 'document-text-outline', label: 'Special instructions', value: item.specialInstructions || 'None' },
    ];
  } else if (data.type === 'ROOM') {
    const item = booking as RoomBooking;
    title = `${item.room.roomName} (${item.room.roomNumber})`;
    rows = [
      { icon: 'calendar-outline', label: 'Stay dates', value: `${formatLocalDate(item.checkInDate.slice(0, 10))} - ${formatLocalDate(item.checkOutDate.slice(0, 10))}` },
      { icon: 'moon-outline', label: 'Duration', value: `${item.numberOfNights} night(s)` },
      { icon: 'people-outline', label: 'Guests', value: `${item.guestCount}` },
      { icon: 'bed-outline', label: 'Room type', value: item.room.roomType },
      { icon: 'cash-outline', label: 'Total amount', value: `₹${item.totalAmount.toLocaleString('en-IN')}` },
    ];
  } else {
    const item = booking as EventBookingSummary;
    title = item.event.title;
    bookingNumber = `${item.bookingNumber} · ${item.ticketNumber}`;
    qrToken = item.qrToken;
    rows = [
      { icon: 'calendar-outline', label: 'Event date', value: formatLocalDate(item.event.eventDate.slice(0, 10)) },
      { icon: 'time-outline', label: 'Start time', value: item.event.startTime },
      { icon: 'location-outline', label: 'Venue', value: item.event.venue },
      { icon: 'ticket-outline', label: 'Tickets', value: `${item.ticketQuantity}` },
      { icon: 'cash-outline', label: 'Amount', value: item.amount === 0 ? 'Free' : `₹${item.amount.toLocaleString('en-IN')}` },
      { icon: 'checkmark-done-outline', label: 'Check-in', value: item.checkedInAt ? new Date(item.checkedInAt).toLocaleString() : 'Not checked in' },
    ];
  }

  return (
    <Screen refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }}>
      <View style={styles.headerCard}>
        <Text style={styles.type}>{data.type}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.number}>{bookingNumber}</Text>
        <View style={[styles.status, { backgroundColor: statusColors[booking.status].bg }]}><Text style={[styles.statusText, { color: statusColors[booking.status].text }]}>{booking.status}</Text></View>
      </View>

      <View style={styles.card}>{rows.map((item) => <Row key={item.label} {...item} />)}</View>

      {qrToken && (
        <View style={styles.qrCard}>
          <QRCode value={qrToken} size={170} />
          <Text style={styles.qrTitle}>{data.type === 'EVENT' ? 'Event ticket QR' : 'Reservation QR'}</Text>
          <Text style={styles.qrHelp}>{data.type === 'EVENT' ? 'This ticket can be checked in only once.' : 'Present this code for booking verification.'}</Text>
        </View>
      )}

      {feedback ? (
        <View style={styles.feedbackDone}><Ionicons name="checkmark-circle" size={20} color="#027A48" /><Text style={styles.feedbackDoneText}>Feedback submitted · {feedback.rating}/5</Text></View>
      ) : booking.status === 'COMPLETED' ? (
        <TouchableOpacity style={styles.feedbackButton} onPress={() => navigation.navigate('Feedback', { serviceType: data.type, bookingId: booking.id, bookingNumber: booking.bookingNumber, serviceName: title })}>
          <Ionicons name="star-outline" size={19} color="#175CD3" /><Text style={styles.feedbackText}>Rate this experience</Text>
        </TouchableOpacity>
      ) : null}

      {canCancel && !(data.type === 'EVENT' && (booking as EventBookingSummary).checkedInAt) && (
        <TouchableOpacity style={styles.cancelButton} onPress={cancel}><Text style={styles.cancelText}>Cancel booking</Text></TouchableOpacity>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { marginTop: 80, textAlign: 'center', color: '#667085' },
  headerCard: { backgroundColor: '#175CD3', borderRadius: 22, padding: 22, marginTop: 4 },
  type: { color: '#D1E0FF', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginTop: 7 },
  number: { color: '#D1E0FF', marginTop: 5, fontWeight: '700' },
  status: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginTop: 15 },
  statusText: { fontSize: 11, fontWeight: '900' },
  card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAECF0', borderRadius: 20, paddingHorizontal: 16, marginTop: 16 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#EAECF0' },
  rowLabel: { color: '#667085', fontSize: 11, fontWeight: '700' },
  rowValue: { color: '#101828', fontSize: 14, fontWeight: '800', marginTop: 2 },
  qrCard: { marginTop: 16, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#EAECF0', padding: 22, alignItems: 'center' },
  qrTitle: { color: '#101828', fontSize: 16, fontWeight: '900', marginTop: 14 },
  qrHelp: { color: '#667085', fontSize: 12, textAlign: 'center', marginTop: 4 },
  feedbackButton: { marginTop: 16, borderWidth: 1, borderColor: '#B2CCFF', backgroundColor: '#F5F8FF', borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  feedbackText: { color: '#175CD3', fontWeight: '900' },
  feedbackDone: { marginTop: 16, backgroundColor: '#ECFDF3', borderRadius: 14, padding: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  feedbackDoneText: { color: '#027A48', fontWeight: '900' },
  cancelButton: { marginTop: 14, borderWidth: 1, borderColor: '#FDA29B', borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  cancelText: { color: '#B42318', fontWeight: '900' },
});
