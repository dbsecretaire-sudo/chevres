import { useEffect, useState } from 'react';
import { useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import { noterPage, reculer, repartirDeLAccueil } from '@/shared/navigation/historiqueDesPages';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BandeauFerme } from '@/features/accueil/ferme/BandeauFerme';
import { FeuilleRappels } from '@/features/accueil/ferme/FenetresFerme';
import { colors } from '@/shared/theme/colors';
import { colonneCentree } from '@/shared/theme/miseEnPage';

/**
 * Le bandeau de la ferme (la maison, la balance, les boucles, les rappels) tout en bas de l'écran, sur toutes les pages du téléphone : c'est ce qu'on
 * touche le plus, et le bas est la zone que le pouce atteint sans effort. Il respecte la barre de navigation du système.
 */
export function BandeauBas() {
  const { bottom } = useSafeAreaInsets();
  const [rappelsOuverts, setRappelsOuverts] = useState(false);
  // La flèche de retour, sous le pouce : elle ramène à la page d'où l'on vient, quel que soit le chemin pris (un bouton de l'accueil, le menu, un onglet) — d'après
  // l'historique des pages vues (la pile des onglets ne dit pas toujours d'où l'on arrive). Sur l'accueil, il n'y a nulle part où revenir.
  const router = useRouter();
  const adresse = usePathname();
  const parametres = useGlobalSearchParams();
  const requete = Object.entries(parametres)
    .filter(([, valeur]) => valeur !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cle, valeur]) => `${cle}=${Array.isArray(valeur) ? valeur.join(',') : valeur}`)
    .join('&');
  const pageActuelle = requete ? `${adresse}?${requete}` : adresse;
  useEffect(() => {
    if (adresse === '/') repartirDeLAccueil(pageActuelle);
    else noterPage(pageActuelle);
  }, [adresse, pageActuelle]);
  const retour = () => {
    const avant = reculer();
    router.navigate((avant ?? '/') as never);
  };
  const peutRevenir = adresse !== '/';
  return (
    <View style={[styles.fond, { paddingBottom: 8 + bottom }]}>
      {/* La même largeur maximale que la capsule du haut : sur un grand écran, le bandeau ne s'étire pas d'un bord à l'autre. */}
      <View style={colonneCentree}>
        <BandeauFerme onRappels={() => setRappelsOuverts(true)} onRetour={peutRevenir ? retour : undefined} />
      </View>
      <FeuilleRappels visible={rappelsOuverts} onFermer={() => setRappelsOuverts(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  fond: { backgroundColor: colors.background, paddingHorizontal: 12, paddingTop: 8 },
});
