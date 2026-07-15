import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api, getApiError } from '../api/client';
import { Screen } from '../components/Screen';
import type { RootStackParamList } from '../navigation/types';
import type { ApiResponse, Event } from '../types/api';
import { formatLocalDate } from '../utils/date';
import { resolveMediaUrl } from '../utils/media';

type Filter = 'UPCOMING' | 'FREE' | 'PAID' | 'ALL';

export function EventsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [filter, setFilter] = useState<Filter>('UPCOMING');
  const [category, setCategory] = useState('');
  const [items, setItems] = useState<Event[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<{ items: Event[]; categories: string[] }>>('/events', {
        params: { filter, category: category || undefined },
      });
      setItems(response.data.data.items);
      setCategories(response.data.data.categories);
    } catch (error) {
      Alert.alert('Unable to load events', getApiError(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, category]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return (
    <Screen includeTopInset refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }}>
      <Text style={styles.title}>Events</Text>
      <Text style={styles.subtitle}>Browse upcoming experiences and receive a QR ticket immediately after booking.</Text>

      <View style={styles.filters}>
        {(['UPCOMING', 'FREE', 'PAID', 'ALL'] as Filter[]).map((item) => (
          <TouchableOpacity key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.activeFilter]}>
            <Text style={[styles.filterText, filter === item && styles.activeFilterText]}>{item[0] + item.slice(1).toLowerCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {categories.length > 0 && (
        <View style={styles.categories}>
          <TouchableOpacity onPress={() => setCategory('')} style={[styles.category, !category && styles.activeCategory]}><Text style={[styles.categoryText, !category && styles.activeCategoryText]}>All categories</Text></TouchableOpacity>
          {categories.map((item) => <TouchableOpacity key={item} onPress={() => setCategory(item)} style={[styles.category, category === item && styles.activeCategory]}><Text style={[styles.categoryText, category === item && styles.activeCategoryText]}>{item}</Text></TouchableOpacity>)}
        </View>
      )}

      {loading ? <ActivityIndicator size="large" color="#175CD3" style={{ marginTop: 60 }} /> : items.map((event) => (
        <TouchableOpacity key={event.id} activeOpacity={0.88} style={styles.card} onPress={() => navigation.navigate('EventDetails', { event })}>
          {event.bannerUrl ? <Image source={{ uri: resolveMediaUrl(event.bannerUrl) }} style={styles.banner} /> : <View style={styles.bannerPlaceholder}><Ionicons name="ticket-outline" size={42} color="#98A2B3" /></View>}
          <View style={styles.content}>
            <View style={styles.tagRow}><View style={styles.tag}><Text style={styles.tagText}>{event.category}</Text></View><View style={[styles.priceTag, event.ticketPrice === 0 && styles.freeTag]}><Text style={[styles.priceTagText, event.ticketPrice === 0 && styles.freeTagText]}>{event.ticketPrice === 0 ? 'FREE' : `₹${event.ticketPrice.toLocaleString('en-IN')}`}</Text></View></View>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <View style={styles.detail}><Ionicons name="calendar-outline" size={15} color="#667085" /><Text style={styles.detailText}>{formatLocalDate(event.eventDate.slice(0, 10), { day: 'numeric', month: 'short', year: 'numeric' })} · {event.startTime}–{event.endTime}</Text></View>
            <View style={styles.detail}><Ionicons name="location-outline" size={15} color="#667085" /><Text style={styles.detailText}>{event.venue}</Text></View>
            <View style={styles.footer}><Text style={styles.seats}>{event.availableSeats} seat(s) available</Text><Ionicons name="arrow-forward-circle" size={28} color="#175CD3" /></View>
          </View>
        </TouchableOpacity>
      ))}
      {!loading && items.length === 0 && <View style={styles.empty}><Ionicons name="ticket-outline" size={40} color="#98A2B3" /><Text style={styles.emptyTitle}>No matching events</Text><Text style={styles.emptyText}>Try another price or category filter.</Text></View>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: '#101828', fontSize: 26, fontWeight: '900', marginTop: 4 },
  subtitle: { color: '#667085', fontSize: 14, lineHeight: 21, marginTop: 5 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 18 },
  filter: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999, backgroundColor: '#EAECF0' },
  activeFilter: { backgroundColor: '#175CD3' },
  filterText: { color: '#475467', fontSize: 11, fontWeight: '800' },
  activeFilterText: { color: '#FFFFFF' },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 },
  category: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: '#D0D5DD', backgroundColor: '#FFFFFF' },
  activeCategory: { borderColor: '#84ADFF', backgroundColor: '#EFF4FF' },
  categoryText: { color: '#667085', fontSize: 10, fontWeight: '700' },
  activeCategoryText: { color: '#175CD3' },
  card: { marginTop: 17, backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#EAECF0' },
  banner: { width: '100%', height: 170, backgroundColor: '#EAECF0' },
  bannerPlaceholder: { width: '100%', height: 145, backgroundColor: '#EAECF0', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16 },
  tagRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  tag: { paddingHorizontal: 9, paddingVertical: 5, backgroundColor: '#EFF4FF', borderRadius: 999 },
  tagText: { color: '#175CD3', fontSize: 9, fontWeight: '900' },
  priceTag: { paddingHorizontal: 9, paddingVertical: 5, backgroundColor: '#101828', borderRadius: 999 },
  priceTagText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  freeTag: { backgroundColor: '#ECFDF3' },
  freeTagText: { color: '#027A48' },
  eventTitle: { color: '#101828', fontSize: 20, fontWeight: '900', marginTop: 13 },
  detail: { flexDirection: 'row', gap: 7, alignItems: 'center', marginTop: 11 },
  detailText: { color: '#667085', fontSize: 12, flex: 1 },
  footer: { marginTop: 15, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#EAECF0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seats: { color: '#344054', fontSize: 11, fontWeight: '800' },
  empty: { marginTop: 35, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAECF0', borderRadius: 20, alignItems: 'center', padding: 30 },
  emptyTitle: { color: '#344054', fontSize: 17, fontWeight: '900', marginTop: 12 },
  emptyText: { color: '#667085', marginTop: 5 },
});
