import Ionicons from 'react-native-vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '../components/Screen';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentReceipt'>;

export function PaymentReceiptScreen({ route, navigation }: Props) {
  const { receipt, payment } = route.params.result;
  return (
    <Screen>
      <View style={styles.success}>
        <View style={styles.icon}><Ionicons name="checkmark" size={34} color="#FFFFFF" /></View>
        <Text style={styles.title}>Payment successful</Text>
        <Text style={styles.subtitle}>Your invoice and Admin Panel payment records have been updated.</Text>
      </View>

      <View style={styles.receipt}>
        <Text style={styles.eyebrow}>PAYMENT RECEIPT</Text>
        <Text style={styles.amount}>₹{receipt.amount.toLocaleString('en-IN')}</Text>
        <Text style={styles.invoice}>{receipt.invoiceNumber}</Text>
        <View style={styles.divider} />
        <View style={styles.row}><Text style={styles.key}>Member</Text><Text style={styles.value}>{receipt.memberName}</Text></View>
        <View style={styles.row}><Text style={styles.key}>Description</Text><Text style={styles.value}>{receipt.description}</Text></View>
        <View style={styles.row}><Text style={styles.key}>Transaction ID</Text><Text style={styles.smallValue}>{receipt.transactionId}</Text></View>
        <View style={styles.row}><Text style={styles.key}>Method</Text><Text style={styles.value}>{receipt.paymentMethod}</Text></View>
        <View style={styles.row}><Text style={styles.key}>Status</Text><Text style={styles.successValue}>{payment.status}</Text></View>
        <View style={styles.row}><Text style={styles.key}>Paid at</Text><Text style={styles.value}>{new Date(receipt.paidAt).toLocaleString()}</Text></View>
      </View>

      <TouchableOpacity style={styles.primary} onPress={() => navigation.navigate('Invoices')}><Text style={styles.primaryText}>Back to invoices</Text></TouchableOpacity>
      <TouchableOpacity style={styles.secondary} onPress={() => navigation.navigate('PaymentHistory')}><Text style={styles.secondaryText}>View payment history</Text></TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  success: { alignItems: 'center', marginTop: 14 },
  icon: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#12B76A', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#101828', fontSize: 25, fontWeight: '900', marginTop: 16 },
  subtitle: { color: '#667085', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6, maxWidth: 285 },
  receipt: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAECF0', borderRadius: 22, padding: 21, marginTop: 25 },
  eyebrow: { color: '#175CD3', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  amount: { color: '#101828', fontSize: 31, fontWeight: '900', marginTop: 10 },
  invoice: { color: '#667085', fontSize: 11, marginTop: 5 },
  divider: { height: 1, backgroundColor: '#EAECF0', marginVertical: 17 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginTop: 12 },
  key: { color: '#667085', fontSize: 11 },
  value: { color: '#101828', fontSize: 11, fontWeight: '800', textAlign: 'right', flex: 1 },
  smallValue: { color: '#101828', fontSize: 8, fontWeight: '700', textAlign: 'right', flex: 1 },
  successValue: { color: '#027A48', fontSize: 11, fontWeight: '900' },
  primary: { backgroundColor: '#175CD3', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  secondary: { borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 10 },
  secondaryText: { color: '#344054', fontSize: 14, fontWeight: '900' },
});
