import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api, getApiError } from '../api/client';
import { buildDateOptions, DateStrip } from '../components/DateStrip';
import { QuantityStepper } from '../components/QuantityStepper';
import { Screen } from '../components/Screen';
import type { RootStackParamList } from '../navigation/types';
import type { ApiResponse, RoomAvailability } from '../types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'RoomList'>;

export function RoomListScreen({ navigation }: Props) {
  const dateOptions = useMemo(() => buildDateOptions(21), []);
  const [checkInDate, setCheckInDate] = useState(dateOptions[1].value);
  const [checkOutDate, setCheckOutDate] = useState(dateOptions[2].value);
  const [guestCount, setGuestCount] = useState(2);
  const [availability, setAvailability] = useState<RoomAvailability | null>(null);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async () => {
    if (checkOutDate <= checkInDate) {
      Alert.alert('Invalid stay dates', 'Check-out must be after check-in.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<RoomAvailability>>('/rooms/availability', {
        params: { checkInDate, checkOutDate, guestCount },
      });
      setAvailability(response.data.data);
    } catch (error) {
      Alert.alert('Unable to check availability', getApiError(error));
    } finally {
      setLoading(false);
    }
  }, [checkInDate, checkOutDate, guestCount]);

  const changeCheckIn = (value: string) => {
    setCheckInDate(value);
    if (checkOutDate <= value) {
      const next = dateOptions.find((option) => option.value > value);
      if (next) setCheckOutDate(next.value);
    }
    setAvailability(null);
  };

  return (
    <Screen>
      <Text style={styles.title}>Find a room</Text>
      <Text style={styles.subtitle}>Search live room availability. Existing confirmed bookings are excluded automatically.</Text>

      <Text style={styles.label}>Check-in</Text>
      <DateStrip options={dateOptions} value={checkInDate} onChange={changeCheckIn} />
      <Text style={styles.label}>Check-out</Text>
      <DateStrip options={dateOptions} value={checkOutDate} onChange={(value) => { setCheckOutDate(value); setAvailability(null); }} disabledBefore={checkInDate} />

      <View style={styles.guestsRow}>
        <View><Text style={styles.guestsTitle}>Guests</Text><Text style={styles.guestsHelp}>Only rooms with enough capacity will appear.</Text></View>
        <QuantityStepper value={guestCount} max={10} onChange={(value) => { setGuestCount(value); setAvailability(null); }} />
      </View>

      <TouchableOpacity disabled={loading} onPress={() => void search()} style={[styles.searchButton, loading && styles.disabled]}>
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <><Ionicons name="search" size={18} color="#FFFFFF" /><Text style={styles.searchText}>Search available rooms</Text></>}
      </TouchableOpacity>

      {availability && (
        <>
          <View style={styles.resultHeader}>
            <View><Text style={styles.resultTitle}>{availability.items.length} room(s) available</Text><Text style={styles.resultSubtitle}>{availability.numberOfNights} night(s) · {guestCount} guest(s)</Text></View>
          </View>
          {availability.items.map((room) => (
            <View key={room.id} style={styles.card}>
              {room.imageUrl ? <Image source={{ uri: room.imageUrl }} style={styles.image} /> : null}
              <View style={styles.cardContent}>
                <View style={styles.headingRow}>
                  <View style={{ flex: 1 }}><Text style={styles.roomName}>{room.roomName}</Text><Text style={styles.roomMeta}>Room {room.roomNumber} · {room.roomType}</Text></View>
                  <View style={styles.availableBadge}><Text style={styles.availableText}>AVAILABLE</Text></View>
                </View>
                <View style={styles.infoRow}><Ionicons name="people-outline" size={15} color="#667085" /><Text style={styles.infoText}>Up to {room.guestCapacity} guests</Text></View>
                <View style={styles.amenities}>{room.amenities.slice(0, 4).map((item) => <View key={item} style={styles.amenity}><Text style={styles.amenityText}>{item}</Text></View>)}</View>
                <View style={styles.priceRow}>
                  <View><Text style={styles.price}>₹{room.estimatedTotal.toLocaleString('en-IN')}</Text><Text style={styles.priceHelp}>₹{room.pricePerNight.toLocaleString('en-IN')} × {availability.numberOfNights} night(s)</Text></View>
                  <TouchableOpacity style={styles.bookButton} onPress={() => navigation.navigate('RoomBooking', { roomId: room.id, checkInDate, checkOutDate, guestCount, room })}><Text style={styles.bookText}>Book room</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
          {availability.items.length === 0 && (
            <View style={styles.empty}><Ionicons name="bed-outline" size={36} color="#98A2B3" /><Text style={styles.emptyTitle}>No matching rooms</Text><Text style={styles.emptyText}>Try different dates or reduce the number of guests.</Text></View>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: '#101828', fontSize: 26, fontWeight: '900', marginTop: 4 },
  subtitle: { color: '#667085', fontSize: 14, lineHeight: 21, marginTop: 5 },
  label: { color: '#344054', fontSize: 13, fontWeight: '800', marginTop: 22, marginBottom: 10 },
  guestsRow: { marginTop: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  guestsTitle: { color: '#344054', fontSize: 14, fontWeight: '800' },
  guestsHelp: { color: '#98A2B3', fontSize: 10, maxWidth: 180, marginTop: 4 },
  searchButton: { marginTop: 22, minHeight: 50, backgroundColor: '#175CD3', borderRadius: 14, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.65 },
  searchText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  resultHeader: { marginTop: 28, marginBottom: 2 },
  resultTitle: { color: '#101828', fontSize: 18, fontWeight: '900' },
  resultSubtitle: { color: '#667085', fontSize: 12, marginTop: 3 },
  card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAECF0', borderRadius: 20, overflow: 'hidden', marginTop: 16 },
  image: { width: '100%', height: 155, backgroundColor: '#EAECF0' },
  cardContent: { padding: 16 },
  headingRow: { flexDirection: 'row', gap: 10 },
  roomName: { color: '#101828', fontSize: 19, fontWeight: '900' },
  roomMeta: { color: '#667085', fontSize: 12, marginTop: 4 },
  availableBadge: { backgroundColor: '#ECFDF3', borderRadius: 999, alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5 },
  availableText: { color: '#027A48', fontSize: 9, fontWeight: '900' },
  infoRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 12 },
  infoText: { color: '#667085', fontSize: 12 },
  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  amenity: { backgroundColor: '#F2F4F7', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999 },
  amenityText: { color: '#475467', fontSize: 10, fontWeight: '700' },
  priceRow: { marginTop: 18, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#EAECF0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  price: { color: '#101828', fontSize: 20, fontWeight: '900' },
  priceHelp: { color: '#98A2B3', fontSize: 10, marginTop: 3 },
  bookButton: { backgroundColor: '#175CD3', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12 },
  bookText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  empty: { marginTop: 20, alignItems: 'center', padding: 30, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#EAECF0' },
  emptyTitle: { color: '#344054', fontSize: 17, fontWeight: '800', marginTop: 12 },
  emptyText: { color: '#667085', textAlign: 'center', marginTop: 5 },
});
