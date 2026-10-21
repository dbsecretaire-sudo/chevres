import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Balade } from '@/features/accueil/ferme/animations';
import { Batiment, type PaletteDeBatiment } from '@/features/accueil/ferme/Batiment';
import { HAUTEUR_DE_MAISON, Maison } from '@/features/accueil/ferme/Maison';
import type { AncreBouton, EntreeDeColonne } from '@/features/accueil/ferme/typesFerme';
import type { CompteTransformation } from '@/features/accueil/services/transformationFerme';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.accueil.ferme.transformation;

/** Les symboles qui se baladent dans la rue, comme les chèvres de l'exploitation : le lait, la viande, le fromage. */
const SYMBOLES = [
  { cle: 'lait', emoji: '🥛' },
  { cle: 'viande', emoji: '🥩' },
  { cle: 'fromage', emoji: '🧀' },
];

const LIGNES_DU_CARRELAGE = 3;
const COLONNES_DU_CARRELAGE = 9;

/** Le sol carrelé de la Transformation : des carreaux clairs, séparés par un fin joint, qui remplissent tout le fond (`lignes` : combien de rangées). */
export function Carrelage({ lignes = LIGNES_DU_CARRELAGE }: { lignes?: number }) {
  return (
    <View style={styles.carrelage} pointerEvents="none">
      {Array.from({ length: lignes }, (_, ligne) => (
        <View key={ligne} style={styles.ligneDeCarreaux}>
          {Array.from({ length: COLONNES_DU_CARRELAGE }, (_, colonne) => (
            <View
              key={colonne}
              style={[styles.carreau, (ligne + colonne) % 2 === 0 ? styles.carreauClair : null]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

/** Les trois lignes de ce que la Transformation garde : les fromages, la boucherie et la charcuterie, la viande. */
function LignesDeTransformation({ compte }: { compte: CompteTransformation }) {
  const lignes = [
    { cle: 'fromages', texte: T.fromages(compte.fromages) },
    { cle: 'charcuterie', texte: T.charcuterie(compte.charcuterie) },
    { cle: 'viande', texte: T.viande(compte.viande) },
  ];
  return (
    <View style={styles.lignes}>
      {lignes.map((l) => (
        <Text key={l.cle} style={styles.ligne} numberOfLines={1}>
          {l.texte}
        </Text>
      ))}
    </View>
  );
}

/** La fromagerie : de l'inox, un toit gris, des compartiments clairs. */
const PALETTE_FROMAGERIE: PaletteDeBatiment = {
  toit: '#6E7A83',
  mur: '#E3E7EA',
  compartiment: '#F6F8F9',
  bord: '#9AA3AA',
};

/** Le nombre d'intervenants par rangée, de l'autre côté de la rue (trois colonnes). */
const PAR_RANGEE = 3;
/** La hauteur de la rue (étroite : juste ses tirets), et celle des trottoirs. */
const HAUTEUR_DE_LA_RUE = 84;
const TROTTOIR = 8;
const MARGE = 8;
/** La hauteur de la plaque blanche (le titre, les symboles et les trois comptes). */
const HAUTEUR_DE_LA_PLAQUE = 78;

interface Props {
  compte: CompteTransformation;
  /** Un appui sur la plaque : le stock de l'atelier (fromages, viande, emballages, matériel). */
  onAppui: () => void;
  /** Les intervenants, de l'autre côté de la rue, en rangées de trois : les moins utilisés en haut, les plus utilisés près de la rue. */
  intervenants: readonly EntreeDeColonne[];
  /** La gestion : les compartiments de la fromagerie. */
  gestion: readonly EntreeDeColonne[];
  onMaison: (cle: string) => void;
  onGestion: (cle: string, ancre: AncreBouton) => void;
}

const enRangees = <T,>(liste: readonly T[], taille: number): T[][] =>
  Array.from({ length: Math.ceil(liste.length / taille) }, (_, i) => liste.slice(i * taille, (i + 1) * taille));

/**
 * La scène « Travail du produit », sur tout l'écran, vue de la rue : de l'autre côté, les maisons des clients et des fournisseurs (la laiterie, les
 * particuliers, les surfaces commerciales, les entreprises, les emballages, le laboratoire) ; la rue, où se promènent le lait, la viande et le fromage
 * avec ce qu'on garde chez soi ; et de notre côté, la fromagerie, dont les compartiments sont les menus de la gestion.
 */
export function SceneTransformation({ compte, onAppui, intervenants, gestion, onMaison, onGestion }: Props) {
  const [hauteur, setHauteur] = useState(0);
  const [hauteurFromagerie, setHauteurFromagerie] = useState(200);
  const rangees = enRangees(intervenants, PAR_RANGEE);
  // Les logos rapetissent quand la scène est basse : toutes les rangées tiennent au-dessus de la rue, de la plaque et de l'atelier.
  const disponible = hauteur - HAUTEUR_DE_LA_RUE - 2 * TROTTOIR - HAUTEUR_DE_LA_PLAQUE - hauteurFromagerie - 4 * MARGE;
  const echelle =
    hauteur === 0 ? 1 : Math.max(0.62, Math.min(1.15, disponible / (rangees.length * (HAUTEUR_DE_MAISON + 8))));
  return (
    <View style={styles.scene} onLayout={(e) => setHauteur(Math.round(e.nativeEvent.layout.height))}>
      {/* De l'autre côté de la rue : les intervenants, trois par rangée. */}
      <View style={styles.ville}>
        {rangees.map((rangee, i) => (
          <View key={i} style={styles.rangee}>
            {rangee.map((e) => (
              <Maison key={e.cle} entree={e} echelle={echelle} onAppui={onMaison} />
            ))}
          </View>
        ))}
      </View>
      <View style={styles.trottoir} />
      {/* La rue : seulement ses tirets blancs au milieu. */}
      <View style={styles.rue}>
        <View style={styles.traits} pointerEvents="none">
          {Array.from({ length: 12 }, (_, i) => (
            <View key={i} style={styles.trait} />
          ))}
        </View>
      </View>
      <View style={styles.trottoir} />
      {/* Notre côté : le carrelage, et la fromagerie (son mur en inox et ses portes). */}
      <View style={styles.notreCote}>
        <Carrelage lignes={4} />
        {/* La plaque blanche, sur toute la largeur : ce qu'on garde chez soi (le titre et les symboles d'un côté, les trois comptes de l'autre). Un appui ouvre le stock. */}
        <Pressable style={styles.plaque} onPress={onAppui} accessibilityRole="button" accessibilityLabel={T.entrer}>
          <View style={styles.entete}>
            <Text style={styles.titre} numberOfLines={1}>
              {T.titre}
            </Text>
            <View style={styles.symboles}>
              {SYMBOLES.map((s, i) => (
                <Balade key={s.cle} amplitude={6} amplitudeY={5} duree={2400 + i * 500}>
                  <Text style={styles.symbole} accessibilityElementsHidden importantForAccessibility="no">
                    {s.emoji}
                  </Text>
                </Balade>
              ))}
            </View>
          </View>
          <LignesDeTransformation compte={compte} />
        </Pressable>
        <View style={styles.fromagerie}>
          <Batiment
            titre={T.fromagerie}
            entrees={gestion}
            onAppui={onGestion}
            palette={PALETTE_FROMAGERIE}
            surHauteur={setHauteurFromagerie}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    flex: 1,
    backgroundColor: '#E4E2DC',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#A9794A',
    overflow: 'hidden',
  },
  ville: { flex: 1, backgroundColor: '#DCE6EE', paddingHorizontal: MARGE, paddingVertical: MARGE, justifyContent: 'space-between' },
  rangee: { flexDirection: 'row', justifyContent: 'space-around' },
  trottoir: { height: TROTTOIR, backgroundColor: '#C9CCCF' },
  rue: { height: HAUTEUR_DE_LA_RUE, backgroundColor: '#7C858C', justifyContent: 'center' },
  traits: { position: 'absolute', left: 0, right: 0, top: HAUTEUR_DE_LA_RUE / 2 - 2, flexDirection: 'row', justifyContent: 'space-around' },
  trait: { width: 14, height: 4, backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 2 },
  plaque: {
    height: HAUTEUR_DE_LA_PLAQUE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: MARGE,
    borderWidth: 1,
    borderColor: '#D8DCDF',
  },
  entete: { alignItems: 'center', gap: 4 },
  symboles: { flexDirection: 'row', gap: 14 },
  symbole: { fontSize: 24 },
  titre: { fontSize: 13, fontWeight: '800', color: colors.primaryDark, textAlign: 'center' },
  lignes: { alignItems: 'flex-start', gap: 2, flexShrink: 1 },
  ligne: { fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  notreCote: { justifyContent: 'flex-end', padding: MARGE, paddingTop: MARGE },
  fromagerie: { alignSelf: 'stretch' },
  carrelage: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  ligneDeCarreaux: { flex: 1, flexDirection: 'row' },
  carreau: {
    flex: 1,
    backgroundColor: '#EBE8E1',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#BDB8AD',
  },
  carreauClair: { backgroundColor: '#F2F0EA' },
});
