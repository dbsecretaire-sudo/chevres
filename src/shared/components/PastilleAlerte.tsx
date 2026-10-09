import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/components/PastilleAlerte.styles';

/** Une pastille ronde rouge avec un point d'exclamation : quelque chose, ici ou dedans, demande l'attention. */
export function PastilleAlerte({ taille = 22 }: { taille?: number }) {
  return (
    <View style={[styles.pastille, { width: taille, height: taille, borderRadius: taille / 2 }]}>
      <Ionicons name="alert" size={taille * 0.7} color={colors.blanc} />
    </View>
  );
}
