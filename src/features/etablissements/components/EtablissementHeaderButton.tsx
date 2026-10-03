import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { styles } from '@/shared/styles/etablissements/EtablissementHeaderButton.styles';
import { TEXTES } from '@/shared/textes';

/** Nom de l'établissement actif et crayon, dans l'en-tête de l'Accueil : ouvre le choix de l'établissement. */
export function EtablissementHeaderButton() {
  const { actif, ouvrirSelecteur } = useEtablissement();

  return (
    <Pressable
      style={styles.bouton}
      onPress={ouvrirSelecteur}
      hitSlop={8}
      accessibilityLabel={TEXTES.etablissements.selecteurEtablissement.changerDEtablissement}
    >
      <Text style={styles.nom} numberOfLines={1}>
        {actif.nom}
      </Text>
      <Ionicons name="pencil" size={18} color={colors.blanc} />
    </Pressable>
  );
}
