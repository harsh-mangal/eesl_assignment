import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api, getApiError } from '../api/client';
import { QuantityStepper } from '../components/QuantityStepper';
import { Screen } from '../components/Screen';
import type { RootStackParamList } from '../navigation/types';
import type { ApiResponse, RestaurantBooking } from '../types/api';
import { formatLocalDate } from '../utils/date';

type Props = NativeStackScreenProps<RootStackParamList, 'RestaurantBooking'>;

export function RestaurantBookingScreen({ route, navigation }: Props) {
  const { restaurantName, date, startTime, endTime, slotId, availableCapacity } = route.params;
  const [guestCount, setGuestCount] = useState(Math.min(2, availableCapacity));
  const [instructions, setInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const confirm = async () => {
    setSubmitting(true);
    try {
      const response = await api.post<ApiResponse<RestaurantBooking>>('/restaurants/bookings/create', {
        slotId,
        guestCount,
        specialInstructions: instructions.trim() || undefined,
      });
      Alert.alert(
        'Reservation confirmed',
        `${response.data.data.bookingNumber}\n${restaurantName}\n${formatLocalDate(date)} at ${startTime}`,
        [{ text: 'View bookings', onPress: () => navigation.navigate('MainTabs', { screen: 'Bookings' }) }],
      );
    } catch (error) {
      Alert.alert('Booking failed', getApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <View style={styles.icon}><Ionicons name="restaurant" size={30} color="#175CD3" /></View>
      <Text style={styles.title}>{restaurantName}</Text>
      <Text style={styles.subtitle}>Review your reservation details before confirming.</Text>

      <View style={styles.summary}>
        <View style={styles.summaryRow}><Text style={styles.key}>Date</Text><Text style={styles.value}>{formatLocalDate(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text></View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}><Text style={styles.key}>Time</Text><Text style={styles.value}>{startTime}–{endTime}</Text></View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}><Text style={styles.key}>Available capacity</Text><Text style={styles.value}>{availableCapacity}</Text></View>
      </View>

      <View style={styles.sectionRow}>
        <View><Text style={styles.label}>Number of guests</Text><Text style={styles.help}>Maximum {availableCapacity} for this slot</Text></View>
        <QuantityStepper value={guestCount} max={availableCapacity} onChange={setGuestCount} />
      </View>

      <Text style={styles.label}>Special instructions</Text>
      <TextInput
        value={instructions}
        onChangeText={setInstructions}
        placeholder="Window table, accessibility needs, celebration…"
        placeholderTextColor="#98A2B3"
        multiline
        maxLength={1000}
        style={styles.input}
      />

      <TouchableOpacity disabled={submitting} onPress={() => void confirm()} style={[styles.button, submitting && styles.buttonDisabled]}>
        <Text style={styles.buttonText}>{submitting ? 'Confirming…' : 'Confirm reservation'}</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  icon: { width: 58, height: 58, borderRadius: 18, backgroundColor: '#EFF4FF', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  title: { color: '#101828', fontSize: 25, fontWeight: '900', marginTop: 16 },
  subtitle: { color: '#667085', fontSize: 14, lineHeight: 21, marginTop: 5 },
  summary: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#EAECF0', padding: 17, marginTop: 24 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 14 },
  key: { color: '#667085', fontSize: 13 },
  value: { color: '#101828', fontSize: 13, fontWeight: '800', textAlign: 'right', flex: 1 },
  divider: { height: 1, backgroundColor: '#EAECF0', marginVertical: 14 },
  sectionRow: { marginTop: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  label: { color: '#344054', fontSize: 13, fontWeight: '800', marginTop: 22, marginBottom: 8 },
  help: { color: '#98A2B3', fontSize: 11, marginTop: 3 },
  input: { minHeight: 110, textAlignVertical: 'top', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 14, padding: 14, color: '#101828', fontSize: 14 },
  button: { marginTop: 26, backgroundColor: '#175CD3', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});
