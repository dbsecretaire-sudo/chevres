import { Text, View, type ViewStyle } from 'react-native';
import { styles } from '@/shared/styles/components/BadgeAlerte.styles';

/** Un « ! » blanc dans un rond rouge : ce qui demande quelque chose (un document de circulation qui manque). Il se retrouve de la liste jusqu'à l'endroit où l'on agit. */
export function BadgeAlerte({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.badge, style]} accessibilityLabel="À faire">
      <Text style={styles.texte}>!</Text>
    </View>
  );
}
