import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Balade } from '@/features/accueil/ferme/animations';
import type { CompteTransformation } from '@/features/accueil/services/transformationFerme';
import { ROUTES } from '@/shared/constants/routes';
import { SECTION_STOCK } from '@/shared/constants/stock';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.accueil.ferme.transformation;

/** La hauteur au moins de chaque carte de l'accueil : de quoi loger la colonne de ses boutons (quatre au plus). */
export const HAUTEUR_MIN_DES_CARTES = 248;

/** Les symboles qui se baladent sur la carte, comme les chèvres de l'exploitation : le lait, la viande, le fromage. */
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

/** Les trois lignes de ce que la Transformation garde : les fromages, la boucherie et la charcuterie, la viande. Un appui ouvre la rubrique du stock. */
export function LignesDeTransformation({ compte }: { compte: CompteTransformation }) {
  const router = useRouter();
  const vers = (section: string) => router.push(`${ROUTES.COMPTABILITE_STOCKS}?onglet=${section}` as never);
  const lignes: { cle: string; texte: string; section: string }[] = [
    { cle: 'fromages', texte: T.fromages(compte.fromages), section: SECTION_STOCK.FROMAGES },
    { cle: 'charcuterie', texte: T.charcuterie(compte.charcuterie), section: SECTION_STOCK.VIANDE },
    { cle: 'viande', texte: T.viande(compte.viande), section: SECTION_STOCK.ANIMAUX },
  ];
  return (
    <View style={styles.lignes}>
      {lignes.map((l) => (
        <Pressable key={l.cle} onPress={() => vers(l.section)} accessibilityRole="button" hitSlop={4}>
          <Text style={styles.ligne} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            {l.texte}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/**
 * La carte « Transformation » de l'accueil, sous l'exploitation : un sol carrelé dans un cadre en pointillés, avec ce qu'on fabrique et garde
 * chez soi (les fromages, la boucherie et la charcuterie, la viande). La petite porte entre dans la transformation.
 */
export function TransformationFerme({
  compte,
  onEntrer,
  cote,
}: {
  compte: CompteTransformation;
  onEntrer: () => void;
  /** Les boutons de ceux qui y interviennent (la laiterie, les clients), en colonne à droite de la carte. */
  cote?: ReactNode;
}) {
  return (
    <View style={styles.carte}>
      <View style={styles.zone}>
        <View style={styles.cadre}>
          <Carrelage />
          {/* Le texte sur une bulle blanche translucide : il ressort du carrelage. */}
          <View style={styles.bulle}>
            <Text style={styles.titre} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
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
        <Pressable
          style={styles.porte}
          onPress={onEntrer}
          accessibilityRole="button"
          accessibilityLabel={T.entrer}
          hitSlop={6}
        >
          <Text style={styles.porteEmoji}>🚪</Text>
        </Pressable>
      </View>
      {cote}
    </View>
  );
}

const styles = StyleSheet.create({
  carte: {
    flex: 1,
    minHeight: HAUTEUR_MIN_DES_CARTES,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#E4E2DC',
    borderRadius: 18,
    padding: 10,
    borderWidth: 2,
    borderColor: '#BDB8AD',
  },
  zone: { flex: 1 },
  cadre: {
    flex: 1,
    minHeight: 130,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#A9794A',
    borderStyle: 'dashed',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  bulle: {
    maxWidth: '100%',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  symboles: { flexDirection: 'row', gap: 14, paddingVertical: 4 },
  symbole: { fontSize: 30 },
  carrelage: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  ligneDeCarreaux: { flex: 1, flexDirection: 'row' },
  carreau: {
    flex: 1,
    backgroundColor: '#EBE8E1',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#BDB8AD',
  },
  carreauClair: { backgroundColor: '#F2F0EA' },
  titre: { fontSize: 14, fontWeight: '700', color: colors.primaryDark, textAlign: 'center' },
  lignes: { alignItems: 'center', gap: 2 },
  ligne: { fontSize: 13, fontWeight: '700', color: colors.primaryDark, textAlign: 'center' },
  porte: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.blanc,
    borderWidth: 2,
    borderColor: '#A9794A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  porteEmoji: { fontSize: 24 },
});
