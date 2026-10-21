import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Balade } from '@/features/accueil/ferme/animations';
import { Batiment, type PaletteDeBatiment } from '@/features/accueil/ferme/Batiment';
import { DecorPiqueNique, NuagesBlancs } from '@/features/accueil/ferme/DecorPiqueNique';
import { HAUTEUR_DE_MAISON, Maison } from '@/features/accueil/ferme/Maison';
import type { AncreBouton, EntreeDeColonne } from '@/features/accueil/ferme/typesFerme';
import type { CompteTransformation } from '@/features/accueil/services/transformationFerme';
import { colors } from '@/shared/theme/colors';
import { useEchelle } from '@/shared/theme/miseEnPage';
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

/** Ce que la plaque blanche montre : un titre, les symboles qui se baladent, et les lignes de comptes. */
export interface ContenuDePlaque {
  titre: string;
  symboles: readonly { cle: string; emoji: string }[];
  lignes: readonly { cle: string; texte: string }[];
}

/** Les trois lignes de ce que la Transformation garde : les fromages, la boucherie et la charcuterie, la viande. */
const lignesDeTransformation = (compte: CompteTransformation): ContenuDePlaque['lignes'] => [
  { cle: 'fromages', texte: T.fromages(compte.fromages) },
  { cle: 'charcuterie', texte: T.charcuterie(compte.charcuterie) },
  { cle: 'viande', texte: T.viande(compte.viande) },
];

/** Les lignes de comptes de la plaque, l'une sous l'autre. */
function LignesDePlaque({ lignes, echelle }: { lignes: ContenuDePlaque['lignes']; echelle: number }) {
  return (
    <View style={styles.lignes}>
      {lignes.map((l) => (
        <Text key={l.cle} style={[styles.ligne, { fontSize: Math.round(13 * echelle) }]} numberOfLines={1}>
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

/** La mise en scène : l'atelier (une rue, du carrelage, de l'inox) ou la campagne (un pique-nique, de l'herbe, du bois : l'agritourisme). */
export type DecorDeLaScene = 'atelier' | 'campagne';

/** L'accueil des visiteurs : du bois clair, un toit brun, des compartiments crème. */
const PALETTE_ACCUEIL: PaletteDeBatiment = {
  toit: '#8B5A2B',
  mur: '#F3E6CC',
  compartiment: '#FFF8E7',
  bord: '#C9A66B',
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
  compte?: CompteTransformation;
  /** Une autre plaque que celle de la Transformation (le côté Agritourisme) : son titre, ses symboles et ses comptes. */
  plaque?: ContenuDePlaque;
  /** Le décor : l'atelier d'office, ou la campagne (le côté Agritourisme). */
  decor?: DecorDeLaScene;
  /** Le nom du bâtiment de la gestion (d'office : l'atelier), et ce que dit un appui sur la plaque. */
  nomBatiment?: string;
  entrer?: string;
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
export function SceneTransformation({
  compte,
  decor = 'atelier',
  plaque,
  nomBatiment,
  entrer,
  onAppui,
  intervenants,
  gestion,
  onMaison,
  onGestion,
}: Props) {
  const contenu: ContenuDePlaque = plaque ?? {
    titre: T.titre,
    symboles: SYMBOLES,
    lignes: lignesDeTransformation(compte ?? { fromages: 0, charcuterie: 0, viande: 0 }),
  };
  // Sur un grand écran, les logos peuvent grandir au-delà de leur taille de téléphone, tant que la scène a la place.
  const agrandissement = useEchelle();
  const [hauteur, setHauteur] = useState(0);
  const [hauteurFromagerie, setHauteurFromagerie] = useState(200);
  // Quatre intervenants (l'agritourisme) se rangent par deux ; six (l'exploitation, l'atelier), par trois.
  const rangees = enRangees(intervenants, intervenants.length <= 4 ? 2 : PAR_RANGEE);
  // Les logos rapetissent quand la scène est basse : toutes les rangées tiennent au-dessus de la rue, de la plaque et de l'atelier.
  const campagne = decor === 'campagne';
  // La rue, la plaque et le bâtiment grandissent avec la fenêtre, comme les logos : aucune zone ne reste à sa taille de téléphone dans une grande scène.
  const hauteurRue = Math.round(HAUTEUR_DE_LA_RUE * agrandissement * (campagne ? 1.2 : 1));
  const hauteurPlaque = Math.round(HAUTEUR_DE_LA_PLAQUE * agrandissement);
  const disponible = hauteur - hauteurRue - (campagne ? 0 : 2 * TROTTOIR) - hauteurPlaque - hauteurFromagerie - 4 * MARGE;
  const echelle =
    hauteur === 0 ? 1 : Math.max(0.62, Math.min(1.35 * agrandissement, disponible / (rangees.length * (HAUTEUR_DE_MAISON + 8))));
  return (
    <View style={styles.scene} onLayout={(e) => setHauteur(Math.round(e.nativeEvent.layout.height))}>
      {/* De l'autre côté de la rue : les intervenants, trois par rangée. */}
      <View style={styles.ville}>
        {campagne ? <NuagesBlancs /> : null}
        {rangees.map((rangee, i) => (
          <View key={i} style={styles.rangee}>
            {rangee.map((e) => (
              <Maison key={e.cle} entree={e} echelle={echelle} onAppui={onMaison} />
            ))}
          </View>
        ))}
      </View>
      {campagne ? (
        // La campagne : un pré avec un pique-nique, à la place de la rue.
        <DecorPiqueNique hauteur={hauteurRue} echelle={agrandissement} />
      ) : (
        <>
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
        </>
      )}
      {/* Notre côté : le carrelage, et la fromagerie (son mur en inox et ses portes). */}
      <View style={[styles.notreCote, campagne ? styles.herbe : null]}>
        {campagne ? null : <Carrelage lignes={4} />}
        {/* La plaque blanche, sur toute la largeur : ce qu'on garde chez soi (le titre et les symboles d'un côté, les trois comptes de l'autre). Un appui ouvre le stock. */}
        <Pressable style={[styles.plaque, { height: hauteurPlaque }]} onPress={onAppui} accessibilityRole="button" accessibilityLabel={entrer ?? T.entrer}>
          <View style={styles.entete}>
            <Text style={[styles.titre, { fontSize: Math.round(13 * agrandissement) }]} numberOfLines={1}>
              {contenu.titre}
            </Text>
            <View style={styles.symboles}>
              {contenu.symboles.map((s, i) => (
                <Balade key={s.cle} amplitude={6} amplitudeY={5} duree={2400 + i * 500}>
                  <Text style={[styles.symbole, { fontSize: Math.round(24 * agrandissement) }]} accessibilityElementsHidden importantForAccessibility="no">
                    {s.emoji}
                  </Text>
                </Balade>
              ))}
            </View>
          </View>
          <LignesDePlaque lignes={contenu.lignes} echelle={agrandissement} />
        </Pressable>
        <View style={styles.fromagerie}>
          <Batiment
            titre={nomBatiment ?? T.fromagerie}
            entrees={gestion}
            onAppui={onGestion}
            palette={campagne ? PALETTE_ACCUEIL : PALETTE_FROMAGERIE}
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
  ville: { flex: 1, backgroundColor: '#DCE6EE', paddingHorizontal: MARGE, paddingVertical: MARGE, justifyContent: 'space-evenly' },
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
  herbe: { backgroundColor: '#DCEBC4' },
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
