import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ROUTES } from '@/shared/constants/routes';
import { styles } from '@/shared/styles/accueil/Accueil.styles';
import { TEXTES } from '@/shared/textes';

type Route = Parameters<ReturnType<typeof useRouter>['push']>[0];

/** Une grande tuile : le nom de la rubrique, au centre ; un appui l'ouvre. */
function Tuile({ libelle, route }: { libelle: string; route: Route }) {
  const router = useRouter();
  return (
    <Pressable
      style={({ pressed }) => [styles.tuileRubrique, pressed && styles.statAppuyee]}
      onPress={() => router.push(route)}
    >
      <Text style={styles.tuileRubriqueTexte}>{libelle}</Text>
    </Pressable>
  );
}

/**
 * Version Windows : les quatre rubriques de l'application (celles de la barre du haut) en grandes tuiles, dans une seule carte
 * séparée par de fines lignes, à la place des chiffres de l'accueil.
 */
export function TuilesRubriques() {
  return (
    <View style={styles.grille}>
      <View style={styles.rangee}>
        <Tuile libelle={TEXTES.commun.general.cheptel} route={ROUTES.CHEPTEL} />
        <View style={styles.separateurVertical} />
        <Tuile libelle={TEXTES.production.titre} route={ROUTES.PRODUCTION} />
      </View>
      <View style={styles.separateurHorizontal} />
      <View style={styles.rangee}>
        <Tuile libelle={TEXTES.commercial.titre} route={ROUTES.COMMERCIAL} />
        <View style={styles.separateurVertical} />
        <Tuile libelle={TEXTES.commun.general.comptabilite} route={ROUTES.COMPTABILITE} />
      </View>
      <View style={styles.separateurHorizontal} />
      <View style={styles.rangee}>
        <Tuile libelle={TEXTES.navigation.layout.reglages} route={ROUTES.REGLAGES} />
      </View>
    </View>
  );
}
