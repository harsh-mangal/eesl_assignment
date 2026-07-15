import Ionicons from 'react-native-vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api, getApiError } from '../api/client';
import { Screen } from '../components/Screen';
import type { RootStackParamList } from '../navigation/types';
import type { IoniconName } from '../types/icons';
import type { ApiResponse, InvoicePaymentResult, PaymentMethod } from '../types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'InvoicePayment'>;

const methods: Array<{ value: PaymentMethod; label: string; help: string; icon: IoniconName }> = [
  { value: 'UPI', label: 'UPI simulation', help: 'Instant simulated UPI success', icon: 'phone-portrait-outline' },
  { value: 'CARD', label: 'Card simulation', help: 'No card information required', icon: 'card-outline' },
  { value: 'SIMULATED', label: 'Internal simulation', help: 'Assignment demo transaction', icon: 'flash-outline' },
];

export function InvoicePaymentScreen({ route, navigation }: Props) {
  const { invoice } = route.params;
  const [method, setMethod] = useState<PaymentMethod>('UPI');
  const [submitting, setSubmitting] = useState(false);

  const pay = async () => {
    setSubmitting(true);
    try {
      const response = await api.post<ApiResponse<InvoicePaymentResult>>(`/invoices/${invoice.id}/pay`, {
        paymentMethod: method,
      });
      navigation.replace('PaymentReceipt', { result: response.data.data });
    } catch (error) {
      Alert.alert('Payment failed', getApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <View style={styles.amountCard}>
        <Text style={styles.eyebrow}>AMOUNT PAYABLE</Text>
        <Text style={styles.amount}>₹{invoice.amount.toLocaleString('en-IN')}</Text>
        <Text style={styles.invoice}>{invoice.invoiceNumber}</Text>
        <Text style={styles.description}>{invoice.description}</Text>
      </View>

      <Text style={styles.title}>Choose a payment method</Text>
      <Text style={styles.subtitle}>Every option below creates a secure mock transaction for demonstration only.</Text>

      {methods.map((item) => (
        <TouchableOpacity key={item.value} activeOpacity={0.85} style={[styles.method, method === item.value && styles.activeMethod]} onPress={() => setMethod(item.value)}>
          <View style={[styles.methodIcon, method === item.value && styles.activeIcon]}><Ionicons name={item.icon} size={22} color={method === item.value ? '#FFFFFF' : '#175CD3'} /></View>
          <View style={styles.methodTextWrap}><Text style={styles.methodTitle}>{item.label}</Text><Text style={styles.methodHelp}>{item.help}</Text></View>
          <Ionicons name={method === item.value ? 'radio-button-on' : 'radio-button-off'} size={22} color={method === item.value ? '#175CD3' : '#98A2B3'} />
        </TouchableOpacity>
      ))}

      <View style={styles.security}><Ionicons name="lock-closed-outline" size={20} color="#027A48" /><Text style={styles.securityText}>No external gateway is contacted. The backend atomically marks the invoice paid and generates one transaction ID.</Text></View>

      <TouchableOpacity disabled={submitting} style={[styles.button, submitting && styles.disabled]} onPress={() => void pay()}>
        <Text style={styles.buttonText}>{submitting ? 'Processing payment…' : `Pay ₹${invoice.amount.toLocaleString('en-IN')}`}</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  amountCard: { backgroundColor: '#101828', borderRadius: 22, padding: 22, marginTop: 6 },
  eyebrow: { color: '#98A2B3', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  amount: { color: '#FFFFFF', fontSize: 34, fontWeight: '900', marginTop: 7 },
  invoice: { color: '#84ADFF', fontSize: 12, fontWeight: '900', marginTop: 13 },
  description: { color: '#D0D5DD', fontSize: 12, lineHeight: 18, marginTop: 5 },
  title: { color: '#101828', fontSize: 19, fontWeight: '900', marginTop: 25 },
  subtitle: { color: '#667085', fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 4 },
  method: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAECF0', borderRadius: 17, padding: 15, marginTop: 11 },
  activeMethod: { borderColor: '#84ADFF', backgroundColor: '#F5F8FF' },
  methodIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EFF4FF', alignItems: 'center', justifyContent: 'center' },
  activeIcon: { backgroundColor: '#175CD3' },
  methodTextWrap: { flex: 1 },
  methodTitle: { color: '#101828', fontSize: 13, fontWeight: '900' },
  methodHelp: { color: '#667085', fontSize: 10, marginTop: 4 },
  security: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#ECFDF3', borderRadius: 15, padding: 15, marginTop: 18 },
  securityText: { color: '#475467', fontSize: 10, lineHeight: 16, flex: 1 },
  button: { backgroundColor: '#175CD3', borderRadius: 14, paddingVertical: 17, alignItems: 'center', marginTop: 20 },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});
