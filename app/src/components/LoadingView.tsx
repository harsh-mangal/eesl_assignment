import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export function LoadingView({ label = 'Loading member services...' }: { label?: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.logo}><Text style={styles.logoText}>MS</Text></View>
      <ActivityIndicator size="large" color="#175CD3" />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F8FB' },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#101828',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  logoText: { color: '#FFFFFF', fontSize: 25, fontWeight: '900' },
  text: { color: '#667085', marginTop: 14 },
});
