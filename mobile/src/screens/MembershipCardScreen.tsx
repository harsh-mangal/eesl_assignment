import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { api, getApiError } from '../api/client';
import { LoadingView } from '../components/LoadingView';
import { Screen } from '../components/Screen';
import type { ApiResponse, MembershipCard } from '../types/api';

export function MembershipCardScreen() {
  const [card, setCard] = useState<MembershipCard | null>(null);

  useEffect(() => {
    api
      .get<ApiResponse<MembershipCard>>('/member/membership-card')
      .then((response) => setCard(response.data.data))
      .catch((error) => Alert.alert('Unable to load card', getApiError(error)));
  }, []);

  if (!card) return <LoadingView label="Preparing your digital card..." />;

  const active = card.membership.status === 'ACTIVE' && card.membership.digitalCardActive;

  return (
    <Screen>
      <Text style={styles.pageTitle}>Digital Membership Card</Text>
      <Text style={styles.pageSubtitle}>Present this QR code for membership verification.</Text>

      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.brandMark}><Text style={styles.brandText}>MS</Text></View>
          <View style={styles.brandCopy}>
            <Text style={styles.brandTitle}>{card.logoText}</Text>
            <Text style={styles.brandSubtitle}>DIGITAL MEMBER CARD</Text>
          </View>
          <View style={[styles.badge, !active && styles.badgeInactive]}>
            <Text style={styles.badgeText}>{card.membership.status}</Text>
          </View>
        </View>

        <View style={styles.memberRow}>
          <Image source={{ uri: card.member.profilePhotoUrl || 'https://i.pravatar.cc/200?img=12' }} style={styles.avatar} />
          <View style={styles.memberDetails}>
            <Text style={styles.name}>{card.member.fullName}</Text>
            <Text style={styles.memberCode}>{card.member.memberCode}</Text>
            <Text style={styles.type}>{card.membership.type} Member</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.validityRow}>
          <View>
            <Text style={styles.smallLabel}>VALID UNTIL</Text>
            <Text style={styles.value}>{new Date(card.membership.validUntil).toLocaleDateString()}</Text>
          </View>
          <View>
            <Text style={styles.smallLabel}>RFID STATUS</Text>
            <Text style={styles.value}>{card.rfid?.status ?? 'NOT ASSIGNED'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.qrCard}>
        <QRCode value={card.qrToken} size={190} backgroundColor="#FFFFFF" color="#101828" />
        <Text style={styles.qrTitle}>Membership verification QR</Text>
        <Text style={styles.qrToken} numberOfLines={1}>{card.qrToken}</Text>
      </View>

      <View style={[styles.info, active ? styles.infoValid : styles.infoInvalid]}>
        <Ionicons name={active ? 'checkmark-circle' : 'alert-circle'} size={22} color={active ? '#027A48' : '#B42318'} />
        <Text style={[styles.infoText, { color: active ? '#027A48' : '#B42318' }]}>
          {active ? 'Your digital membership card is active.' : 'This membership card is currently inactive.'}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontSize: 27, fontWeight: '900', color: '#101828', marginTop: 8 },
  pageSubtitle: { fontSize: 13, color: '#667085', marginTop: 5 },
  card: { backgroundColor: '#101828', borderRadius: 24, padding: 20, marginTop: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  brandMark: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  brandText: { color: '#101828', fontWeight: '900', fontSize: 15 },
  brandCopy: { flex: 1, marginLeft: 11 },
  brandTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  brandSubtitle: { color: '#98A2B3', fontSize: 8, letterSpacing: 1, marginTop: 2 },
  badge: { backgroundColor: '#039855', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  badgeInactive: { backgroundColor: '#D92D20' },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  memberRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24 },
  avatar: { width: 74, height: 74, borderRadius: 20, backgroundColor: '#344054' },
  memberDetails: { marginLeft: 15 },
  name: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  memberCode: { color: '#D0D5DD', fontSize: 12, marginTop: 5 },
  type: { color: '#84CAFF', fontSize: 12, fontWeight: '700', marginTop: 7 },
  divider: { height: 1, backgroundColor: '#344054', marginVertical: 20 },
  validityRow: { flexDirection: 'row', justifyContent: 'space-between' },
  smallLabel: { color: '#98A2B3', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  value: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', marginTop: 5 },
  qrCard: { backgroundColor: '#FFFFFF', borderRadius: 22, borderWidth: 1, borderColor: '#EAECF0', padding: 22, alignItems: 'center', marginTop: 16 },
  qrTitle: { color: '#101828', fontWeight: '800', fontSize: 15, marginTop: 16 },
  qrToken: { color: '#667085', fontSize: 10, marginTop: 6, width: '90%', textAlign: 'center' },
  info: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginTop: 14 },
  infoValid: { backgroundColor: '#ECFDF3' },
  infoInvalid: { backgroundColor: '#FEF3F2' },
  infoText: { flex: 1, fontSize: 12, fontWeight: '700', marginLeft: 9 },
});
