import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ColonneFerme, type AncreBouton, type EntreeDeColonne } from '@/features/accueil/ferme/ColonneFerme';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

interface Props {
  /** Le nom du lieu où l'on est (l'intérieur de l'exploitation, le travail du produit). */
  titre: string;
  /** Les boutons, ligne par ligne, et ce que fait un appui sur l'un d'eux. */
  lignes: readonly (readonly EntreeDeColonne[])[];
  onAppui: (cle: string, ancre: AncreBouton) => void;
  onSortir: () => void;
  /** La couleur du lieu : le filet du haut du panneau. */
  accent: string;
}

/**
 * Le panneau de boutons d'un intérieur, fixé en bas de l'écran, juste au-dessus de la barre du bas : c'est la zone que le pouce atteint sans
 * effort, et ces boutons sont ceux qu'on touche le plus. La porte « Sortir » y est aussi, à portée.
 */
export function PanneauInterieur({ titre, lignes, onAppui, onSortir, accent }: Props) {
  return (
    <View style={[styles.panneau, { borderTopColor: accent }]}>
      <View style={styles.tete}>
        <Pressable
          style={[styles.sortir, { borderColor: accent }]}
          onPress={onSortir}
          accessibilityRole="button"
          accessibilityLabel={TEXTES.accueil.ferme.chevrerie.sortir}
        >
          <Text style={styles.sortirEmoji}>🚪</Text>
          <Text style={styles.sortirTexte}>{TEXTES.accueil.ferme.chevrerie.sortir}</Text>
        </Pressable>
        <Text style={styles.titre} numberOfLines={1}>
          {titre}
        </Text>
      </View>
      {lignes.map((ligne, i) => (
        <ColonneFerme key={i} entrees={ligne} onAppui={onAppui} grille compacte />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panneau: {
    backgroundColor: colors.blanc,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 4,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
  },
  tete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sortir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.blanc,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 2,
  },
  sortirEmoji: { fontSize: 20 },
  sortirTexte: { fontSize: 14, fontWeight: '700', color: colors.text },
  titre: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.primaryDark, textAlign: 'right' },
});
