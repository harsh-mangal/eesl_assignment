import Ionicons from 'react-native-vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Screen } from '../components/Screen';
import type { RootStackParamList } from '../navigation/types';
import type { ApiResponse, Restaurant } from '../types/api';
import { resolveMediaUrl } from '../utils/media';

type Props = NativeStackScreenProps<RootStackParamList, 'RestaurantList'>;

export function RestaurantListScreen({ navigation }: Props) {
  const dateOptions = useMemo(() => buildDateOptions(10), []);
  const [date, setDate] = useState(dateOptions[1]?.value ?? dateOptions[0].value);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<{ date: string; items: Restaurant[] }>>('/restaurants', { params: { date } });
      setRestaurants(response.data.data.items);
    } catch (error) {
      Alert.alert('Unable to load restaurants', getApiError(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [date]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  return (
    <Screen refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }}>
      <Text style={styles.title}>Reserve a table</Text>
      <Text style={styles.subtitle}>Choose a date and an available restaurant time slot.</Text>
      <Text style={styles.label}>Booking date</Text>
      <DateStrip options={dateOptions} value={date} onChange={setDate} />

      {loading ? (
        <ActivityIndicator size="large" color="#175CD3" style={styles.loader} />
      ) : restaurants.length === 0 ? (
        <View style={styles.empty}><Ionicons name="restaurant-outline" size={34} color="#98A2B3" /><Text style={styles.emptyTitle}>No restaurants available</Text><Text style={styles.emptyText}>Try another date or refresh after the administrator adds slots.</Text></View>
      ) : (
        restaurants.map((restaurant) => (
          <View key={restaurant.id} style={styles.card}>
            {restaurant.imageUrl ? <Image source={{ uri: resolveMediaUrl(restaurant.imageUrl) }} style={styles.image} /> : null}
            <View style={styles.content}>
              <View style={styles.headingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{restaurant.name}</Text>
                  <Text style={styles.time}>{restaurant.openingTime}–{restaurant.closingTime}</Text>
                </View>
                <View style={styles.activeBadge}><Text style={styles.activeText}>OPEN</Text></View>
              </View>
              <Text style={styles.description}>{restaurant.description}</Text>
              <Text style={styles.slotLabel}>Available slots</Text>
              <View style={styles.slots}>
                {restaurant.slots.map((slot) => {
                  const available = slot.isAvailable && slot.availableCapacity > 0;
                  return (
                    <TouchableOpacity
                      key={slot.id}
                      disabled={!available}
                      style={[styles.slot, !available && styles.slotDisabled]}
                      onPress={() => navigation.navigate('RestaurantBooking', {
                        restaurantId: restaurant.id,
                        restaurantName: restaurant.name,
                        slotId: slot.id,
                        date,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        availableCapacity: slot.availableCapacity,
                      })}
                    >
                      <Text style={[styles.slotTime, !available && styles.slotTextDisabled]}>{slot.startTime}</Text>
                      <Text style={[styles.capacity, !available && styles.slotTextDisabled]}>{available ? `${slot.availableCapacity} seats` : 'Unavailable'}</Text>
                    </TouchableOpacity>
                  );
                })}
                {restaurant.slots.length === 0 && <Text style={styles.noSlots}>No slots configured for this date.</Text>}
              </View>
            </View>
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: '#101828', fontSize: 26, fontWeight: '900', marginTop: 4 },
  subtitle: { color: '#667085', fontSize: 14, lineHeight: 21, marginTop: 5 },
  label: { color: '#344054', fontSize: 13, fontWeight: '800', marginTop: 22, marginBottom: 10 },
  loader: { marginTop: 60 },
  card: { marginTop: 18, backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#EAECF0' },
  image: { width: '100%', height: 145, backgroundColor: '#EAECF0' },
  content: { padding: 16 },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  name: { color: '#101828', fontSize: 19, fontWeight: '900' },
  time: { color: '#175CD3', fontSize: 12, fontWeight: '800', marginTop: 4 },
  activeBadge: { backgroundColor: '#ECFDF3', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  activeText: { color: '#027A48', fontSize: 10, fontWeight: '900' },
  description: { color: '#667085', fontSize: 13, lineHeight: 19, marginTop: 10 },
  slotLabel: { color: '#344054', fontSize: 12, fontWeight: '800', marginTop: 16, marginBottom: 9 },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: { minWidth: 96, borderRadius: 13, backgroundColor: '#EFF4FF', borderWidth: 1, borderColor: '#B2CCFF', paddingHorizontal: 12, paddingVertical: 9 },
  slotDisabled: { backgroundColor: '#F2F4F7', borderColor: '#EAECF0' },
  slotTime: { color: '#175CD3', fontSize: 14, fontWeight: '900' },
  capacity: { color: '#475467', fontSize: 10, marginTop: 3 },
  slotTextDisabled: { color: '#98A2B3' },
  noSlots: { color: '#98A2B3', fontSize: 13 },
  empty: { marginTop: 50, alignItems: 'center', padding: 30, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#EAECF0' },
  emptyTitle: { color: '#344054', fontSize: 17, fontWeight: '800', marginTop: 12 },
  emptyText: { color: '#667085', textAlign: 'center', lineHeight: 20, marginTop: 5 },
});
