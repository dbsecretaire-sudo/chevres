import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ColonneFerme, type AncreBouton, type EntreeDeColonne } from '@/features/accueil/ferme/ColonneFerme';
import { Carrelage, LignesDeTransformation } from '@/features/accueil/ferme/TransformationFerme';
import type { CompteTransformation } from '@/features/accueil/services/transformationFerme';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.accueil.ferme.transformation;

interface Props {
  compte: CompteTransformation;
  onSortir: () => void;
  /** Les boutons de la transformation (fromagerie, viande, charcuterie, stock) et ce que fait un appui sur l'un d'eux. */
  boutons: readonly EntreeDeColonne[];
  onAppuiBouton: (cle: string, ancre: AncreBouton) => void;
}

/**
 * L'intérieur de la transformation : le sol carrelé, où l'on fabrique le fromage, découpe la viande et prépare la charcuterie. En haut, les
 * boutons de ces ateliers et du stock ; dessous, ce qu'on y garde. Un autre décor que celui de la chèvrerie.
 */
export function TransformationInterieure({ compte, onSortir, boutons, onAppuiBouton }: Props) {
  return (
    <View style={styles.fond}>
      <Carrelage lignes={10} />
      <View style={styles.contenu}>
        <View style={styles.tete}>
          <Pressable
            style={styles.sortir}
            onPress={onSortir}
            accessibilityRole="button"
            accessibilityLabel={TEXTES.accueil.ferme.chevrerie.sortir}
          >
            <Text style={styles.sortirEmoji}>🚪</Text>
            <Text style={styles.sortirTexte}>{TEXTES.accueil.ferme.chevrerie.sortir}</Text>
          </Pressable>
          <Text style={styles.titre}>{T.titre}</Text>
        </View>
        <View style={styles.boutons}>
          <ColonneFerme entrees={boutons} onAppui={onAppuiBouton} grille />
        </View>
        <View style={styles.garde}>
          <LignesDeTransformation compte={compte} grand />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1, backgroundColor: '#EBE8E1' },
  contenu: { padding: 8, gap: 10 },
  tete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sortir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.blanc,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: '#A9794A',
  },
  sortirEmoji: { fontSize: 20 },
  sortirTexte: { fontSize: 13, fontWeight: '700', color: colors.text },
  titre: { fontSize: 16, fontWeight: '700', color: '#1F1F1F' },
  boutons: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 16, padding: 6 },
  garde: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 16, paddingVertical: 18 },
});
