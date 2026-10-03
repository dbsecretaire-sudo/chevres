import { Text, View } from 'react-native';
import { styles } from '@/shared/styles/components/Badge.styles';

export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}
