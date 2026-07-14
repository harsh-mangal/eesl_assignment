import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function QuantityStepper({ value, onChange, min = 1, max = 20 }: { value: number; onChange: (value: number) => void; min?: number; max?: number }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity disabled={value <= min} onPress={() => onChange(value - 1)} style={[styles.button, value <= min && styles.disabled]}>
        <Ionicons name="remove" size={20} color="#175CD3" />
      </TouchableOpacity>
      <Text style={styles.value}>{value}</Text>
      <TouchableOpacity disabled={value >= max} onPress={() => onChange(value + 1)} style={[styles.button, value >= max && styles.disabled]}>
        <Ionicons name="add" size={20} color="#175CD3" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  button: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#EFF4FF', alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.35 },
  value: { minWidth: 28, textAlign: 'center', color: '#101828', fontSize: 20, fontWeight: '900' },
});
