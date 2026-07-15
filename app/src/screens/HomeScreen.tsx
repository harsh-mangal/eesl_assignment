import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { api, getApiError } from '../api/client';
import { QuickAction } from '../components/QuickAction';
import { Screen } from '../components/Screen';
import { SummaryCard } from '../components/SummaryCard';
import type { RootStackParamList } from '../navigation/types';
import type { ApiResponse, MemberDashboard } from '../types/api';
import { useNotificationStore } from '../store/notificationStore';
import { resolveMediaUrl } from '../utils/media';

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [dashboard, setDashboard] = useState<MemberDashboard | null>(null);
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<MemberDashboard>>('/dashboard/member');
      setDashboard(response.data.data);
      setUnreadCount(response.data.data.summary.unreadNotifications);
    } catch (error) {
      Alert.alert('Unable to load dashboard', getApiError(error));
    }
  }, [setUnreadCount]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <Screen includeTopInset refreshing={refreshing} onRefresh={() => void refresh()}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>WELCOME BACK</Text>
          <Text style={styles.name}>{dashboard?.member.fullName ?? 'Member'}</Text>
          <Text style={styles.memberId}>{dashboard?.member.memberCode ?? 'Loading account...'}</Text>
        </View>
        <Image
          source={{ uri: resolveMediaUrl(dashboard?.member.profilePhotoUrl, 'https://i.pravatar.cc/200?img=12') }}
          style={styles.avatar}
        />
      </View>

      <View style={styles.membershipBanner}>
        <View>
          <Text style={styles.bannerLabel}>MEMBERSHIP</Text>
          <Text style={styles.bannerValue}>
            {dashboard?.membership?.membershipType ?? '—'} · {dashboard?.membership?.status ?? '—'}
          </Text>
          <Text style={styles.bannerDate}>
            Valid until {dashboard?.membership?.validUntil ? new Date(dashboard.membership.validUntil).toLocaleDateString() : '—'}
          </Text>
        </View>
        <View style={[styles.statusDot, dashboard?.membership?.status !== 'ACTIVE' && styles.statusDotInactive]} />
      </View>

      <Text style={styles.sectionTitle}>At a glance</Text>
      <View style={styles.summaryGrid}>
        <SummaryCard
          label="Outstanding invoices"
          value={`₹${(dashboard?.summary.outstandingInvoiceAmount ?? 0).toLocaleString('en-IN')}`}
          icon="receipt-outline"
          onPress={() => navigation.navigate('Invoices')}
        />
        <SummaryCard
          label="Upcoming bookings"
          value={dashboard?.summary.upcomingBookings ?? 0}
          icon="calendar-outline"
          onPress={() => navigation.navigate('MainTabs', { screen: 'Bookings' })}
        />
        <SummaryCard
          label="Upcoming events"
          value={dashboard?.summary.upcomingEvents ?? 0}
          icon="ticket-outline"
          onPress={() => navigation.navigate('MainTabs', { screen: 'Events' })}
        />
        <SummaryCard
          label="Unread notifications"
          value={unreadCount}
          icon="notifications-outline"
          onPress={() => navigation.navigate('MainTabs', { screen: 'Notifications' })}
        />
      </View>

      <Text style={styles.sectionTitle}>Quick services</Text>
      <QuickAction
        title="Digital Membership Card"
        subtitle="Membership QR and RFID status"
        icon="card-outline"
        onPress={() => navigation.navigate('MembershipCard')}
      />
      <QuickAction title="Invoices" subtitle="View dues, make simulated payments and open receipts" icon="receipt-outline" onPress={() => navigation.navigate('Invoices')} />
      <QuickAction title="Restaurant Booking" subtitle="Browse live slots and reserve a table" icon="restaurant-outline" onPress={() => navigation.navigate('RestaurantList')} />
      <QuickAction title="Room Booking" subtitle="Check date-range availability and book a stay" icon="bed-outline" onPress={() => navigation.navigate('RoomList')} />
      <QuickAction title="Events & Tickets" subtitle="Book free or paid events and receive a QR ticket" icon="ticket-outline" onPress={() => navigation.navigate('MainTabs', { screen: 'Events' })} />
      <QuickAction title="Library Account" subtitle="View issued books, dues and fines" icon="library-outline" onPress={() => navigation.navigate('LibraryAccount')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  headerText: { flex: 1 },
  eyebrow: { color: '#175CD3', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  name: { color: '#101828', fontSize: 28, fontWeight: '900', marginTop: 3 },
  memberId: { color: '#667085', fontSize: 13, marginTop: 3 },
  avatar: { width: 58, height: 58, borderRadius: 19, backgroundColor: '#EAECF0' },
  membershipBanner: {
    backgroundColor: '#101828',
    borderRadius: 20,
    marginTop: 22,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerLabel: { color: '#98A2B3', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  bannerValue: { color: '#FFFFFF', fontSize: 19, fontWeight: '800', marginTop: 6 },
  bannerDate: { color: '#D0D5DD', fontSize: 12, marginTop: 6 },
  statusDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#12B76A' },
  statusDotInactive: { backgroundColor: '#F04438' },
  sectionTitle: { color: '#101828', fontSize: 18, fontWeight: '800', marginTop: 26, marginBottom: 12 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
});
