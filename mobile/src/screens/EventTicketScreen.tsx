import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Screen } from '../components/Screen';
import type { RootStackParamList } from '../navigation/types';
import { formatLocalDate } from '../utils/date';

type Props = NativeStackScreenProps<RootStackParamList, 'EventTicket'>;

export function EventTicketScreen({ route, navigation }: Props) {
  const { booking, payment, receipt } = route.params.result;
  return (
    <Screen>
      <View style={styles.success}><View style={styles.icon}><Ionicons name="checkmark" size={30} color="#FFFFFF" /></View><Text style={styles.successTitle}>Booking confirmed</Text><Text style={styles.successText}>{receipt.paid ? 'Simulated payment succeeded and your QR ticket is ready.' : 'Your free QR ticket is ready.'}</Text></View>
      <View style={styles.ticket}>
        <Text style={styles.eyebrow}>EVENT TICKET</Text>
        <Text style={styles.title}>{booking.event.title}</Text>
        <Text style={styles.ticketNumber}>{booking.ticketNumber}</Text>
        <View style={styles.divider} />
        <View style={styles.row}><Text style={styles.key}>Date</Text><Text style={styles.value}>{formatLocalDate(booking.event.eventDate.slice(0, 10), { day: 'numeric', month: 'long', year: 'numeric' })}</Text></View>
        <View style={styles.row}><Text style={styles.key}>Time</Text><Text style={styles.value}>{booking.event.startTime}–{booking.event.endTime}</Text></View>
        <View style={styles.row}><Text style={styles.key}>Venue</Text><Text style={styles.value}>{booking.event.venue}</Text></View>
        <View style={styles.row}><Text style={styles.key}>Tickets</Text><Text style={styles.value}>{booking.ticketQuantity}</Text></View>
        <View style={styles.qr}><QRCode value={booking.qrToken} size={190} /><Text style={styles.qrHelp}>Present this code at the event entry desk. It can be checked in only once.</Text></View>
      </View>
      <View style={styles.receipt}><Text style={styles.receiptTitle}>{payment ? 'Payment receipt' : 'Booking receipt'}</Text><View style={styles.row}><Text style={styles.key}>Amount</Text><Text style={styles.value}>{receipt.amount === 0 ? 'FREE' : `₹${receipt.amount.toLocaleString('en-IN')}`}</Text></View>{payment && <><View style={styles.row}><Text style={styles.key}>Transaction</Text><Text style={styles.valueSmall}>{payment.transactionId}</Text></View><View style={styles.row}><Text style={styles.key}>Method</Text><Text style={styles.value}>{payment.paymentMethod}</Text></View><View style={styles.row}><Text style={styles.key}>Status</Text><Text style={styles.successValue}>{payment.status}</Text></View></>}</View>
      <TouchableOpacity style={styles.primary} onPress={() => navigation.navigate('MainTabs', { screen: 'Bookings' })}><Text style={styles.primaryText}>View my bookings</Text></TouchableOpacity>
      <TouchableOpacity style={styles.secondary} onPress={() => navigation.navigate('MainTabs', { screen: 'Events' })}><Text style={styles.secondaryText}>Browse more events</Text></TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  success: { alignItems: 'center', marginTop: 6, marginBottom: 20 },
  icon: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#12B76A', alignItems: 'center', justifyContent: 'center' },
  successTitle: { color: '#101828', fontSize: 23, fontWeight: '900', marginTop: 12 },
  successText: { color: '#667085', textAlign: 'center', fontSize: 12, lineHeight: 18, marginTop: 5 },
  ticket: { backgroundColor: '#FFFFFF', borderRadius: 22, borderWidth: 1, borderColor: '#EAECF0', padding: 20 },
  eyebrow: { color: '#175CD3', fontSize: 10, letterSpacing: 1.2, fontWeight: '900' },
  title: { color: '#101828', fontSize: 22, fontWeight: '900', marginTop: 8 },
  ticketNumber: { color: '#667085', fontSize: 11, marginTop: 5 },
  divider: { height: 1, backgroundColor: '#EAECF0', marginVertical: 17 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginTop: 11 },
  key: { color: '#667085', fontSize: 12 },
  value: { color: '#101828', fontSize: 12, fontWeight: '800', textAlign: 'right', flex: 1 },
  valueSmall: { color: '#101828', fontSize: 9, fontWeight: '700', textAlign: 'right', flex: 1 },
  successValue: { color: '#027A48', fontSize: 12, fontWeight: '900' },
  qr: { alignItems: 'center', marginTop: 22, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#EAECF0' },
  qrHelp: { color: '#667085', fontSize: 10, lineHeight: 16, textAlign: 'center', marginTop: 12, maxWidth: 240 },
  receipt: { backgroundColor: '#EFF4FF', borderRadius: 18, padding: 17, marginTop: 16 },
  receiptTitle: { color: '#175CD3', fontSize: 14, fontWeight: '900', marginBottom: 4 },
  primary: { marginTop: 20, backgroundColor: '#175CD3', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  secondary: { marginTop: 10, borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  secondaryText: { color: '#344054', fontSize: 14, fontWeight: '900' },
});
