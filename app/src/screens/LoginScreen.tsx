import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api, getApiError } from '../api/client';
import { useAuthStore } from '../store/authStore';
import type { ApiResponse, MemberSession } from '../types/api';

function LoginScreen() {
  const setSession = useAuthStore((state) => state.setSession);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const cleanIdentifier = identifier.trim();

    if (!cleanIdentifier || !password.trim()) {
      Alert.alert(
        'Check your details',
        'Enter your email or Member ID and password.',
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Invalid password',
        'Password must contain at least 6 characters.',
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.post<
        ApiResponse<{
          accessToken: string;
          user: MemberSession;
        }>
      >('/auth/login', {
        identifier: cleanIdentifier,
        password,
      });

      const responseData = response.data?.data;

      if (!responseData?.accessToken || !responseData?.user) {
        throw new Error('Invalid login response received from the server.');
      }

      if (responseData.user.role !== 'MEMBER') {
        throw new Error(
          'This mobile application is only available for member accounts.',
        );
      }

      setSession(responseData.accessToken, responseData.user);
    } catch (error) {
      Alert.alert(
        'Login failed',
        getApiError(
          error,
          'Unable to sign in. Please check your credentials and try again.',
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.safe}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>MS</Text>
          </View>

          <Text style={styles.title}>Welcome back</Text>

          <Text style={styles.subtitle}>
            Sign in securely to access your member services.
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>Email or Member ID</Text>

            <TextInput
              style={styles.input}
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="Enter email or Member ID"
              placeholderTextColor="#98A2B3"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              editable={!submitting}
              returnKeyType="next"
            />

            <Text style={styles.label}>Password</Text>

            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#98A2B3"
                secureTextEntry={secure}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                editable={!submitting}
                returnKeyType="done"
                onSubmitEditing={() => {
                  void submit();
                }}
              />

              <Pressable
                onPress={() => setSecure((current) => !current)}
                disabled={submitting}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={secure ? 'Show password' : 'Hide password'}
              >
                <Ionicons
                  name={secure ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color="#667085"
                />
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && !submitting && styles.buttonPressed,
                submitting && styles.buttonDisabled,
              ]}
              onPress={() => {
                void submit();
              }}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Sign in</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/*
 * Both exports are provided so this screen works with:
 *
 * import LoginScreen from './LoginScreen';
 *
 * and:
 *
 * import { LoginScreen } from './LoginScreen';
 */
export { LoginScreen };
export default LoginScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },

  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 30,
  },

  logo: {
    width: 74,
    height: 74,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101828',
    borderRadius: 24,
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
  },

  title: {
    color: '#101828',
    fontSize: 32,
    fontWeight: '900',
  },

  subtitle: {
    maxWidth: 360,
    marginTop: 8,
    color: '#667085',
    fontSize: 15,
    lineHeight: 22,
  },

  form: {
    marginTop: 28,
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 20,
  },

  label: {
    marginTop: 8,
    marginBottom: 7,
    color: '#344054',
    fontSize: 13,
    fontWeight: '700',
  },

  input: {
    height: 50,
    paddingHorizontal: 14,
    color: '#101828',
    fontSize: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
  },

  passwordWrap: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 0,
    paddingRight: 12,
    color: '#101828',
    fontSize: 15,
  },

  button: {
    height: 52,
    marginTop: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#175CD3',
    borderRadius: 13,
  },

  buttonPressed: {
    opacity: 0.85,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});