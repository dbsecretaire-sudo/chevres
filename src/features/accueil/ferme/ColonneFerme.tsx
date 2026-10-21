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
type Taille = 'normal' | 'etroit' | 'moyen' | 'rangee' | 'cote';

interface Props {
  entrees: readonly EntreeDeColonne[];
  /** En grille : les boutons passent à la ligne et se centrent, au lieu de s'empiler dans une colonne qui défile. */
  grille?: boolean;
  /** Avec la grille : des boutons plus petits (six par ligne sur un téléphone), quand il y en a beaucoup. */
  compacte?: boolean;
  /** Les boutons les uns sous les autres, sur le côté d'une carte (sans texte, pour ne pas alourdir). */
  cote?: boolean;
  /**
   * Avec `cote` : la hauteur dont dispose la colonne (celle de la carte). Le nombre de boutons par ligne s'y adapte : deux quand ils tiennent
   * en hauteur (la carte garde sa largeur pour son dessin), trois sinon.
   */
  hauteurDisponible?: number;
  /** Avec `cote` : un titre au-dessus des boutons (« Intervenants »). */
  titre?: string;
  /** Sans le nom sous chaque bouton : le nom reste pour les lecteurs d'écran, et s'affiche quand on touche le bouton. */
  sansTitre?: boolean;
  /** En rangée : les boutons côte à côte, six par ligne au plus, chacun prenant une part égale de la largeur. */
  rangee?: boolean;
  /** Un appui sur un bouton, avec sa place à l'écran (mesurée dans la fenêtre). */
  onAppui: (cle: string, ancre: AncreBouton) => void;
}

export const LARGEUR_BOUTON_COTE = 48;
const HAUTEUR_BOUTON_COTE = 47;
export const ECART_COTE = 8;
const HAUTEUR_TITRE_COTE = 25;
/** L'écart le plus petit entre deux boutons d'une colonne unique, qui court sur toute la hauteur de la scène. */
const ECART_MIN_UNE_COLONNE = 4;

/**
 * Le nombre de boutons par ligne d'une colonne sur le côté d'une carte : le moins possible (deux) tant que tous tiennent dans la hauteur
 * dont dispose la carte, sinon trois. Une carte plus haute (un grand écran) a donc des boutons plus étroits en largeur, et plus de place pour
 * son dessin ; sans hauteur connue, trois.
 */
export function colonnesDuCote(nombre: number, hauteur?: number, avecTitre = true): number {
  if (hauteur === undefined) return 3;
  const reserve = avecTitre ? HAUTEUR_TITRE_COTE : 0;
  for (const colonnes of [1, 2, 3]) {
    const lignes = Math.ceil(nombre / colonnes);
    // Une seule colonne : les boutons se répartissent sur toute la hauteur, il suffit qu'ils tiennent avec un petit écart.
    const ecart = colonnes === 1 ? ECART_MIN_UNE_COLONNE : ECART_COTE;
    if (reserve + lignes * HAUTEUR_BOUTON_COTE + (lignes - 1) * ecart <= hauteur) return colonnes;
  }
  return 3;
}

function Bouton({
  entree,
  rang,
  onAppui,
  taille,
  sansTitre,
}: {
  entree: EntreeDeColonne;
  rang: number;
  onAppui: Props['onAppui'];
  taille: Taille;
  sansTitre: boolean;
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
          taille === 'moyen' ? styles.boutonMoyen : null,
          taille === 'cote' ? styles.boutonCote : null,
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
            taille === 'moyen' ? styles.rondMoyen : null,
            taille === 'cote' ? styles.rondCote : null,
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
        {sansTitre ? null : (
          <Text
            style={[
              styles.titre,
              enRangee ? styles.titreRangee : null,
              taille === 'moyen' ? styles.titreMoyen : null,
            ]}
            numberOfLines={enRangee ? 1 : taille === 'moyen' ? 3 : 2}
            adjustsFontSizeToFit={enRangee}
            minimumFontScale={0.7}
          >
            {entree.titre}
          </Text>
        )}
      </Pressable>
    </Apparition>
  );
}

