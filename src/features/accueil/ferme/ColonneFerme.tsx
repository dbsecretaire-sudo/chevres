import { useRef, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Apparition } from '@/features/accueil/ferme/animations';
import { colors } from '@/shared/theme/colors';

/** Où est un bouton à l'écran, au moment de l'appui (de quoi ouvrir ses bulles autour de lui). */
export interface AncreBouton {
  x: number;
  y: number;
  largeur: number;
  hauteur: number;
}

/** Un bouton d'une colonne : son dessin, son nom, et ce qui le distingue (une pastille de nombre, la couleur d'une urgence). */
export interface EntreeDeColonne {
  cle: string;
  icone: ReactNode;
  titre: string;
  /** Un nombre en pastille ronde sur le bouton (les rappels à valider). */
  pastille?: number;
  /** Le fond du bouton : le vert de la ferme (d'office), rouge quand quelque chose attend. */
  couleur?: string;
}

interface Props {
  entrees: readonly EntreeDeColonne[];
  /** En grille : les boutons passent à la ligne et se centrent (sous l'enclos), au lieu de s'empiler dans une colonne qui défile. */
  grille?: boolean;
  /** Un appui sur un bouton, avec sa place à l'écran (mesurée dans la fenêtre). */
  onAppui: (cle: string, ancre: AncreBouton) => void;
}

function Bouton({ entree, rang, onAppui, etroit = false }: { entree: EntreeDeColonne; rang: number; onAppui: Props['onAppui']; etroit?: boolean }) {
  const ref = useRef<View>(null);
  const appuyer = () => {
    // La place du bouton dans la fenêtre, pour que ses bulles sortent de lui.
    ref.current?.measureInWindow((x, y, largeur, hauteur) => onAppui(entree.cle, { x, y, largeur, hauteur }));
  };
  return (
    <Apparition delai={rang * 70}>
      <Pressable style={[styles.bouton, etroit ? styles.boutonEtroit : null]} onPress={appuyer} accessibilityRole="button" accessibilityLabel={entree.titre}>
        <View ref={ref} collapsable={false} style={[styles.rond, etroit ? styles.rondEtroit : null, { backgroundColor: entree.couleur ?? colors.primary }]}>
          {entree.icone}
          {entree.pastille ? (
            <View style={styles.pastille}>
              <Text style={styles.pastilleTexte}>{entree.pastille}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.titre} numberOfLines={2}>
          {entree.titre}
        </Text>
      </Pressable>
    </Apparition>
  );
}

/**
 * Une colonne de boutons ronds sur un côté de l'accueil : les lieux de la ferme. Chaque bouton fait sortir ses actions en bulles. La colonne
 * défile seule quand l'écran est court.
 */
export function ColonneFerme({ entrees, onAppui, grille = false }: Props) {
  if (grille) {
    return (
      <View style={styles.grille}>
        {entrees.map((e, i) => (
          <Bouton key={e.cle} entree={e} rang={i} onAppui={onAppui} etroit />
        ))}
      </View>
    );
  }
  return (
    <ScrollView style={styles.colonne} contentContainerStyle={styles.pile} showsVerticalScrollIndicator={false}>
      {entrees.map((e, i) => (
        <Bouton key={e.cle} entree={e} rang={i} onAppui={onAppui} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  colonne: { width: 92, flexGrow: 0 },
  grille: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  pile: { gap: 10, paddingVertical: 4, alignItems: 'center' },
  bouton: { width: 92, alignItems: 'center', gap: 3 },
  boutonEtroit: { width: 74 },
  rondEtroit: { width: 56, height: 56, borderRadius: 28 },
  rond: { width: 62, height: 62, borderRadius: 31, borderWidth: 3, borderColor: colors.blanc, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  titre: { fontSize: 12, fontWeight: '700', color: colors.text, textAlign: 'center' },
  pastille: { position: 'absolute', top: -6, right: -6, minWidth: 22, borderRadius: 11, backgroundColor: colors.danger, paddingHorizontal: 5, alignItems: 'center', borderWidth: 2, borderColor: colors.blanc },
  pastilleTexte: { color: colors.blanc, fontSize: 12, fontWeight: '800' },
});
