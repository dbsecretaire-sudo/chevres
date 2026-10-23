import { useEffect, useState } from 'react';
import { BackHandler, Platform, StyleSheet, View } from 'react-native';
import { useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import { noterPage, pageDAvant, reculer, repartirDeLAccueil } from '@/shared/navigation/historiqueDesPages';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BandeauFerme } from '@/features/accueil/ferme/BandeauFerme';
import { FilDAriane } from '@/features/accueil/ferme/FilDAriane';
import { FeuilleRappels } from '@/features/accueil/ferme/FenetresFerme';
import { colors } from '@/shared/theme/colors';
import { colonneCentree } from '@/shared/theme/miseEnPage';

/**
 * Le bas de l'écran du téléphone : le fil d'Ariane (où l'on est, et le chemin pour y remonter), puis le bandeau de la ferme (la maison, la balance, les boucles, les
 * rappels) — c'est ce qu'on touche le plus, et le bas est la zone que le pouce atteint sans effort. Il respecte la barre de navigation du système. Pas de flèche de
 * retour : le fil d'Ariane et la maison suffisent. Le « précédent » du téléphone ramène à la page vue juste avant, quel que soit le chemin pris pour y arriver : les piles
 * internes de chaque rubrique gardent d'anciennes pages, et la navigation par défaut les rouvrait sans qu'on les attende.
 */
export function BandeauBas() {
  const { bottom } = useSafeAreaInsets();
  const [rappelsOuverts, setRappelsOuverts] = useState(false);
  const router = useRouter();
  const adresse = usePathname();
  const parametres = useGlobalSearchParams();
  const requete = Object.entries(parametres)
    .filter(([, valeur]) => valeur !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cle, valeur]) => `${cle}=${Array.isArray(valeur) ? valeur.join(',') : valeur}`)
    .join('&');
  const pageActuelle = requete ? `${adresse}?${requete}` : adresse;
  // Chaque page vue s'ajoute à l'historique ; l'accueil est la racine, il l'oublie.
  useEffect(() => {
    if (adresse === '/') repartirDeLAccueil(pageActuelle);
    else noterPage(pageActuelle);
  }, [adresse, pageActuelle]);
  // Le « précédent » du téléphone : la page vue juste avant. Sans page avant (l'accueil), la navigation par défaut ferme l'application.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const abonnement = BackHandler.addEventListener('hardwareBackPress', () => {
      const avant = pageDAvant();
      if (!avant) return false;
      reculer();
      router.navigate(avant as never);
      return true;
    });
    return () => abonnement.remove();
  }, [router]);
  return (
    <View style={[styles.fond, { paddingBottom: 8 + bottom }]}>
      {/* La même largeur maximale que la capsule du haut : sur un grand écran, le bandeau ne s'étire pas d'un bord à l'autre. */}
      <View style={colonneCentree}>
        <FilDAriane />
        <BandeauFerme onRappels={() => setRappelsOuverts(true)} />
      </View>
      <FeuilleRappels visible={rappelsOuverts} onFermer={() => setRappelsOuverts(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  fond: { backgroundColor: colors.background, paddingHorizontal: 12, paddingTop: 8 },
});
