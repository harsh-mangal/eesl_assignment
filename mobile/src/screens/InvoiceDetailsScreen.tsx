import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api, getApiError } from '../api/client';
import { Screen } from '../components/Screen';
import type { RootStackParamList } from '../navigation/types';
import type { ApiResponse, Invoice } from '../types/api';
import { formatLocalDate } from '../utils/date';

type Props = NativeStackScreenProps<RootStackParamList, 'InvoiceDetails'>;

export function InvoiceDetailsScreen({ route, navigation }: Props) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<Invoice>>(`/invoices/${route.params.invoiceId}`);
      setInvoice(response.data.data);
    } catch (error) {
      Alert.alert('Unable to load invoice', getApiError(error));
    } finally {
      setLoading(false);
    }
  }, [route.params.invoiceId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  if (loading) return <Screen><ActivityIndicator size="large" color="#175CD3" style={{ marginTop: 80 }} /></Screen>;
  if (!invoice) return <Screen><Text style={styles.empty}>Invoice could not be found.</Text></Screen>;

  const payable = invoice.status === 'UNPAID' || invoice.status === 'OVERDUE';

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.heroIcon}><Ionicons name="receipt-outline" size={30} color="#FFFFFF" /></View>
        <Text style={styles.eyebrow}>INVOICE</Text>
        <Text style={styles.number}>{invoice.invoiceNumber}</Text>
        <Text style={styles.amount}>₹{invoice.amount.toLocaleString('en-IN')}</Text>
        <View style={[styles.status, invoice.status === 'PAID' ? styles.paidStatus : invoice.status === 'OVERDUE' ? styles.overdueStatus : styles.defaultStatus]}>
          <Text style={[styles.statusText, invoice.status === 'PAID' ? styles.paidText : invoice.status === 'OVERDUE' ? styles.overdueText : styles.defaultText]}>{invoice.status}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Invoice details</Text>
        <Text style={styles.description}>{invoice.description}</Text>
        <View style={styles.divider} />
        <View style={styles.row}><Text style={styles.key}>Issue date</Text><Text style={styles.value}>{formatLocalDate(invoice.issueDate.slice(0, 10), { day: 'numeric', month: 'long', year: 'numeric' })}</Text></View>
        <View style={styles.row}><Text style={styles.key}>Due date</Text><Text style={styles.value}>{formatLocalDate(invoice.dueDate.slice(0, 10), { day: 'numeric', month: 'long', year: 'numeric' })}</Text></View>
        <View style={styles.row}><Text style={styles.key}>Amount</Text><Text style={styles.value}>₹{invoice.amount.toLocaleString('en-IN')}</Text></View>
      </View>

      {invoice.payment && (
        <View style={styles.paymentCard}>
          <View style={styles.paymentHeading}><Ionicons name="checkmark-circle" size={22} color="#027A48" /><Text style={styles.paymentTitle}>Payment completed</Text></View>
          <View style={styles.row}><Text style={styles.key}>Transaction</Text><Text style={styles.smallValue}>{invoice.payment.transactionId}</Text></View>
          <View style={styles.row}><Text style={styles.key}>Method</Text><Text style={styles.value}>{invoice.payment.paymentMethod}</Text></View>
          <View style={styles.row}><Text style={styles.key}>Paid on</Text><Text style={styles.value}>{new Date(invoice.payment.paidAt).toLocaleString()}</Text></View>
        </View>
      )}

      {payable && (
        <>
          <View style={styles.notice}><Ionicons name="shield-checkmark-outline" size={20} color="#175CD3" /><Text style={styles.noticeText}>Payment is simulated for this assignment. No real money or card details are used.</Text></View>
          <TouchableOpacity style={styles.primary} onPress={() => navigation.navigate('InvoicePayment', { invoice })}>
            <Text style={styles.primaryText}>Pay ₹{invoice.amount.toLocaleString('en-IN')}</Text>
          </TouchableOpacity>
        </>
      )}

      {invoice.status === 'CANCELLED' && <Text style={styles.cancelled}>This invoice was cancelled by the administrator and cannot be paid.</Text>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: '#101828', borderRadius: 22, padding: 22, alignItems: 'center', marginTop: 6 },
  heroIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: '#175CD3', alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: '#98A2B3', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginTop: 15 },
  number: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginTop: 5 },
  amount: { color: '#FFFFFF', fontSize: 31, fontWeight: '900', marginTop: 13 },
  status: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginTop: 13 },
  paidStatus: { backgroundColor: '#ECFDF3' },
  overdueStatus: { backgroundColor: '#FEF3F2' },
  defaultStatus: { backgroundColor: '#FFF6ED' },
  statusText: { fontSize: 9, fontWeight: '900' },
  paidText: { color: '#027A48' },
  overdueText: { color: '#B42318' },
  defaultText: { color: '#C4320A' },
  card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAECF0', borderRadius: 18, padding: 18, marginTop: 16 },
  cardTitle: { color: '#101828', fontSize: 16, fontWeight: '900' },
  description: { color: '#667085', fontSize: 13, lineHeight: 20, marginTop: 8 },
  divider: { height: 1, backgroundColor: '#EAECF0', marginVertical: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginTop: 11 },
  key: { color: '#667085', fontSize: 12 },
  value: { color: '#101828', fontSize: 12, fontWeight: '800', textAlign: 'right', flex: 1 },
  smallValue: { color: '#101828', fontSize: 9, fontWeight: '700', textAlign: 'right', flex: 1 },
  paymentCard: { backgroundColor: '#ECFDF3', borderRadius: 18, padding: 18, marginTop: 16 },
  paymentHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  paymentTitle: { color: '#027A48', fontSize: 15, fontWeight: '900' },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#EFF4FF', borderRadius: 14, padding: 14, marginTop: 17 },
  noticeText: { flex: 1, color: '#475467', fontSize: 11, lineHeight: 17 },
  primary: { backgroundColor: '#175CD3', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 17 },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  cancelled: { color: '#667085', textAlign: 'center', lineHeight: 19, marginTop: 18 },
  empty: { color: '#667085', textAlign: 'center', marginTop: 70 },
});
