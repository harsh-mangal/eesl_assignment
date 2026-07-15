import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api, getApiError } from '../api/client';
import { Screen } from '../components/Screen';
import type { RootStackParamList } from '../navigation/types';
import { useNotificationStore } from '../store/notificationStore';
import type { ApiResponse, MemberNotification, NotificationListResult, NotificationType } from '../types/api';

const icons: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  GENERAL: 'megaphone-outline',
  EVENT: 'ticket-outline',
  BOOKING_CONFIRMATION: 'checkmark-circle-outline',
  BOOKING_CANCELLATION: 'close-circle-outline',
  PAYMENT_REMINDER: 'card-outline',
  MEMBERSHIP_EXPIRY: 'hourglass-outline',
};

const iconBackground: Record<NotificationType, string> = {
  GENERAL: '#EFF4FF',
  EVENT: '#F4EBFF',
  BOOKING_CONFIRMATION: '#ECFDF3',
  BOOKING_CANCELLATION: '#FEF3F2',
  PAYMENT_REMINDER: '#FFF6ED',
  MEMBERSHIP_EXPIRY: '#FFFBEA',
};

function formatType(type: NotificationType) {
  return type.split('_').map((part) => part[0] + part.slice(1).toLowerCase()).join(' ');
}

export function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [items, setItems] = useState<MemberNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<NotificationListResult>>('/notifications', {
        params: { filter, page: 1, limit: 100 },
      });
      setItems(response.data.data.items);
      setUnreadCount(response.data.data.unreadCount);
    } catch (error) {
      Alert.alert('Unable to load notifications', getApiError(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, setUnreadCount]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const markAll = () => {
    Alert.alert('Mark all as read?', 'All published notifications will be marked as read.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark all',
        onPress: async () => {
          setMarkingAll(true);
          try {
            await api.patch('/notifications/read-all');
            setUnreadCount(0);
            setItems((current) => filter === 'UNREAD' ? [] : current.map((item) => ({ ...item, isRead: true, readAt: new Date().toISOString() })));
          } catch (error) {
            Alert.alert('Unable to update notifications', getApiError(error));
          } finally {
            setMarkingAll(false);
          }
        },
      },
    ]);
  };

  return (
    <Screen refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }}>
      <View style={styles.headingRow}>
        <View style={styles.headingText}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>Announcements, booking updates and reminders sent to your membership account.</Text>
        </View>
        <TouchableOpacity style={styles.markAllButton} onPress={markAll} disabled={markingAll}>
          {markingAll ? <ActivityIndicator size="small" color="#175CD3" /> : <Ionicons name="checkmark-done" size={21} color="#175CD3" />}
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        {(['ALL', 'UNREAD'] as const).map((item) => (
          <TouchableOpacity key={item} style={[styles.filter, filter === item && styles.activeFilter]} onPress={() => setFilter(item)}>
            <Text style={[styles.filterText, filter === item && styles.activeFilterText]}>{item === 'ALL' ? 'All' : 'Unread'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#175CD3" style={{ marginTop: 70 }} />
      ) : items.map((notification) => (
        <TouchableOpacity
          key={notification.id}
          activeOpacity={0.86}
          style={[styles.card, !notification.isRead && styles.unreadCard]}
          onPress={() => navigation.navigate('NotificationDetails', { notificationId: notification.id })}
        >
          <View style={[styles.iconWrap, { backgroundColor: iconBackground[notification.type] }]}>
            <Ionicons name={icons[notification.type]} size={22} color="#175CD3" />
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.notificationTitle} numberOfLines={1}>{notification.title}</Text>
              {!notification.isRead && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.message} numberOfLines={2}>{notification.message}</Text>
            <View style={styles.metadata}>
              <Text style={styles.type}>{formatType(notification.type)}</Text>
              <Text style={styles.date}>{new Date(notification.publishAt).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#98A2B3" />
        </TouchableOpacity>
      ))}

      {!loading && items.length === 0 && (
        <View style={styles.empty}>
          <Ionicons name={filter === 'UNREAD' ? 'checkmark-done-circle-outline' : 'notifications-outline'} size={46} color="#98A2B3" />
          <Text style={styles.emptyTitle}>{filter === 'UNREAD' ? 'You are all caught up' : 'No notifications yet'}</Text>
          <Text style={styles.emptyText}>{filter === 'UNREAD' ? 'There are no unread notifications.' : 'New announcements and reminders will appear here.'}</Text>
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
  markAllButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EFF4FF', alignItems: 'center', justifyContent: 'center' },
  filters: { flexDirection: 'row', gap: 8, marginTop: 20, marginBottom: 2 },
  filter: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, backgroundColor: '#EAECF0' },
  activeFilter: { backgroundColor: '#175CD3' },
  filterText: { color: '#475467', fontSize: 11, fontWeight: '800' },
  activeFilterText: { color: '#FFFFFF' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#EAECF0', padding: 15, marginTop: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  unreadCard: { borderColor: '#B2CCFF', backgroundColor: '#F9FBFF' },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  notificationTitle: { color: '#101828', fontSize: 14, fontWeight: '900', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#175CD3' },
  message: { color: '#667085', fontSize: 11, lineHeight: 17, marginTop: 4 },
  metadata: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 8 },
  type: { color: '#175CD3', fontSize: 9, fontWeight: '900' },
  date: { color: '#98A2B3', fontSize: 9 },
  empty: { marginTop: 35, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAECF0', borderRadius: 20, alignItems: 'center', padding: 32 },
  emptyTitle: { color: '#344054', fontSize: 17, fontWeight: '900', marginTop: 13 },
  emptyText: { color: '#667085', marginTop: 6, textAlign: 'center', lineHeight: 20 },
});
