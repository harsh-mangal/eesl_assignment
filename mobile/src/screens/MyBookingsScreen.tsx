import { Ionicons } from '@expo/vector-icons';
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
import type { ApiResponse, BookingStatus, MyBookings } from '../types/api';
import { formatLocalDate } from '../utils/date';

type Tab = 'restaurant' | 'room' | 'event';

const statusStyle: Record<BookingStatus, { backgroundColor: string; color: string }> = {
  PENDING: { backgroundColor: '#FFFAEB', color: '#B54708' },
  CONFIRMED: { backgroundColor: '#ECFDF3', color: '#027A48' },
  COMPLETED: { backgroundColor: '#EFF4FF', color: '#175CD3' },
  CANCELLED: { backgroundColor: '#FEF3F2', color: '#B42318' },
};

export function MyBookingsScreen() {
  const [tab, setTab] = useState<Tab>('restaurant');
  const [data, setData] = useState<MyBookings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<MyBookings>>('/bookings');
      setData(response.data.data);
    } catch (error) {
      Alert.alert('Unable to load bookings', getApiError(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const cancel = (type: 'restaurant' | 'room', id: string) => {
    Alert.alert('Cancel booking?', 'Availability will be restored after cancellation.', [
      { text: 'Keep booking', style: 'cancel' },
      {
        text: 'Cancel booking',
        style: 'destructive',
        onPress: async () => {
          try {
            const endpoint = type === 'restaurant' ? `/restaurants/bookings/${id}/cancel` : `/rooms/bookings/${id}/cancel`;
            await api.patch(endpoint);
            await load();
          } catch (error) {
            Alert.alert('Cancellation failed', getApiError(error));
          }
        },
      },
    ]);
  };

  const canCancel = (status: BookingStatus) => status === 'PENDING' || status === 'CONFIRMED';
  const currentCount = data?.[tab].length ?? 0;

  return (
    <Screen refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }}>
      <Text style={styles.title}>My bookings</Text>
      <Text style={styles.subtitle}>Review service history, QR confirmations and eligible cancellations.</Text>
      <View style={styles.tabs}>
        {(['restaurant', 'room', 'event'] as Tab[]).map((item) => (
          <TouchableOpacity key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.activeTab]}>
            <Text style={[styles.tabText, tab === item && styles.activeTabText]}>{item[0].toUpperCase() + item.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#175CD3" style={{ marginTop: 60 }} />
      ) : currentCount === 0 ? (
        <View style={styles.empty}><Ionicons name="calendar-outline" size={36} color="#98A2B3" /><Text style={styles.emptyTitle}>No {tab} bookings</Text><Text style={styles.emptyText}>Your future and previous bookings will appear here.</Text></View>
      ) : tab === 'restaurant' ? (
        data!.restaurant.map((booking) => (
          <View key={booking.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}><Text style={styles.service}>{booking.restaurant.name}</Text><Text style={styles.number}>{booking.bookingNumber}</Text></View>
              <View style={[styles.status, { backgroundColor: statusStyle[booking.status].backgroundColor }]}><Text style={[styles.statusText, { color: statusStyle[booking.status].color }]}>{booking.status}</Text></View>
            </View>
            <View style={styles.detail}><Ionicons name="calendar-outline" size={15} color="#667085" /><Text style={styles.detailText}>{formatLocalDate(booking.slot.bookingDate.slice(0, 10))} · {booking.slot.startTime}–{booking.slot.endTime}</Text></View>
            <View style={styles.detail}><Ionicons name="people-outline" size={15} color="#667085" /><Text style={styles.detailText}>{booking.guestCount} guest(s)</Text></View>
            <View style={styles.qrRow}><QRCode value={booking.qrToken} size={72} /><Text style={styles.qrHelp}>Present this QR at the restaurant desk for booking verification.</Text></View>
            {canCancel(booking.status) && <TouchableOpacity style={styles.cancelButton} onPress={() => cancel('restaurant', booking.id)}><Text style={styles.cancelText}>Cancel reservation</Text></TouchableOpacity>}
          </View>
        ))
      ) : tab === 'room' ? (
        data!.room.map((booking) => (
          <View key={booking.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}><Text style={styles.service}>{booking.room.roomName}</Text><Text style={styles.number}>{booking.bookingNumber}</Text></View>
              <View style={[styles.status, { backgroundColor: statusStyle[booking.status].backgroundColor }]}><Text style={[styles.statusText, { color: statusStyle[booking.status].color }]}>{booking.status}</Text></View>
            </View>
            <View style={styles.detail}><Ionicons name="calendar-outline" size={15} color="#667085" /><Text style={styles.detailText}>{formatLocalDate(booking.checkInDate.slice(0, 10))} → {formatLocalDate(booking.checkOutDate.slice(0, 10))}</Text></View>
            <View style={styles.detail}><Ionicons name="moon-outline" size={15} color="#667085" /><Text style={styles.detailText}>{booking.numberOfNights} night(s) · {booking.guestCount} guest(s)</Text></View>
            <Text style={styles.amount}>₹{booking.totalAmount.toLocaleString('en-IN')}</Text>
            {canCancel(booking.status) && <TouchableOpacity style={styles.cancelButton} onPress={() => cancel('room', booking.id)}><Text style={styles.cancelText}>Cancel room booking</Text></TouchableOpacity>}
          </View>
        ))
      ) : (
        data!.event.map((booking) => (
          <View key={booking.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}><Text style={styles.service}>{booking.event.title}</Text><Text style={styles.number}>{booking.ticketNumber}</Text></View>
              <View style={[styles.status, { backgroundColor: statusStyle[booking.status].backgroundColor }]}><Text style={[styles.statusText, { color: statusStyle[booking.status].color }]}>{booking.status}</Text></View>
            </View>
            <View style={styles.detail}><Ionicons name="calendar-outline" size={15} color="#667085" /><Text style={styles.detailText}>{formatLocalDate(booking.event.eventDate.slice(0, 10))} at {booking.event.startTime}</Text></View>
            <View style={styles.detail}><Ionicons name="location-outline" size={15} color="#667085" /><Text style={styles.detailText}>{booking.event.venue}</Text></View>
            <View style={styles.qrRow}><QRCode value={booking.qrToken} size={72} /><Text style={styles.qrHelp}>Event cancellation and ticket check-in are completed in the next milestone.</Text></View>
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: '#101828', fontSize: 26, fontWeight: '900', marginTop: 4 },
  subtitle: { color: '#667085', fontSize: 14, lineHeight: 21, marginTop: 5 },
  tabs: { flexDirection: 'row', backgroundColor: '#EAECF0', borderRadius: 13, padding: 4, marginTop: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#FFFFFF' },
  tabText: { color: '#667085', fontSize: 12, fontWeight: '800' },
  activeTabText: { color: '#175CD3' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#EAECF0', padding: 16, marginTop: 16 },
  cardTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  service: { color: '#101828', fontSize: 17, fontWeight: '900' },
  number: { color: '#667085', fontSize: 11, marginTop: 4 },
  status: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { fontSize: 9, fontWeight: '900' },
  detail: { flexDirection: 'row', gap: 7, alignItems: 'center', marginTop: 13 },
  detailText: { color: '#667085', fontSize: 12, flex: 1 },
  qrRow: { marginTop: 16, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#EAECF0', flexDirection: 'row', alignItems: 'center', gap: 15 },
  qrHelp: { color: '#667085', fontSize: 11, lineHeight: 17, flex: 1 },
  amount: { color: '#101828', fontSize: 19, fontWeight: '900', marginTop: 14 },
  cancelButton: { marginTop: 16, borderWidth: 1, borderColor: '#FDA29B', borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  cancelText: { color: '#B42318', fontSize: 12, fontWeight: '900' },
  empty: { marginTop: 40, alignItems: 'center', padding: 30, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#EAECF0' },
  emptyTitle: { color: '#344054', fontSize: 17, fontWeight: '800', marginTop: 12 },
  emptyText: { color: '#667085', textAlign: 'center', marginTop: 5 },
});
