import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api, getApiError } from '../api/client';
import { Screen } from '../components/Screen';
import type { RootStackParamList } from '../navigation/types';
import type { ApiResponse, RoomBooking } from '../types/api';
import { formatLocalDate, parseLocalDate } from '../utils/date';

type Props = NativeStackScreenProps<RootStackParamList, 'RoomBooking'>;

export function RoomBookingScreen({ route, navigation }: Props) {
  const { room, checkInDate, checkOutDate, guestCount } = route.params;
  const [submitting, setSubmitting] = useState(false);
  const nights = Math.round((parseLocalDate(checkOutDate).getTime() - parseLocalDate(checkInDate).getTime()) / 86400100);

  const confirm = async () => {
    setSubmitting(true);
    try {
      const response = await api.post<ApiResponse<RoomBooking>>('/rooms/bookings/create', {
        roomId: room.id,
        checkInDate,
        checkOutDate,
        guestCount,
      });
      Alert.alert('Room booked', `${response.data.data.bookingNumber}\nTotal: ₹${response.data.data.totalAmount.toLocaleString('en-IN')}`, [
        { text: 'View bookings', onPress: () => navigation.navigate('MainTabs', { screen: 'Bookings' }) },
      ]);
    } catch (error) {
      Alert.alert('Booking failed', getApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      {room.imageUrl ? <Image source={{ uri: room.imageUrl }} style={styles.image} /> : <View style={styles.imagePlaceholder}><Ionicons name="bed-outline" size={42} color="#98A2B3" /></View>}
      <Text style={styles.title}>{room.roomName}</Text>
      <Text style={styles.meta}>Room {room.roomNumber} · {room.roomType} · up to {room.guestCapacity} guests</Text>

      <View style={styles.summary}>
        <View style={styles.row}><Text style={styles.key}>Check-in</Text><Text style={styles.value}>{formatLocalDate(checkInDate, { day: 'numeric', month: 'long', year: 'numeric' })}</Text></View>
        <View style={styles.divider} />
        <View style={styles.row}><Text style={styles.key}>Check-out</Text><Text style={styles.value}>{formatLocalDate(checkOutDate, { day: 'numeric', month: 'long', year: 'numeric' })}</Text></View>
        <View style={styles.divider} />
        <View style={styles.row}><Text style={styles.key}>Guests</Text><Text style={styles.value}>{guestCount}</Text></View>
        <View style={styles.divider} />
        <View style={styles.row}><Text style={styles.key}>Stay</Text><Text style={styles.value}>{nights} night(s)</Text></View>
      </View>

      <View style={styles.totalBox}>
        <View><Text style={styles.totalLabel}>Booking total</Text><Text style={styles.totalHelp}>₹{room.pricePerNight.toLocaleString('en-IN')} per night</Text></View>
        <Text style={styles.total}>₹{room.estimatedTotal.toLocaleString('en-IN')}</Text>
      </View>
      <Text style={styles.note}>Payment collection for room bookings is added in the invoice and payment milestone. This reservation is confirmed immediately for the assignment flow.</Text>

      <TouchableOpacity disabled={submitting} onPress={() => void confirm()} style={[styles.button, submitting && styles.disabled]}>
        <Text style={styles.buttonText}>{submitting ? 'Confirming…' : 'Confirm room booking'}</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: 210, borderRadius: 20, backgroundColor: '#EAECF0', marginTop: 4 },
  imagePlaceholder: { width: '100%', height: 180, borderRadius: 20, backgroundColor: '#EAECF0', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#101828', fontSize: 25, fontWeight: '900', marginTop: 18 },
  meta: { color: '#667085', fontSize: 13, marginTop: 5 },
  summary: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#EAECF0', padding: 17, marginTop: 22 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  key: { color: '#667085', fontSize: 13 },
  value: { color: '#101828', fontSize: 13, fontWeight: '800', textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#EAECF0', marginVertical: 14 },
  totalBox: { marginTop: 18, padding: 18, borderRadius: 18, backgroundColor: '#101828', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  totalLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  totalHelp: { color: '#98A2B3', fontSize: 10, marginTop: 4 },
  total: { color: '#FFFFFF', fontSize: 23, fontWeight: '900' },
  note: { color: '#667085', fontSize: 11, lineHeight: 17, marginTop: 15 },
  button: { marginTop: 24, backgroundColor: '#175CD3', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  disabled: { opacity: 0.65 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});
