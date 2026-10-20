import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { CompteTransformation } from '@/features/accueil/services/transformationFerme';
import { ROUTES } from '@/shared/constants/routes';
import { SECTION_STOCK } from '@/shared/constants/stock';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.accueil.ferme.transformation;

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
export function LignesDeTransformation({
  compte,
  grand = false,
}: {
  compte: CompteTransformation;
  grand?: boolean;
}) {
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
          <Text style={[styles.ligne, grand ? styles.ligneGrande : null]}>{l.texte}</Text>
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
}: {
  compte: CompteTransformation;
  onEntrer: () => void;
}) {
  return (
    <View style={styles.carte}>
      <View style={styles.cadre}>
        <Carrelage />
        <Text style={styles.titre}>{T.titre}</Text>
        <LignesDeTransformation compte={compte} />
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
  );
}

const styles = StyleSheet.create({
  carte: {
    flex: 1,
    backgroundColor: '#E1ECCB',
    borderRadius: 18,
    padding: 10,
    borderWidth: 2,
    borderColor: '#B8CC94',
  },
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
    gap: 10,
    padding: 14,
  },
  carrelage: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  ligneDeCarreaux: { flex: 1, flexDirection: 'row' },
  carreau: {
    flex: 1,
    backgroundColor: '#EBE8E1',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#BDB8AD',
  },
  carreauClair: { backgroundColor: '#F2F0EA' },
  titre: { fontSize: 17, fontWeight: '700', color: '#1F1F1F', textAlign: 'center' },
  lignes: { alignItems: 'center', gap: 2 },
  ligne: { fontSize: 15, fontWeight: '700', color: '#1F1F1F', textAlign: 'center' },
  ligneGrande: { fontSize: 18 },
  porte: {
    position: 'absolute',
    right: 0,
    bottom: 0,
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