/**
 * Des boutons ronds de l'accueil : les lieux de la ferme. Chaque bouton fait sortir ses actions en bulles. En colonne (qui défile seule quand
 * l'écran est court), en grille qui passe à la ligne, ou en rangée sur une seule ligne.
 */
export function ColonneFerme({
  entrees,
  onAppui,
  grille = false,
  rangee = false,
  compacte = false,
  cote = false,
  hauteurDisponible,
  titre,
  sansTitre = false,
}: Props) {
  if (cote) {
    const colonnes = colonnesDuCote(entrees.length, hauteurDisponible, !!titre);
    return (
      <View style={[styles.panneauCote, colonnes === 1 ? styles.panneauPleineHauteur : null]}>
        {titre ? <Text style={styles.titreCote}>{titre}</Text> : null}
        <View
          style={[
            styles.cote,
            { width: colonnes * LARGEUR_BOUTON_COTE + (colonnes - 1) * ECART_COTE + 4 },
            // Une colonne : elle court sur toute la hauteur, ses boutons répartis de haut en bas.
            colonnes === 1 ? styles.uneColonne : null,
          ]}
        >
          {entrees.map((e, i) => (
            <Bouton key={e.cle} entree={e} rang={i} onAppui={onAppui} taille="cote" sansTitre />
          ))}
        </View>
      </View>
    );
  }
  if (rangee) {
    return (
      <View style={styles.rangee}>
        {entrees.map((e, i) => (
          <Bouton key={e.cle} entree={e} rang={i} onAppui={onAppui} taille="rangee" sansTitre={sansTitre} />
        ))}
      </View>
    );
  }
  if (grille) {
    return (
      <View style={[styles.grille, compacte ? styles.grilleCompacte : null]}>
        {entrees.map((e, i) => (
          <Bouton
            key={e.cle}
            entree={e}
            rang={i}
            onAppui={onAppui}
            taille={compacte ? 'moyen' : 'etroit'}
            sansTitre={sansTitre}
          />
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
        <Bouton key={e.cle} entree={e} rang={i} onAppui={onAppui} taille="normal" sansTitre={sansTitre} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  colonne: { width: 92, flexGrow: 0 },
  // Sur le côté d'une carte : les boutons s'empilent, centrés, sans texte.
  // Sur le côté d'une carte : un titre, puis les boutons sur deux colonnes (sans texte).
  panneauCote: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  titreCote: { fontSize: 14, fontWeight: '800', color: colors.primaryDark },
  // Deux ou trois boutons par ligne selon la hauteur de la carte (`colonnesDuCote`) : la largeur est donnée à l'affichage.
  cote: { flexDirection: 'row', flexWrap: 'wrap', gap: ECART_COTE, justifyContent: 'center' },
  panneauPleineHauteur: { flex: 1, justifyContent: 'flex-start' },
  uneColonne: { flex: 1, flexDirection: 'column', flexWrap: 'nowrap', justifyContent: 'space-between', alignItems: 'center' },
  boutonCote: { width: 48 },
  rondCote: { width: 44, height: 44, borderRadius: 22, borderWidth: 2 },
  grille: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  grilleCompacte: { gap: 4, paddingVertical: 2 },
  // Six boutons au plus par ligne, chacun sur une part égale de la largeur ; le suivant passe à la ligne.
  rangee: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', rowGap: 8 },
  celluleRangee: { width: '16.6667%', minWidth: 0 },
  pile: { gap: 10, paddingVertical: 4, alignItems: 'center' },
  bouton: { width: 92, alignItems: 'center', gap: 3 },
  boutonEtroit: { width: 74 },
  boutonRangee: { width: '100%' },
  boutonMoyen: { width: 54 },
  rondMoyen: { width: 40, height: 40, borderRadius: 20, borderWidth: 2 },
  titreMoyen: { fontSize: 9, letterSpacing: -0.2 },
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

/** La largeur d'une colonne de boutons sur le côté d'une scène, selon son nombre de boutons par ligne. */
export const largeurDeLaColonneCote = (colonnes: number): number =>
  colonnes * LARGEUR_BOUTON_COTE + (colonnes - 1) * ECART_COTE + 4;
