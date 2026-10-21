import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CoteDeLAccueil } from '@/features/accueil/ferme/dernierCote';
import { colors } from '@/shared/theme/colors';
import { colonneCentree, useEchelle } from '@/shared/theme/miseEnPage';

export interface CoteDeLaFerme {
  cle: CoteDeLAccueil;
  titre: string;
}

interface Props {
  cotes: readonly CoteDeLaFerme[];
  actif: CoteDeLaFerme['cle'];
  onChoisir: (cle: CoteDeLaFerme['cle']) => void;
}

/**
 * La bascule du bas de l'accueil, juste au-dessus du bandeau (sous le pouce) : trois pastilles, l'exploitation, l'atelier (le travail du produit) et l'agritourisme.
 * L'accueil ouvre la scène de l'une d'elles ; un appui sur l'autre (ou un balayage de la scène) change de côté.
 */
export function BasculeFerme({ cotes, actif, onChoisir }: Props) {
  const echelle = useEchelle();
  return (
    <View style={styles.rail}>
      <View style={styles.bascule}>
        {cotes.map((c) => {
          const choisi = c.cle === actif;
          return (
            <Pressable
              key={c.cle}
              style={[styles.pastille, choisi ? styles.pastilleChoisie : null, { paddingVertical: Math.round(12 * echelle) }]}
              onPress={() => onChoisir(c.cle)}
              accessibilityRole="button"
              accessibilityState={{ selected: choisi }}
              accessibilityLabel={c.titre}
            >
              <Text
                style={[styles.texte, choisi ? styles.texteChoisi : null, { fontSize: Math.round(13 * echelle) }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {c.titre}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { paddingHorizontal: 12, paddingTop: 8, backgroundColor: colors.background },
  bascule: { ...colonneCentree, flexDirection: 'row', gap: 8 },
  pastille: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blanc,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingHorizontal: 6,
  },
  pastilleChoisie: { backgroundColor: colors.primary },
  texte: { fontWeight: '400', color: colors.primary },
  texteChoisi: { color: colors.blanc },
});
