import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export function SummaryCard({
  label,
  value,
  icon,
  onPress,
}: {
  label: string;
  value: string | number;
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && onPress ? styles.cardPressed : undefined]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `Open ${label}` : label}
    >
      <View style={styles.cardHeader}>
        <View style={styles.icon}>
          <Ionicons name={icon} size={20} color="#175CD3" />
        </View>
        {onPress ? <Ionicons name="chevron-forward" size={17} color="#98A2B3" /> : null}
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48.5%',
    minHeight: 142,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },
  cardPressed: { opacity: 0.72 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontSize: 22, fontWeight: '800', color: '#101828' },
  label: { marginTop: 4, fontSize: 12, lineHeight: 17, color: '#667085' },
});
