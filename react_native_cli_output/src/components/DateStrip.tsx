import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { localDateKey } from '../utils/date';

export type DateOption = { value: string; weekday: string; day: string; month: string };

export function buildDateOptions(days: number, startOffset = 0): DateOption[] {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + startOffset + index);
    return {
      value: localDateKey(date),
      weekday: date.toLocaleDateString('en-IN', { weekday: 'short' }),
      day: String(date.getDate()),
      month: date.toLocaleDateString('en-IN', { month: 'short' }),
    };
  });
}

export function DateStrip({
  options,
  value,
  onChange,
  disabledBefore,
}: {
  options: DateOption[];
  value: string;
  onChange: (value: string) => void;
  disabledBefore?: string;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((option) => {
        const disabled = Boolean(disabledBefore && option.value <= disabledBefore);
        const active = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            style={[styles.item, active && styles.active, disabled && styles.disabled]}
          >
            <Text style={[styles.weekday, active && styles.activeText]}>{option.weekday}</Text>
            <Text style={[styles.day, active && styles.activeText]}>{option.day}</Text>
            <Text style={[styles.month, active && styles.activeText]}>{option.month}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 9, paddingVertical: 2, paddingRight: 12 },
  item: { width: 64, paddingVertical: 10, borderRadius: 15, alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAECF0' },
  active: { backgroundColor: '#175CD3', borderColor: '#175CD3' },
  disabled: { opacity: 0.35 },
  weekday: { color: '#667085', fontSize: 11, fontWeight: '700' },
  day: { color: '#101828', fontSize: 20, fontWeight: '900', marginVertical: 2 },
  month: { color: '#667085', fontSize: 11 },
  activeText: { color: '#FFFFFF' },
});
