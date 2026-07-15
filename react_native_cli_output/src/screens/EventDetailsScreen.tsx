import Ionicons from 'react-native-vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api, getApiError } from '../api/client';
import { QuantityStepper } from '../components/QuantityStepper';
import { Screen } from '../components/Screen';
import type { RootStackParamList } from '../navigation/types';
import type { ApiResponse, EventBookingResult, PaymentMethod } from '../types/api';
import { formatLocalDate } from '../utils/date';
import { resolveMediaUrl } from '../utils/media';

type Props = NativeStackScreenProps<RootStackParamList, 'EventDetails'>;

export function EventDetailsScreen({ route, navigation }: Props) {
  const { event } = route.params;
  const [quantity, setQuantity] = useState(1);
  const [method, setMethod] = useState<PaymentMethod>('UPI');
  const [submitting, setSubmitting] = useState(false);
  const total = event.ticketPrice * quantity;

  const book = async () => {
    setSubmitting(true);
    try {
      const response = await api.post<ApiResponse<EventBookingResult>>(`/events/${event.id}/book`, {
        ticketQuantity: quantity,
        paymentMethod: event.ticketPrice > 0 ? method : 'SIMULATED',
      });
      navigation.replace('EventTicket', { result: response.data.data });
    } catch (error) {
      Alert.alert('Booking failed', getApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      {event.bannerUrl ? <Image source={{ uri: resolveMediaUrl(event.bannerUrl) }} style={styles.image} /> : <View style={styles.placeholder}><Ionicons name="ticket-outline" size={48} color="#98A2B3" /></View>}
      <View style={styles.tag}><Text style={styles.tagText}>{event.category}</Text></View>
      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.description}>{event.description}</Text>
      <View style={styles.details}>
        <View style={styles.detail}><Ionicons name="calendar-outline" size={18} color="#175CD3" /><View><Text style={styles.detailKey}>Date and time</Text><Text style={styles.detailValue}>{formatLocalDate(event.eventDate.slice(0, 10), { day: 'numeric', month: 'long', year: 'numeric' })} · {event.startTime}–{event.endTime}</Text></View></View>
        <View style={styles.detail}><Ionicons name="location-outline" size={18} color="#175CD3" /><View><Text style={styles.detailKey}>Venue</Text><Text style={styles.detailValue}>{event.venue}</Text></View></View>
        <View style={styles.detail}><Ionicons name="people-outline" size={18} color="#175CD3" /><View><Text style={styles.detailKey}>Availability</Text><Text style={styles.detailValue}>{event.availableSeats} seat(s) remaining</Text></View></View>
      </View>

      <View style={styles.selection}><View><Text style={styles.selectionTitle}>Number of tickets</Text><Text style={styles.selectionHelp}>Maximum 20 per booking</Text></View><QuantityStepper value={quantity} onChange={setQuantity} max={Math.min(20, event.availableSeats)} /></View>

      {event.ticketPrice > 0 && <><Text style={styles.sectionTitle}>Simulated payment method</Text><View style={styles.methods}>{(['UPI', 'CARD', 'SIMULATED'] as PaymentMethod[]).map((item) => <TouchableOpacity key={item} onPress={() => setMethod(item)} style={[styles.method, method === item && styles.activeMethod]}><Ionicons name={item === 'UPI' ? 'phone-portrait-outline' : item === 'CARD' ? 'card-outline' : 'flash-outline'} size={20} color={method === item ? '#175CD3' : '#667085'} /><Text style={[styles.methodText, method === item && styles.activeMethodText]}>{item}</Text></TouchableOpacity>)}</View><Text style={styles.paymentNote}>This assignment uses a safe internal payment simulation. No real money is charged.</Text></>}

      <View style={styles.totalBox}><View><Text style={styles.totalLabel}>{event.ticketPrice === 0 ? 'Free booking' : 'Amount payable'}</Text><Text style={styles.totalHelp}>{quantity} × {event.ticketPrice === 0 ? 'free ticket' : `₹${event.ticketPrice.toLocaleString('en-IN')}`}</Text></View><Text style={styles.total}>{event.ticketPrice === 0 ? 'FREE' : `₹${total.toLocaleString('en-IN')}`}</Text></View>
      <TouchableOpacity disabled={submitting || event.availableSeats < quantity} onPress={() => void book()} style={[styles.button, submitting && styles.disabled]}><Text style={styles.buttonText}>{submitting ? 'Processing…' : event.ticketPrice === 0 ? 'Confirm free ticket' : 'Pay & generate ticket'}</Text></TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: 220, borderRadius: 20, backgroundColor: '#EAECF0' },
  placeholder: { height: 180, borderRadius: 20, backgroundColor: '#EAECF0', alignItems: 'center', justifyContent: 'center' },
  tag: { alignSelf: 'flex-start', backgroundColor: '#EFF4FF', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginTop: 18 },
  tagText: { color: '#175CD3', fontSize: 10, fontWeight: '900' },
  title: { color: '#101828', fontSize: 27, fontWeight: '900', marginTop: 12 },
  description: { color: '#667085', fontSize: 14, lineHeight: 22, marginTop: 8 },
  details: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAECF0', borderRadius: 18, padding: 16, marginTop: 20, gap: 16 },
  detail: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  detailKey: { color: '#98A2B3', fontSize: 10, fontWeight: '800' },
  detailValue: { color: '#344054', fontSize: 13, fontWeight: '700', marginTop: 3 },
  selection: { marginTop: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAECF0', borderRadius: 18, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  selectionTitle: { color: '#344054', fontSize: 14, fontWeight: '900' },
  selectionHelp: { color: '#98A2B3', fontSize: 10, marginTop: 4 },
  sectionTitle: { color: '#344054', fontSize: 14, fontWeight: '900', marginTop: 22, marginBottom: 10 },
  methods: { flexDirection: 'row', gap: 8 },
  method: { flex: 1, minHeight: 70, borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FFFFFF' },
  activeMethod: { borderColor: '#84ADFF', backgroundColor: '#EFF4FF' },
  methodText: { color: '#667085', fontSize: 10, fontWeight: '900' },
  activeMethodText: { color: '#175CD3' },
  paymentNote: { color: '#667085', fontSize: 10, lineHeight: 16, marginTop: 9 },
  totalBox: { marginTop: 20, backgroundColor: '#101828', borderRadius: 18, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  totalLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  totalHelp: { color: '#98A2B3', fontSize: 10, marginTop: 4 },
  total: { color: '#FFFFFF', fontSize: 23, fontWeight: '900' },
  button: { marginTop: 20, backgroundColor: '#175CD3', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});
