import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api, getApiError } from '../api/client';
import { Screen } from '../components/Screen';
import { useAuthStore } from '../store/authStore';
import type { ApiResponse, MemberProfile } from '../types/api';

export function ProfileScreen() {
  const clearSession = useAuthStore((state) => state.clearSession);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<MemberProfile>>('/member/profile');
      const data = response.data.data;
      setProfile(data);
      setMobileNumber(data.mobileNumber);
      setEmail(data.email);
      setAddress(data.address);
    } catch (error) {
      Alert.alert('Unable to load profile', getApiError(error));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!mobileNumber.trim() || !email.trim() || !address.trim()) {
      Alert.alert('Incomplete profile', 'Email, mobile number and address are required.');
      return;
    }

    setSaving(true);
    try {
      const response = await api.patch<ApiResponse<MemberProfile>>('/member/profile', {
        mobileNumber: mobileNumber.trim(),
        email: email.trim(),
        address: address.trim(),
      });
      setProfile(response.data.data);
      Alert.alert('Profile updated', 'Your contact information has been saved.');
    } catch (error) {
      Alert.alert('Update failed', getApiError(error));
    } finally {
      setSaving(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <Screen refreshing={refreshing} onRefresh={() => void refresh()}>
      <Text style={styles.title}>My Profile</Text>
      <Text style={styles.subtitle}>Update your contact details. Membership fields are managed by administrators.</Text>

      <View style={styles.identityCard}>
        <Image
          source={{ uri: profile?.profilePhotoUrl || 'https://i.pravatar.cc/200?img=12' }}
          style={styles.avatar}
        />
        <View style={styles.identityText}>
          <Text style={styles.name}>{profile?.fullName ?? 'Loading...'}</Text>
          <Text style={styles.memberCode}>{profile?.memberCode ?? '—'}</Text>
          <Text style={styles.membership}>
            {profile?.membership?.membershipType ?? '—'} · {profile?.membership?.status ?? '—'}
          </Text>
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.label}>Email address</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

        <Text style={styles.label}>Mobile number</Text>
        <TextInput style={styles.input} value={mobileNumber} onChangeText={setMobileNumber} keyboardType="phone-pad" />

        <Text style={styles.label}>Address</Text>
        <TextInput style={[styles.input, styles.multiline]} value={address} onChangeText={setAddress} multiline textAlignVertical="top" />

        <Pressable style={[styles.primaryButton, saving && styles.disabled]} onPress={() => void save()} disabled={saving}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Save changes</Text>}
        </Pressable>
      </View>

      <View style={styles.readOnlyCard}>
        <Text style={styles.readOnlyTitle}>RFID status</Text>
        <Text style={styles.readOnlyValue}>{profile?.rfidRecord?.status ?? 'Not assigned'}</Text>
        <Text style={styles.readOnlyHint}>{profile?.rfidRecord?.referenceNumber ?? 'No RFID reference'}</Text>
      </View>

      <Pressable
        style={styles.logoutButton}
        onPress={() => Alert.alert('Logout', 'Are you sure you want to logout?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: clearSession },
        ])}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '900', color: '#101828', marginTop: 8 },
  subtitle: { fontSize: 13, color: '#667085', lineHeight: 20, marginTop: 6 },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101828',
    borderRadius: 20,
    padding: 18,
    marginTop: 20,
  },
  avatar: { width: 70, height: 70, borderRadius: 20, backgroundColor: '#EAECF0' },
  identityText: { marginLeft: 14, flex: 1 },
  name: { color: '#FFFFFF', fontSize: 19, fontWeight: '800' },
  memberCode: { color: '#D0D5DD', fontSize: 12, marginTop: 4 },
  membership: { color: '#84CAFF', fontSize: 12, fontWeight: '700', marginTop: 8 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#EAECF0', padding: 16, marginTop: 16 },
  label: { color: '#344054', fontSize: 12, fontWeight: '700', marginBottom: 7, marginTop: 9 },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 12, paddingHorizontal: 13, color: '#101828' },
  multiline: { minHeight: 92, paddingTop: 13 },
  primaryButton: { height: 50, borderRadius: 13, backgroundColor: '#175CD3', alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  primaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  disabled: { opacity: 0.65 },
  readOnlyCard: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#EAECF0', padding: 16, marginTop: 12 },
  readOnlyTitle: { color: '#667085', fontSize: 12 },
  readOnlyValue: { color: '#101828', fontSize: 18, fontWeight: '800', marginTop: 5 },
  readOnlyHint: { color: '#667085', fontSize: 12, marginTop: 4 },
  logoutButton: { height: 50, borderRadius: 13, borderWidth: 1, borderColor: '#F04438', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  logoutText: { color: '#D92D20', fontWeight: '800' },
});
