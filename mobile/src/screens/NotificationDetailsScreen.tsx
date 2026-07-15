import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { api, getApiError } from '../api/client';
import { Screen } from '../components/Screen';
import type { RootStackParamList } from '../navigation/types';
import { useNotificationStore } from '../store/notificationStore';
import type { ApiResponse, MemberNotification, NotificationType } from '../types/api';

const icons: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  GENERAL: 'megaphone-outline',
  EVENT: 'ticket-outline',
  BOOKING_CONFIRMATION: 'checkmark-circle-outline',
  BOOKING_CANCELLATION: 'close-circle-outline',
  PAYMENT_REMINDER: 'card-outline',
  MEMBERSHIP_EXPIRY: 'hourglass-outline',
};

function formatType(type: NotificationType) {
  return type.split('_').map((part) => part[0] + part.slice(1).toLowerCase()).join(' ');
}

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationDetails'>;

export function NotificationDetailsScreen({ route }: Props) {
  const markOneRead = useNotificationStore((state) => state.markOneRead);
  const [notification, setNotification] = useState<MemberNotification | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<MemberNotification>>(`/notifications/${route.params.notificationId}`);
      let item = response.data.data;
      if (!item.isRead) {
        const readResponse = await api.patch<ApiResponse<MemberNotification>>(`/notifications/${item.id}/read`);
        item = readResponse.data.data;
        markOneRead();
      }
      setNotification(item);
    } catch (error) {
      Alert.alert('Unable to open notification', getApiError(error));
    } finally {
      setLoading(false);
    }
  }, [markOneRead, route.params.notificationId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <Screen><ActivityIndicator size="large" color="#175CD3" style={{ marginTop: 80 }} /></Screen>;
  if (!notification) return <Screen><Text style={styles.empty}>Notification could not be found.</Text></Screen>;

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.iconWrap}>
          <Ionicons name={icons[notification.type]} size={30} color="#175CD3" />
        </View>
        <Text style={styles.type}>{formatType(notification.type).toUpperCase()}</Text>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.date}>{new Date(notification.publishAt).toLocaleString([], { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
      </View>

      <View style={styles.messageCard}>
        <Text style={styles.message}>{notification.message}</Text>
      </View>

      <View style={styles.readState}>
        <Ionicons name="checkmark-done-circle" size={20} color="#027A48" />
        <View>
          <Text style={styles.readTitle}>Read</Text>
          <Text style={styles.readDate}>{notification.readAt ? new Date(notification.readAt).toLocaleString() : 'Just now'}</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: '#101828', borderRadius: 22, padding: 22, alignItems: 'flex-start' },
  iconWrap: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#EFF4FF', alignItems: 'center', justifyContent: 'center' },
  type: { color: '#84ADFF', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginTop: 18 },
  title: { color: '#FFFFFF', fontSize: 25, lineHeight: 32, fontWeight: '900', marginTop: 6 },
  date: { color: '#98A2B3', fontSize: 11, marginTop: 12 },
  messageCard: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#EAECF0', padding: 21, marginTop: 18 },
  message: { color: '#344054', fontSize: 15, lineHeight: 25 },
  readState: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ECFDF3', borderRadius: 16, padding: 15, marginTop: 14 },
  readTitle: { color: '#027A48', fontSize: 12, fontWeight: '900' },
  readDate: { color: '#039855', fontSize: 10, marginTop: 2 },
  empty: { color: '#667085', textAlign: 'center', marginTop: 80 },
});
