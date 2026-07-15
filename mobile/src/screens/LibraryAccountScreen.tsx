import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api, getApiError } from '../api/client';
import { Screen } from '../components/Screen';
import type { AdditionalServiceAccount, ApiResponse } from '../types/api';

function numberDetail(details: Record<string, unknown>, key: string) {
  const value = details[key];
  return typeof value === 'number' ? value : 0;
}

function readableLabel(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (character) => character.toUpperCase());
}

export function LibraryAccountScreen() {
  const [account, setAccount] = useState<AdditionalServiceAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<AdditionalServiceAccount>>('/additional-services/LIBRARY');
      setAccount(response.data.data);
    } catch (error) {
      Alert.alert('Unable to load library account', getApiError(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const extraDetails = useMemo(() => {
    if (!account) return [];
    const featured = new Set(['booksIssued', 'booksDue', 'outstandingFine', 'borrowingLimit']);
    return Object.entries(account.details).filter(([key]) => !featured.has(key));
  }, [account]);

  if (loading && !account) {
    return <View style={styles.loading}><ActivityIndicator size="large" color="#175CD3" /></View>;
  }

  return (
    <Screen refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }}>
      <View style={styles.header}>
        <View style={styles.iconBox}><Ionicons name="library" size={30} color="#FFFFFF" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>ADDITIONAL SERVICE</Text>
          <Text style={styles.title}>Library account</Text>
          <Text style={styles.subtitle}>Live account information from the member-services database.</Text>
        </View>
      </View>

      <View style={styles.statusCard}>
        <View>
          <Text style={styles.statusLabel}>ACCOUNT STATUS</Text>
          <Text style={styles.statusValue}>{account?.effectiveStatus ?? 'UNAVAILABLE'}</Text>
          <Text style={styles.validity}>
            Valid until {account?.validUntil ? new Date(account.validUntil).toLocaleDateString() : 'No expiry date'}
          </Text>
        </View>
        <View style={[styles.statusDot, account?.effectiveStatus !== 'ACTIVE' && styles.inactiveDot]} />
      </View>

      <Text style={styles.sectionTitle}>Account summary</Text>
      <View style={styles.grid}>
        <Metric icon="book-outline" label="Books issued" value={numberDetail(account?.details ?? {}, 'booksIssued')} />
        <Metric icon="time-outline" label="Books due" value={numberDetail(account?.details ?? {}, 'booksDue')} />
        <Metric icon="cash-outline" label="Outstanding fine" value={`₹${numberDetail(account?.details ?? {}, 'outstandingFine').toLocaleString('en-IN')}`} />
        <Metric icon="layers-outline" label="Borrowing limit" value={numberDetail(account?.details ?? {}, 'borrowingLimit')} />
      </View>

      {extraDetails.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>More details</Text>
          <View style={styles.detailsCard}>
            {extraDetails.map(([key, value], index) => (
              <View key={key} style={[styles.detailRow, index < extraDetails.length - 1 && styles.detailBorder]}>
                <Text style={styles.detailLabel}>{readableLabel(key)}</Text>
                <Text style={styles.detailValue}>{Array.isArray(value) ? value.join(', ') : String(value ?? '—')}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color="#175CD3" />
        <Text style={styles.infoText}>This module is a database-backed mock integration and can later be replaced by a real library-management API.</Text>
      </View>
    </Screen>
  );
}

function Metric({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string | number }) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricIcon}><Ionicons name={icon} size={19} color="#175CD3" /></View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F8FB' },
  header: { flexDirection: 'row', gap: 14, alignItems: 'center', marginTop: 5 },
  iconBox: { width: 62, height: 62, borderRadius: 19, backgroundColor: '#175CD3', alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: '#175CD3', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  title: { color: '#101828', fontSize: 25, fontWeight: '900', marginTop: 2 },
  subtitle: { color: '#667085', fontSize: 12, lineHeight: 18, marginTop: 3 },
  statusCard: { marginTop: 24, backgroundColor: '#101828', borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusLabel: { color: '#98A2B3', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  statusValue: { color: '#FFFFFF', fontSize: 21, fontWeight: '900', marginTop: 7 },
  validity: { color: '#D0D5DD', fontSize: 12, marginTop: 6 },
  statusDot: { width: 13, height: 13, borderRadius: 7, backgroundColor: '#12B76A' },
  inactiveDot: { backgroundColor: '#F04438' },
  sectionTitle: { color: '#101828', fontSize: 17, fontWeight: '900', marginTop: 26, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  metric: { width: '48%', minHeight: 132, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAECF0', borderRadius: 18, padding: 15 },
  metricIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: '#EFF4FF', alignItems: 'center', justifyContent: 'center' },
  metricValue: { color: '#101828', fontSize: 23, fontWeight: '900', marginTop: 12 },
  metricLabel: { color: '#667085', fontSize: 11, fontWeight: '700', marginTop: 4 },
  detailsCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAECF0', borderRadius: 18, paddingHorizontal: 16 },
  detailRow: { paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  detailBorder: { borderBottomWidth: 1, borderBottomColor: '#EAECF0' },
  detailLabel: { color: '#667085', fontSize: 12 },
  detailValue: { color: '#101828', fontSize: 12, fontWeight: '800', flex: 1, textAlign: 'right' },
  infoCard: { backgroundColor: '#EFF4FF', borderRadius: 15, padding: 14, flexDirection: 'row', gap: 10, marginTop: 24 },
  infoText: { color: '#344054', fontSize: 11, lineHeight: 17, flex: 1 },
});
