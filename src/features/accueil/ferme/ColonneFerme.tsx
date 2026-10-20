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
  /** Le fond du bouton : le vert de la ferme (d'office), une autre couleur pour un achat, le stock… */
  couleur?: string;
}

/** La taille d'un bouton : normale (une colonne), étroite (une grille) ou en rangée (tous sur une ligne, à parts égales). */
type Taille = 'normal' | 'etroit' | 'rangee';

interface Props {
  entrees: readonly EntreeDeColonne[];
  /** En grille : les boutons passent à la ligne et se centrent, au lieu de s'empiler dans une colonne qui défile. */
  grille?: boolean;
  /** En rangée : tous les boutons sur une seule ligne, chacun prenant une part égale de la largeur. */
  rangee?: boolean;
  /** Un appui sur un bouton, avec sa place à l'écran (mesurée dans la fenêtre). */
  onAppui: (cle: string, ancre: AncreBouton) => void;
}

function Bouton({
  entree,
  rang,
  onAppui,
  taille,
}: {
  entree: EntreeDeColonne;
  rang: number;
  onAppui: Props['onAppui'];
  taille: Taille;
}) {
  const ref = useRef<View>(null);
  const appuyer = () => {
    // La place du bouton dans la fenêtre, pour que ses bulles sortent de lui.
    ref.current?.measureInWindow((x, y, largeur, hauteur) => onAppui(entree.cle, { x, y, largeur, hauteur }));
  };
  const enRangee = taille === 'rangee';
  return (
    <Apparition delai={rang * 70} style={enRangee ? styles.celluleRangee : undefined}>
      <Pressable
        style={[
          styles.bouton,
          taille === 'etroit' ? styles.boutonEtroit : null,
          enRangee ? styles.boutonRangee : null,
        ]}
        onPress={appuyer}
        accessibilityRole="button"
        accessibilityLabel={entree.titre}
      >
        <View
          ref={ref}
          collapsable={false}
          style={[
            styles.rond,
            taille === 'etroit' ? styles.rondEtroit : null,
            enRangee ? styles.rondRangee : null,
            { backgroundColor: entree.couleur ?? colors.primary },
          ]}
        >
          {entree.icone}
          {entree.pastille ? (
            <View style={styles.pastille}>
              <Text style={styles.pastilleTexte}>{entree.pastille}</Text>
            </View>
          ) : null}
        </View>
        <Text
          style={[styles.titre, enRangee ? styles.titreRangee : null]}
          numberOfLines={enRangee ? 1 : 2}
          adjustsFontSizeToFit={enRangee}
          minimumFontScale={0.7}
        >
          {entree.titre}
        </Text>
      </Pressable>
    </Apparition>
  );
}

/**
 * Des boutons ronds de l'accueil : les lieux de la ferme. Chaque bouton fait sortir ses actions en bulles. En colonne (qui défile seule quand
 * l'écran est court), en grille qui passe à la ligne, ou en rangée sur une seule ligne.
 */
export function ColonneFerme({ entrees, onAppui, grille = false, rangee = false }: Props) {
  if (rangee) {
    return (
      <View style={styles.rangee}>
        {entrees.map((e, i) => (
          <Bouton key={e.cle} entree={e} rang={i} onAppui={onAppui} taille="rangee" />
        ))}
      </View>
    );
  }
  if (grille) {
    return (
      <View style={styles.grille}>
        {entrees.map((e, i) => (
          <Bouton key={e.cle} entree={e} rang={i} onAppui={onAppui} taille="etroit" />
        ))}
      </View>
    );
  }
  return (
    <ScrollView
      style={styles.colonne}
      contentContainerStyle={styles.pile}
      showsVerticalScrollIndicator={false}
    >
      {entrees.map((e, i) => (
        <Bouton key={e.cle} entree={e} rang={i} onAppui={onAppui} taille="normal" />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  colonne: { width: 92, flexGrow: 0 },
  grille: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  rangee: { flexDirection: 'row', alignItems: 'flex-start' },
  celluleRangee: { flex: 1, minWidth: 0 },
  pile: { gap: 10, paddingVertical: 4, alignItems: 'center' },
  bouton: { width: 92, alignItems: 'center', gap: 3 },
  boutonEtroit: { width: 74 },
  boutonRangee: { width: '100%' },
  rondEtroit: { width: 56, height: 56, borderRadius: 28 },
  rondRangee: { width: 46, height: 46, borderRadius: 23, borderWidth: 2 },
  rond: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 3,
    borderColor: colors.blanc,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  titre: { fontSize: 12, fontWeight: '700', color: colors.text, textAlign: 'center' },
  // En rangée, chaque nom tient sur une ligne (et se réduit un peu si besoin) : jamais coupé au milieu d'un mot.
  titreRangee: { fontSize: 9, letterSpacing: -0.2 },
  pastille: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    paddingHorizontal: 5,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.blanc,
  },
  pastilleTexte: { color: colors.blanc, fontSize: 12, fontWeight: '800' },
});
