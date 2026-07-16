import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, getApiError } from '../api/client';
import { useAuthStore } from '../store/authStore';
import type { ApiResponse, MemberSession } from '../types/api';

export function LoginScreen() {
  const setSession = useAuthStore((state) => state.setSession);

  const scrollViewRef = useRef<ScrollView>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const scrollToPassword = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: 110,
        animated: true,
      });
    }, Platform.OS === 'ios' ? 150 : 250);
  };

  const submit = async () => {
    const normalizedIdentifier = identifier.trim();

    if (!normalizedIdentifier) {
      Alert.alert(
        'Member ID required',
        'Please enter your email address or Member ID.',
      );
      return;
    }

    if (!password) {
      Alert.alert('Password required', 'Please enter your password.');
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Invalid password',
        'Your password must contain at least 6 characters.',
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post<
        ApiResponse<{
          accessToken: string;
          user: MemberSession;
        }>
      >('/auth/login', {
        identifier: normalizedIdentifier,
        password,
      });

      const { accessToken, user } = response.data.data;

      if (user.role !== 'MEMBER') {
        throw new Error(
          'Please use a member account in the mobile application.',
        );
      }

      setSession(accessToken, user);
    } catch (error) {
      Alert.alert(
        'Login failed',
        getApiError(error, 'Unable to sign in. Please try again.'),
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
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === 'ios' ? 'interactive' : 'on-drag'
          }
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          contentInsetAdjustmentBehavior="automatic"
        >
          <View style={styles.content}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>MS</Text>
            </View>

            <Text style={styles.title}>Welcome back</Text>

            <Text style={styles.subtitle}>
              Access all your member services from one application.
            </Text>

            <View style={styles.form}>
              <Text style={styles.label}>Email or Member ID</Text>

              <TextInput
                style={styles.input}
                value={identifier}
                onChangeText={setIdentifier}
                editable={!submitting}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => {
                  passwordInputRef.current?.focus();
                }}
                placeholder="Enter email or Member ID"
                placeholderTextColor="#98A2B3"
              />

              <Text style={styles.label}>Password</Text>

              <View style={styles.passwordWrap}>
                <TextInput
                  ref={passwordInputRef}
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  editable={!submitting}
                  secureTextEntry={secure}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="done"
                  onFocus={scrollToPassword}
                  onSubmitEditing={() => void submit()}
                  placeholder="Enter your password"
                  placeholderTextColor="#98A2B3"
                />

                <Pressable
                  style={styles.eyeButton}
                  onPress={() => setSecure((currentValue) => !currentValue)}
                  disabled={submitting}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={
                    secure ? 'Show password' : 'Hide password'
                  }
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
                  submitting && styles.disabled,
                ]}
                onPress={() => void submit()}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },

  keyboardView: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 60,
  },

  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
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
    paddingLeft: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
  },

  passwordInput: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    color: '#101828',
    fontSize: 15,
  },

  eyeButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
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

  disabled: {
    opacity: 0.65,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});