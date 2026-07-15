import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api, getApiError } from '../api/client';
import { Screen } from '../components/Screen';
import type { RootStackParamList } from '../navigation/types';
import type { ApiResponse, Invoice, InvoiceListResult } from '../types/api';
import { formatLocalDate } from '../utils/date';

type Props = NativeStackScreenProps<RootStackParamList, 'Invoices'>;
type Filter = 'ALL' | 'PAID' | 'UNPAID';

const statusStyle = (status: Invoice['status']) => {
  if (status === 'PAID') return { backgroundColor: '#ECFDF3', color: '#027A48' };
  if (status === 'OVERDUE') return { backgroundColor: '#FEF3F2', color: '#B42318' };
  if (status === 'UNPAID') return { backgroundColor: '#FFF6ED', color: '#C4320A' };
  return { backgroundColor: '#F2F4F7', color: '#667085' };
};

export function InvoicesScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<Filter>('ALL');
  const [data, setData] = useState<InvoiceListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<InvoiceListResult>>('/invoices', {
        params: { filter, page: 1, limit: 100 },
      });
      setData(response.data.data);
    } catch (error) {
      Alert.alert('Unable to load invoices', getApiError(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return (
    <Screen refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }}>
      <View style={styles.headingRow}>
        <View style={styles.headingText}>
          <Text style={styles.title}>Invoices</Text>
          <Text style={styles.subtitle}>Review dues, pay safely in simulation mode and open previous receipts.</Text>
        </View>
        <TouchableOpacity style={styles.historyButton} onPress={() => navigation.navigate('PaymentHistory')}>
          <Ionicons name="time-outline" size={20} color="#175CD3" />
        </TouchableOpacity>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryMain}>
          <Text style={styles.summaryLabel}>OUTSTANDING</Text>
          <Text style={styles.summaryValue}>₹{(data?.summary.outstandingAmount ?? 0).toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.summaryCount}>
          <Text style={styles.countValue}>{data?.summary.unpaidCount ?? 0}</Text>
          <Text style={styles.countLabel}>To pay</Text>
        </View>
        <View style={styles.summaryCount}>
          <Text style={styles.countValue}>{data?.summary.paidCount ?? 0}</Text>
          <Text style={styles.countLabel}>Paid</Text>
        </View>
      </View>

      <View style={styles.filters}>
        {(['ALL', 'UNPAID', 'PAID'] as Filter[]).map((item) => (
          <TouchableOpacity key={item} style={[styles.filter, filter === item && styles.activeFilter]} onPress={() => setFilter(item)}>
            <Text style={[styles.filterText, filter === item && styles.activeFilterText]}>{item[0] + item.slice(1).toLowerCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#175CD3" style={{ marginTop: 60 }} />
      ) : data?.items.map((invoice) => {
        const badge = statusStyle(invoice.status);
        return (
          <TouchableOpacity
            key={invoice.id}
            activeOpacity={0.86}
            style={styles.card}
            onPress={() => navigation.navigate('InvoiceDetails', { invoiceId: invoice.id })}
          >
            <View style={styles.cardTop}>
              <View style={styles.invoiceIcon}><Ionicons name="receipt-outline" size={22} color="#175CD3" /></View>
              <View style={styles.cardTitleWrap}>
                <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
                <Text style={styles.description} numberOfLines={2}>{invoice.description}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: badge.backgroundColor }]}>
                <Text style={[styles.badgeText, { color: badge.color }]}>{invoice.status}</Text>
              </View>
            </View>
            <View style={styles.cardBottom}>
              <View>
                <Text style={styles.dateLabel}>Due date</Text>
                <Text style={styles.dateValue}>{formatLocalDate(invoice.dueDate.slice(0, 10), { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
              </View>
              <View style={styles.amountWrap}>
                <Text style={styles.amount}>₹{invoice.amount.toLocaleString('en-IN')}</Text>
                <Ionicons name="chevron-forward" size={18} color="#98A2B3" />
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      {!loading && data?.items.length === 0 && (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={42} color="#98A2B3" />
          <Text style={styles.emptyTitle}>No invoices found</Text>
          <Text style={styles.emptyText}>There are no invoices in this filter.</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginTop: 4 },
  headingText: { flex: 1 },
  title: { color: '#101828', fontSize: 26, fontWeight: '900' },
  subtitle: { color: '#667085', fontSize: 14, lineHeight: 21, marginTop: 5 },
  historyButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EFF4FF', alignItems: 'center', justifyContent: 'center' },
  summary: { backgroundColor: '#101828', borderRadius: 20, padding: 18, marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  summaryMain: { flex: 1 },
  summaryLabel: { color: '#98A2B3', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  summaryValue: { color: '#FFFFFF', fontSize: 25, fontWeight: '900', marginTop: 5 },
  summaryCount: { alignItems: 'center', minWidth: 45 },
  countValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  countLabel: { color: '#98A2B3', fontSize: 9, marginTop: 3 },
  filters: { flexDirection: 'row', gap: 8, marginTop: 18 },
  filter: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 999, backgroundColor: '#EAECF0' },
  activeFilter: { backgroundColor: '#175CD3' },
  filterText: { color: '#475467', fontSize: 11, fontWeight: '800' },
  activeFilterText: { color: '#FFFFFF' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#EAECF0', padding: 16, marginTop: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  invoiceIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#EFF4FF', alignItems: 'center', justifyContent: 'center' },
  cardTitleWrap: { flex: 1 },
  invoiceNumber: { color: '#101828', fontSize: 14, fontWeight: '900' },
  description: { color: '#667085', fontSize: 11, lineHeight: 16, marginTop: 4 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  badgeText: { fontSize: 8, fontWeight: '900' },
  cardBottom: { borderTopWidth: 1, borderTopColor: '#EAECF0', marginTop: 14, paddingTop: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateLabel: { color: '#98A2B3', fontSize: 9, fontWeight: '800' },
  dateValue: { color: '#475467', fontSize: 11, fontWeight: '700', marginTop: 3 },
  amountWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  amount: { color: '#101828', fontSize: 17, fontWeight: '900' },
  empty: { marginTop: 35, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAECF0', borderRadius: 20, alignItems: 'center', padding: 30 },
  emptyTitle: { color: '#344054', fontSize: 17, fontWeight: '900', marginTop: 12 },
  emptyText: { color: '#667085', marginTop: 5 },
});
