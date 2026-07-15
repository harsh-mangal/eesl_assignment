import Ionicons from 'react-native-vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api, getApiError } from '../api/client';
import { Screen } from '../components/Screen';
import type { RootStackParamList } from '../navigation/types';
import type { ApiResponse, Feedback } from '../types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Feedback'>;

const serviceLabels = {
  RESTAURANT: 'Restaurant experience',
  ROOM: 'Room stay',
  EVENT: 'Event experience',
} as const;

export function FeedbackScreen({ route, navigation }: Props) {
  const { serviceType, bookingId, bookingNumber, serviceName } = route.params;
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (rating < 1) {
      Alert.alert('Select a rating', 'Choose a rating from 1 to 5 stars.');
      return;
    }
    if (comments.trim().length < 3) {
      Alert.alert('Add a comment', 'Tell us a little more about your experience.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post<ApiResponse<Feedback>>('/feedback', {
        serviceType,
        bookingId,
        rating,
        comments: comments.trim(),
      });
      Alert.alert('Feedback submitted', 'Thank you for sharing your experience.', [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Unable to submit feedback', getApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.iconCircle}>
          <Ionicons name="chatbubble-ellipses-outline" size={28} color="#175CD3" />
        </View>
        <Text style={styles.title}>Rate your experience</Text>
        <Text style={styles.subtitle}>{serviceLabels[serviceType]}</Text>
      </View>

      <View style={styles.bookingCard}>
        <Text style={styles.label}>SERVICE</Text>
        <Text style={styles.serviceName}>{serviceName}</Text>
        <Text style={styles.bookingNumber}>{bookingNumber}</Text>
      </View>

      <Text style={styles.sectionTitle}>How was it?</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((value) => (
          <TouchableOpacity
            key={value}
            accessibilityRole="button"
            accessibilityLabel={`${value} star${value === 1 ? '' : 's'}`}
            onPress={() => setRating(value)}
            style={styles.starButton}
          >
            <Ionicons
              name={value <= rating ? 'star' : 'star-outline'}
              size={38}
              color={value <= rating ? '#F79009' : '#98A2B3'}
            />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.ratingText}>
        {rating === 0 ? 'Tap a star to rate' : `${rating} out of 5`}
      </Text>

      <Text style={styles.sectionTitle}>Comments</Text>
      <TextInput
        value={comments}
        onChangeText={setComments}
        placeholder="Share what went well or what could be improved…"
        placeholderTextColor="#98A2B3"
        multiline
        maxLength={2000}
        textAlignVertical="top"
        style={styles.input}
      />
      <Text style={styles.characterCount}>{comments.length}/2000</Text>

      <TouchableOpacity
        style={[styles.submitButton, (submitting || rating === 0) && styles.disabledButton]}
        disabled={submitting || rating === 0}
        onPress={() => void submit()}
      >
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="send-outline" size={18} color="#FFFFFF" />
            <Text style={styles.submitText}>Submit feedback</Text>
          </>
        )}
      </TouchableOpacity>
      <Text style={styles.note}>Feedback can be submitted once for each completed booking.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingTop: 8 },
  iconCircle: { width: 58, height: 58, borderRadius: 18, backgroundColor: '#EFF4FF', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#101828', fontSize: 25, fontWeight: '900', marginTop: 14 },
  subtitle: { color: '#667085', fontSize: 14, marginTop: 5 },
  bookingCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAECF0', borderRadius: 18, padding: 17, marginTop: 24 },
  label: { color: '#175CD3', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  serviceName: { color: '#101828', fontSize: 18, fontWeight: '900', marginTop: 7 },
  bookingNumber: { color: '#667085', fontSize: 12, marginTop: 4 },
  sectionTitle: { color: '#344054', fontSize: 14, fontWeight: '900', marginTop: 24, marginBottom: 10 },
  stars: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAECF0', borderRadius: 18, paddingHorizontal: 10, paddingVertical: 15 },
  starButton: { padding: 3 },
  ratingText: { color: '#667085', textAlign: 'center', fontSize: 12, marginTop: 8 },
  input: { minHeight: 140, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 16, padding: 15, color: '#101828', fontSize: 14, lineHeight: 21 },
  characterCount: { color: '#98A2B3', textAlign: 'right', fontSize: 11, marginTop: 6 },
  submitButton: { backgroundColor: '#175CD3', borderRadius: 14, minHeight: 52, marginTop: 22, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  disabledButton: { opacity: 0.55 },
  submitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  note: { color: '#667085', fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 12 },
});
