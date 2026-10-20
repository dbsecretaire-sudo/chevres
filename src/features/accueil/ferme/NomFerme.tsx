import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

/**
 * Le nom de l'établissement actif et son crayon, en carte sous le bandeau : un appui ouvre le choix de l'établissement. Il remplace
 * l'en-tête de l'écran (masqué sur l'accueil « ferme » pour gagner de la hauteur).
 */
export function NomFerme() {
  const { actif, ouvrirSelecteur } = useEtablissement();
  return (
    <Pressable
      style={styles.carte}
      onPress={ouvrirSelecteur}
      accessibilityRole="button"
      accessibilityLabel={TEXTES.etablissements.selecteurEtablissement.changerDEtablissement}
    >
      <Text style={styles.nom} numberOfLines={1}>
        {actif.nom}
      </Text>
      <Ionicons name="pencil" size={18} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carte: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  nom: { fontSize: 17, fontWeight: '700', color: colors.text, flexShrink: 1 },
});
