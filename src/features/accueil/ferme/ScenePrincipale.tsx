import { Fragment, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Apparition, Balade } from '@/features/accueil/ferme/animations';
import { categorieAccueil } from '@/features/accueil/services/statsAccueil';
import type { Chevre } from '@/features/cheptel/types';
import { CATEGORIE_ANIMAL } from '@/shared/constants/cheptel';
import { TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/constants/etablissements';
import { ROUTES } from '@/shared/constants/routes';
import { especeCourante, vocabulaire } from '@/shared/dictionnaire/animaux';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

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
  lotsAFacturer: number;
  lotsARappeler: number;
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

/** Un bâtiment de la ferme : son icône, son nom, une pastille de ce qui attend, et un appui qui ouvre sa rubrique. */
function Batiment({ icone, titre, pastille, route, rang }: { icone: ReactNode; titre: string; pastille?: string; route: string; rang: number }) {
  const router = useRouter();
  return (
    <Apparition delai={200 + rang * 110}>
      <Pressable style={styles.batiment} onPress={() => router.push(route as never)} accessibilityRole="button" accessibilityLabel={pastille ? `${titre} : ${pastille}` : titre}>
        <View style={styles.rondBatiment}>{icone}</View>
        <View style={styles.texteBatiment}>
          <Text style={styles.titreBatiment} numberOfLines={2}>
            {titre}
          </Text>
          {pastille ? <Text style={styles.pastilleBatiment}>{pastille}</Text> : null}
        </View>
      </Pressable>
    </Apparition>
  );
}

/** Le chemin de terre entre deux bâtiments. */
const Chemin = () => <View style={styles.chemin} />;

/**
 * La ferme : l'enclos de l'espèce choisie, avec trois ou quatre animaux (leurs boucles) qui représentent le troupeau, puis la laiterie, la
 * fromagerie, la boucherie et charcuterie, l'abattoir, et les clients et fournisseurs. Chaque lieu ouvre sa rubrique et porte une pastille de ce qui attend.
 */
export function ScenePrincipale({ vedettes, nombreAnimaux, naissances, lotsAFacturer, lotsARappeler }: Props) {
  const router = useRouter();
  const femelles = vocabulaire().femelle.pluriel;
  const lieux = [
    { cle: 'laiterie', icone: <Ionicons name="water" size={24} color={colors.primary} />, titre: T.laiterie, route: ROUTES.PRODUCTION_LAIT, pastille: undefined },
    { cle: 'fromagerie', icone: <MaterialCommunityIcons name="cheese" size={26} color={colors.primary} />, titre: T.fromagerie, route: ROUTES.PRODUCTION_FROMAGES, pastille: lotsARappeler > 0 ? T.lotsARappeler(lotsARappeler) : undefined },
    { cle: 'charcuterie', icone: <MaterialCommunityIcons name="food-steak" size={26} color={colors.primary} />, titre: T.charcuterie, route: ROUTES.PRODUCTION_CHARCUTERIE, pastille: undefined },
    { cle: 'abattoir', icone: <Ionicons name="business" size={24} color={colors.primary} />, titre: T.abattoir, route: `${ROUTES.PRODUCTION_VIANDE}?onglet=afacturer`, pastille: lotsAFacturer > 0 ? T.lotsAFacturer(lotsAFacturer) : undefined },
    { cle: 'contacts', icone: <Ionicons name="people" size={24} color={colors.primary} />, titre: T.contacts, route: ROUTES.CONTACTS, pastille: undefined },
  ];
  return (
    <View style={styles.scene}>
      <Pressable style={styles.enclos} onPress={() => router.push(ROUTES.CHEPTEL_LISTE as never)} accessibilityRole="button" accessibilityLabel={T.enclos(femelles)}>
        <Text style={styles.titreEnclos}>{T.enclos(femelles)}</Text>
        {vedettes.length > 0 ? (
          <View style={styles.troupeau}>
            {vedettes.map((a, i) => (
              <AnimalDeLEnclos key={a.id} animal={a} rang={i} />
            ))}
          </View>
        ) : (
          <Text style={styles.vide}>{T.aucunAnimal}</Text>
        )}
        <Text style={styles.effectif}>
          {nombreAnimaux === undefined ? '…' : TEXTES.accueil.ferme.bandeau.animaux(nombreAnimaux)}
          {naissances ? ` · ${T.nes(naissances)}` : ''}
        </Text>
      </Pressable>
      {lieux.map((l, i) => (
        <Fragment key={l.cle}>
          <Chemin />
          <Batiment icone={l.icone} titre={l.titre} pastille={l.pastille} route={l.route} rang={i} />
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  scene: { flex: 1, minWidth: 0, backgroundColor: '#E8F0D8', borderRadius: 20, padding: 10, alignItems: 'stretch' },
  enclos: { backgroundColor: '#D9E8BE', borderRadius: 16, borderWidth: 3, borderColor: '#A9794A', borderStyle: 'dashed', padding: 10, gap: 6, alignItems: 'center' },
  titreEnclos: { fontSize: 14, fontWeight: '700', color: colors.primaryDark, textAlign: 'center' },
  troupeau: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end', gap: 8, paddingVertical: 6, minHeight: 80 },
  animal: { alignItems: 'center', gap: 2 },
  etiquette: { backgroundColor: '#F2C94C', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1, borderWidth: 1, borderColor: '#B58B1A' },
  etiquetteTexte: { fontSize: 11, fontWeight: '700', color: '#4A3A07' },
  vide: { fontSize: 13, color: colors.textMuted, paddingVertical: 20 },
  effectif: { fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  chemin: { alignSelf: 'center', width: 6, height: 14, borderRadius: 3, backgroundColor: '#D8C9A3' },
  batiment: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 10 },
  rondBatiment: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.badgeBg, alignItems: 'center', justifyContent: 'center' },
  texteBatiment: { flex: 1, minWidth: 0 },
  titreBatiment: { fontSize: 14, fontWeight: '700', color: colors.text },
  pastilleBatiment: { fontSize: 12, fontWeight: '700', color: colors.danger },
});
