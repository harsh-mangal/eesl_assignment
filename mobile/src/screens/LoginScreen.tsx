import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api, getApiError } from '../api/client';
import { useAuthStore } from '../store/authStore';
import type { ApiResponse, MemberSession } from '../types/api';

export function LoginScreen() {
  const setSession = useAuthStore((state) => state.setSession);
  const [identifier, setIdentifier] = useState('MEM-1001');
  const [password, setPassword] = useState('Member@123');
  const [secure, setSecure] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!identifier.trim() || password.length < 6) {
      Alert.alert('Check your details', 'Enter your email or Member ID and password.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post<
        ApiResponse<{ accessToken: string; user: MemberSession }>
      >('/auth/login', { identifier: identifier.trim(), password });
      if (response.data.data.user.role !== 'MEMBER') {
        throw new Error('Use a member account in the mobile application.');
      }
      setSession(response.data.data.accessToken, response.data.data.user);
    } catch (error) {
      Alert.alert('Login failed', getApiError(error, 'Unable to sign in.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.logo}><Text style={styles.logoText}>MS</Text></View>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Access all your member services from one application.</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email or Member ID</Text>
          <TextInput
            style={styles.input}
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="MEM-1001"
            placeholderTextColor="#98A2B3"
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secure}
              placeholder="Enter password"
              placeholderTextColor="#98A2B3"
            />
            <Pressable onPress={() => setSecure((value) => !value)} hitSlop={12}>
              <Ionicons name={secure ? 'eye-outline' : 'eye-off-outline'} size={22} color="#667085" />
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, submitting && styles.disabled]}
            onPress={() => void submit()}
            disabled={submitting}
          >
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Sign in</Text>}
          </Pressable>
        </View>

        <Text style={styles.demo}>Demo: MEM-1001 / Member@123</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F8FB' },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: {
    width: 74,
    height: 74,
    borderRadius: 24,
    backgroundColor: '#101828',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoText: { color: '#FFFFFF', fontSize: 25, fontWeight: '900' },
  title: { fontSize: 32, fontWeight: '900', color: '#101828' },
  subtitle: { fontSize: 15, color: '#667085', lineHeight: 22, marginTop: 8, maxWidth: 360 },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EAECF0',
    marginTop: 28,
  },
  label: { fontSize: 13, fontWeight: '700', color: '#344054', marginBottom: 7, marginTop: 8 },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#101828',
    fontSize: 15,
  },
  passwordWrap: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  passwordInput: { flex: 1, color: '#101828', fontSize: 15 },
  button: {
    height: 52,
    borderRadius: 13,
    backgroundColor: '#175CD3',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  buttonPressed: { opacity: 0.85 },
  disabled: { opacity: 0.65 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  demo: { textAlign: 'center', color: '#667085', marginTop: 18, fontSize: 12 },
});
