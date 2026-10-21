import { StyleSheet, View } from 'react-native';
import { ColonneFerme, type AncreBouton, type EntreeDeColonne } from '@/features/accueil/ferme/ColonneFerme';
import { colors } from '@/shared/theme/colors';
import { colonneCentree } from '@/shared/theme/miseEnPage';

interface Props {
  /** Les boutons, ligne par ligne, et ce que fait un appui sur l'un d'eux. */
  lignes: readonly (readonly EntreeDeColonne[])[];
  onAppui: (cle: string, ancre: AncreBouton) => void;
  /** La couleur du lieu : le filet du haut du panneau. */
  accent: string;
}

/**
 * Le panneau de boutons d'un intérieur, fixé en bas de l'écran, juste au-dessus du bandeau : c'est la zone que le pouce atteint sans effort, et
 * ces boutons sont ceux qu'on touche le plus. Rien d'autre que les boutons : ni titre (on sait où l'on est), ni porte « Sortir » (la maison du
 * bandeau, juste dessous, ramène à l'accueil) ; le panneau garde ainsi presque toute la hauteur à la liste.
 */
export function PanneauInterieur({ lignes, onAppui, accent }: Props) {
  return (
    <View style={[styles.panneau, { borderTopColor: accent }]}>
      {lignes.map((ligne, i) => (
        <ColonneFerme key={i} entrees={ligne} onAppui={onAppui} grille compacte />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panneau: {
    // De la largeur de la colonne de l'application, centré, même dans une grande fenêtre.
    ...colonneCentree,
    backgroundColor: colors.blanc,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 4,
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 2,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
  },
});
