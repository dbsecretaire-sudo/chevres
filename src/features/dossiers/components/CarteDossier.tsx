import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/dossiers/Dossiers.styles';
import { commonStyles } from '@/shared/styles/commonStyles';

interface Props {
  titre: string;
  /** Une ligne d'information sous le titre (nombre de contenus…). */
  detail?: string;
  /** Une seconde ligne, en rouge (contenus à faire, en retard…). */
  alerte?: string;
  /** Deux cartes par ligne au lieu de trois : pour des noms plus longs. */
  large?: boolean;
  onPress: () => void;
}

/** Une carte de la grille : l'icône d'un dossier, son nom et ce qu'il contient. */
export function CarteDossier({ titre, detail, alerte, large, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.carte, large && styles.carteLarge, pressed && commonStyles.pressed]}
      onPress={onPress}
    >
      <Ionicons name="folder" size={26} color={colors.primary} />
      <Text style={styles.carteTitre} numberOfLines={3}>
        {titre}
      </Text>
      {detail ? <Text style={styles.carteDetail}>{detail}</Text> : null}
      {alerte ? <Text style={styles.carteAlerte}>{alerte}</Text> : null}
    </Pressable>
  );
}
