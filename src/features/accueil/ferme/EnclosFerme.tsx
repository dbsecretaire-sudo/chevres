import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Balade } from '@/features/accueil/ferme/animations';
import { DecorEnclos } from '@/features/accueil/ferme/DecorEnclos';
import { DecorEstive } from '@/features/accueil/ferme/DecorEstive';
import { categorieAccueil } from '@/features/accueil/services/statsAccueil';
import type { Chevre } from '@/features/cheptel/types';
import { CATEGORIE_ANIMAL } from '@/shared/constants/cheptel';
import { TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/constants/etablissements';
import { especeCourante } from '@/shared/dictionnaire/animaux';
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
  /** Un appui sur l'enclos : la page du cheptel. */
  onAppui: () => void;
  /** De quoi laisser la place des colonnes de boutons posées sur la scène, à gauche et à droite. */
  margeGauche?: number;
  margeDroite?: number;
  margeBas?: number;
  /** Sans son cadre (bord et coins arrondis) : la scène l'entoure elle-même, avec les maisons et la route. */
  sansCadre?: boolean;
}

/** Le dessin de l'espèce de l'établissement (la tête de chaque animal de la liste de la chèvrerie). */
export const dessinDeLEspece = (): string => DESSIN_PAR_ESPECE[especeCourante()] ?? '🐐';

/** Un animal de l'enclos : son dessin (plus petit pour un petit), sa boucle en étiquette, et il se balade. */
function AnimalDeLEnclos({ animal, rang }: { animal: Chevre; rang: number }) {
  const petit = categorieAccueil(animal) === CATEGORIE_ANIMAL.CABRIT;
  const boucle = animal.numeroBoucle?.trim();
  return (
    <Balade amplitude={14 + (rang % 2) * 8} amplitudeY={10 + (rang % 3) * 4} duree={2600 + rang * 700}>
      <View style={styles.animal}>
        <Text
          style={{ fontSize: petit ? 28 : 44 }}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
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
 * L'enclos du troupeau, au centre de l'accueil : l'espèce choisie, trois ou quatre animaux (leurs boucles) qui se promènent et représentent le
 * troupeau, et l'effectif. Pendant la transhumance, des montagnes remplacent l'enclos. Un appui fait sortir les bulles du cheptel ; la petite
 * porte entre dans la chèvrerie.
 */
export function EnclosFerme({
  vedettes,
  nombreAnimaux,
  naissances,
  estive,
  onAppui,
  margeGauche = 0,
  margeDroite = 0,
  margeBas = 0,
  sansCadre,
}: Props) {
  return (
    <View style={styles.conteneur}>
      <Pressable
        style={[
          styles.enclos,
          estive ? styles.montagne : null,
          sansCadre ? styles.sansCadre : null,
          { paddingLeft: 14 + margeGauche, paddingRight: 14 + margeDroite, paddingBottom: 14 + margeBas },
        ]}
        onPress={onAppui}
        accessibilityRole="button"
        accessibilityLabel={estive ? T.estive(estive.zone) : T.enclos}
      >
        {/* Le décor, fixe et en fond : sentier, arbres, maquis et fleurs ; en estive, montagnes, nuages et cailloux. */}
        {estive ? <DecorEstive /> : <DecorEnclos />}
        <Text style={styles.titre} numberOfLines={2}>
          {estive ? T.estive(estive.zone) : T.enclos}
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
        {estive?.descente ? (
          <Text style={styles.descente}>{T.descenteLe(formatDateFR(estive.descente))}</Text>
        ) : null}
        <Text style={styles.effectif} numberOfLines={2}>
          {nombreAnimaux === undefined ? '…' : TEXTES.accueil.ferme.bandeau.animaux(nombreAnimaux)}
          {naissances ? ` · ${T.nes(naissances)}` : ''}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1 },
  enclos: {
    flex: 1,
    backgroundColor: '#D9E8BE',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#A9794A',
    borderStyle: 'dashed',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  sansCadre: { borderWidth: 0, borderRadius: 0 },
  montagne: { backgroundColor: '#C9DEEF', borderStyle: 'solid', borderColor: '#7F9DB8' },
  descente: { fontSize: 12, color: colors.primaryDark },
  titre: { fontSize: 14, fontWeight: '700', color: colors.primaryDark, textAlign: 'center' },
  troupeau: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 22,
    paddingVertical: 14,
  },
  animal: { alignItems: 'center', gap: 2 },
  etiquette: {
    backgroundColor: '#F2C94C',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#B58B1A',
  },
  etiquetteTexte: { fontSize: 11, fontWeight: '700', color: '#4A3A07' },
  vide: { fontSize: 13, color: colors.textMuted, paddingVertical: 20 },
  effectif: { fontSize: 13, fontWeight: '700', color: colors.primaryDark, textAlign: 'center', marginTop: 6 },
});
