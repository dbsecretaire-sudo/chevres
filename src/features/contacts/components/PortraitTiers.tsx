import { StyleSheet, Text, View } from 'react-native';
import { Balade, Rebond } from '@/features/accueil/ferme/animations';
import { portraitDeTiers } from '@/features/contacts/services/portraitTiers';
import { colors } from '@/shared/theme/colors';

/**
 * Le portrait vivant d'un tiers, en tête de sa fiche : son dessin (un abattoir, une pompe, une trousse de vétérinaire…) qui rebondit à
 * l'ouverture puis se balade doucement, dans son décor, avec sa catégorie et sa balance.
 */
export function PortraitTiers({
  categorieId,
  categorie,
  balance,
}: {
  categorieId?: string;
  categorie?: string;
  balance?: string;
}) {
  const portrait = portraitDeTiers(categorieId);
  return (
    <View style={[styles.carte, { backgroundColor: portrait.fond }]}>
      <Text style={styles.decor} accessibilityElementsHidden importantForAccessibility="no">
        {portrait.decor}
      </Text>
      <Rebond declencheur>
        <Balade amplitude={5} duree={2400}>
          <Text style={styles.emoji} accessibilityElementsHidden importantForAccessibility="no">
            {portrait.emoji}
          </Text>
        </Balade>
      </Rebond>
      <View style={styles.pastilles}>
        {categorie ? (
          <View style={styles.pastille}>
            <Text style={styles.pastilleTexte}>{categorie}</Text>
          </View>
        ) : null}
        {balance ? (
          <View style={[styles.pastille, styles.pastilleBalance]}>
            <Text style={[styles.pastilleTexte, styles.pastilleBalanceTexte]}>{balance}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  carte: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
  },
  decor: { fontSize: 22, letterSpacing: 8, opacity: 0.85 },
  emoji: { fontSize: 64 },
  pastilles: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  pastille: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pastilleTexte: { fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  pastilleBalance: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  pastilleBalanceTexte: { color: colors.blanc },
});
