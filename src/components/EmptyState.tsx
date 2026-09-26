import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingVertical: 40, alignItems: 'center', gap: 6 },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});
