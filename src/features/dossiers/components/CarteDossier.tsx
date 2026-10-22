import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/dossiers/Dossiers.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

interface Props {
  titre: string;
  /** Une ligne d'information sous le titre (nombre de contenus…). */
  detail?: string;
  /** Une seconde ligne, en rouge (contenus à faire, en retard…). */
  alerte?: string;
  /** Vrai quand il reste à facturer (la note d'un client) : un point d'exclamation rouge et « À facturer ». */
  aFacturer?: boolean;
  /** Deux cartes par ligne au lieu de trois : pour des noms plus longs. */
  large?: boolean;
  /** Un autre dessin que le dossier (la carte « + » d'un nouveau dossier). */
  icone?: keyof typeof Ionicons.glyphMap;
  /** La carte d'un client (une personne) plutôt que celle d'un dossier. */
  client?: boolean;
  onPress: () => void;
}

/** Une carte de la grille : l'icône d'un dossier ou d'une personne (client), son nom et ce qu'il contient. */
export function CarteDossier({ titre, detail, alerte, aFacturer, large, client, icone, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.carte, large && styles.carteLarge, pressed && commonStyles.pressed]}
      onPress={onPress}
    >
      <Ionicons name={icone ?? (client ? 'person' : 'folder')} size={26} color={colors.primary} />
      <Text style={styles.carteTitre} numberOfLines={3}>
        {titre}
      </Text>
      {detail ? <Text style={styles.carteDetail}>{detail}</Text> : null}
      {alerte ? <Text style={styles.carteAlerte}>{alerte}</Text> : null}
      {aFacturer ? (
        <View style={styles.carteAFacturer}>
          <Ionicons name="alert-circle" size={16} color={colors.danger} />
          <Text style={styles.carteAlerte}>{TEXTES.dossiers.explorateur.aFacturer}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
