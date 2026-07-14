import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';

export function ModulePlaceholderScreen({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.iconWrap}><Ionicons name={icon} size={34} color="#175CD3" /></View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.phaseBadge}><Text style={styles.phaseText}>NEXT BUILD PHASE</Text></View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  iconWrap: { width: 78, height: 78, borderRadius: 24, backgroundColor: '#EFF8FF', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#101828', fontSize: 25, fontWeight: '900', marginTop: 22 },
  description: { color: '#667085', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8, maxWidth: 330 },
  phaseBadge: { backgroundColor: '#EAF2FF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, marginTop: 18 },
  phaseText: { color: '#175CD3', fontWeight: '800', fontSize: 10, letterSpacing: 0.8 },
});
