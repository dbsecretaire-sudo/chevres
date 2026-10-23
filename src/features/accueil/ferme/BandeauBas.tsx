import { useState } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { useOrigineRetour, useRetour } from '@/shared/navigation/origineRetour';
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
  // La flèche de retour est ici aussi, sous le pouce (celle du haut reste) : elle fait comme elle — revenir à l'endroit du bouton d'où l'on vient, sinon à la page d'avant.
  const router = useRouter();
  const retour = useRetour();
  const origine = useOrigineRetour();
  const adresse = usePathname();
  const peutRevenir = adresse !== '/' && (!!origine || router.canGoBack());
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
