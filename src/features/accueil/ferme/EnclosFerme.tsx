import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Balade } from '@/features/accueil/ferme/animations';
import { categorieAccueil } from '@/features/accueil/services/statsAccueil';
import type { Chevre } from '@/features/cheptel/types';
import { CATEGORIE_ANIMAL } from '@/shared/constants/cheptel';
import { TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/constants/etablissements';
import { ROUTES } from '@/shared/constants/routes';
import { especeCourante, vocabulaire } from '@/shared/dictionnaire/animaux';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';

const T = TEXTES.accueil.ferme.zones;

/** Le dessin d'un animal de l'enclos, selon l'espèce de l'établissement (un dessin simple, remplaçable par une illustration). */
const DESSIN_PAR_ESPECE: Record<string, string> = {
  [TYPE_ANIMAL_ETABLISSEMENT.CHEVRES]: '🐐',
  [TYPE_ANIMAL_ETABLISSEMENT.BREBIS]: '🐑',
  [TYPE_ANIMAL_ETABLISSEMENT.POULES]: '🐔',
  [TYPE_ANIMAL_ETABLISSEMENT.COCHONS]: '🐖',
  [TYPE_ANIMAL_ETABLISSEMENT.VACHES]: '🐄',
  [TYPE_ANIMAL_ETABLISSEMENT.DOMESTIQUES]: '🐕',
};

interface Props {
  /** Les animaux qui représentent le troupeau dans l'enclos (jusqu'à quatre). */
  vedettes: readonly Chevre[];
  nombreAnimaux?: number;
  naissances?: number;
  /** Le troupeau est à l'estive : le décor passe de l'enclos à la montagne (sa zone, sa date de descente). */
  estive?: { zone?: string; descente?: string };
}

/** Un animal de l'enclos : son dessin (plus petit pour un petit), sa boucle en étiquette, et il se balade. */
function AnimalDeLEnclos({ animal, rang }: { animal: Chevre; rang: number }) {
  const petit = categorieAccueil(animal) === CATEGORIE_ANIMAL.CABRIT;
  const boucle = animal.numeroBoucle?.trim();
  return (
    <Balade amplitude={6 + (rang % 2) * 4} duree={2600 + rang * 700}>
      <View style={styles.animal}>
        <Text style={{ fontSize: petit ? 28 : 44 }} accessibilityElementsHidden importantForAccessibility="no">
          {DESSIN_PAR_ESPECE[especeCourante()] ?? '🐐'}
        </Text>
        {boucle ? (
          <View style={styles.etiquette}>
            <Text style={styles.etiquetteTexte}>{boucle.slice(-5)}</Text>
          </View>
        ) : null}
      </View>
    </Balade>
  );
}

/**
 * L'enclos du troupeau, au centre de la carte : l'espèce choisie, trois ou quatre animaux (leurs boucles) qui représentent le troupeau, et
 * l'effectif. Pendant la transhumance, des montagnes remplacent l'enclos. Un appui ouvre le menu du cheptel (animaux, naissances, lots d'animaux, santé, boucles).
 */
export function EnclosFerme({ vedettes, nombreAnimaux, naissances, estive }: Props) {
  const router = useRouter();
  const femelles = vocabulaire().femelle.pluriel;
  return (
    <Pressable
      style={[styles.enclos, estive ? styles.montagne : null]}
      onPress={() => router.push(ROUTES.CHEPTEL as never)}
      accessibilityRole="button"
      accessibilityLabel={estive ? T.estive(estive.zone) : T.enclos(femelles)}
    >
      {estive ? (
        <Text style={styles.sommets} accessibilityElementsHidden importantForAccessibility="no">
          🏔️ ⛰️ 🏔️
        </Text>
      ) : null}
      <Text style={styles.titre} numberOfLines={1}>
        {estive ? T.estive(estive.zone) : T.enclos(femelles)}
      </Text>
      {vedettes.length > 0 ? (
        <View style={styles.troupeau}>
          {vedettes.map((a, i) => (
            <AnimalDeLEnclos key={a.id} animal={a} rang={i} />
          ))}
        </View>
      ) : (
        <Text style={styles.vide}>{T.aucunAnimal}</Text>
      )}
      {estive?.descente ? <Text style={styles.descente}>{T.descenteLe(formatDateFR(estive.descente))}</Text> : null}
      <Text style={styles.effectif} numberOfLines={2}>
        {nombreAnimaux === undefined ? '…' : TEXTES.accueil.ferme.bandeau.animaux(nombreAnimaux)}
        {naissances ? ` · ${T.nes(naissances)}` : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  enclos: { flex: 1, backgroundColor: '#D9E8BE', borderRadius: 16, borderWidth: 3, borderColor: '#A9794A', borderStyle: 'dashed', padding: 8, gap: 4, alignItems: 'center', justifyContent: 'center' },
  montagne: { backgroundColor: '#C9DEEF', borderStyle: 'solid', borderColor: '#7F9DB8' },
  sommets: { fontSize: 30, letterSpacing: 2 },
  descente: { fontSize: 12, color: colors.primaryDark },
  titre: { fontSize: 14, fontWeight: '700', color: colors.primaryDark, textAlign: 'center' },
  troupeau: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end', gap: 6 },
  animal: { alignItems: 'center', gap: 2 },
  etiquette: { backgroundColor: '#F2C94C', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1, borderWidth: 1, borderColor: '#B58B1A' },
  etiquetteTexte: { fontSize: 11, fontWeight: '700', color: '#4A3A07' },
  vide: { fontSize: 13, color: colors.textMuted, paddingVertical: 16 },
  effectif: { fontSize: 13, fontWeight: '700', color: colors.primaryDark, textAlign: 'center' },
});
