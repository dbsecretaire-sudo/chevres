import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Balade } from '@/features/accueil/ferme/animations';
import { DecorFromagerie } from '@/features/accueil/ferme/DecorFromagerie';
import type { CompteTransformation } from '@/features/accueil/services/transformationFerme';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.accueil.ferme.transformation;

/** Les symboles qui se baladent sur la scène, comme les chèvres de l'exploitation : le lait, la viande, le fromage. */
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
        <Text key={l.cle} style={styles.ligne} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
          {l.texte}
        </Text>
      ))}
    </View>
  );
}

interface Props {
  compte: CompteTransformation;
  /** Un appui sur la scène : le stock de la fromagerie (fromages, viande, emballages, matériel). */
  onAppui: () => void;
  /** De quoi laisser la place des colonnes de boutons posées sur la scène, à gauche et à droite. */
  margeGauche: number;
  margeDroite: number;
}

/**
 * La scène « Travail du produit », sur tout l'écran : la fromagerie, son mur en inox (frigo, évier, armoires) et son sol carrelé, avec au milieu
 * ce qu'on fabrique et garde chez soi (les fromages, la boucherie et la charcuterie, la viande). Les colonnes de boutons se posent sur ses côtés.
 */
export function SceneTransformation({ compte, onAppui, margeGauche, margeDroite }: Props) {
  return (
    <View style={styles.scene}>
      <Pressable
        style={styles.plein}
        onPress={onAppui}
        accessibilityRole="button"
        accessibilityLabel={T.entrer}
      >
        <Carrelage lignes={8} />
        <View pointerEvents="none">
          <DecorFromagerie echelle={1} />
        </View>
        <View style={[styles.milieu, { paddingLeft: margeGauche, paddingRight: margeDroite }]}>
          {/* Le texte sur une bulle blanche translucide : il ressort du carrelage. */}
          <View style={styles.bulle}>
            <Text style={styles.titre} numberOfLines={2}>
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
            <LignesDeTransformation compte={compte} />
          </View>
        </View>
      </Pressable>
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
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  plein: { flex: 1 },
  milieu: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 8 },
  bulle: {
    maxWidth: '100%',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  symboles: { flexDirection: 'row', gap: 14, paddingVertical: 2 },
  symbole: { fontSize: 26 },
  carrelage: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  ligneDeCarreaux: { flex: 1, flexDirection: 'row' },
  carreau: {
    flex: 1,
    backgroundColor: '#EBE8E1',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#BDB8AD',
  },
  carreauClair: { backgroundColor: '#F2F0EA' },
  titre: { fontSize: 13, fontWeight: '700', color: colors.primaryDark, textAlign: 'center' },
  lignes: { alignItems: 'center', gap: 2 },
  ligne: { fontSize: 12, fontWeight: '700', color: colors.primaryDark, textAlign: 'center' },
});
