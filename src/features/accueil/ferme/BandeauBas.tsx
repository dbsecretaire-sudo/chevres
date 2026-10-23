import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BandeauFerme } from '@/features/accueil/ferme/BandeauFerme';
import { FilDAriane } from '@/features/accueil/ferme/FilDAriane';
import { FeuilleRappels } from '@/features/accueil/ferme/FenetresFerme';
import { colors } from '@/shared/theme/colors';
import { colonneCentree } from '@/shared/theme/miseEnPage';

/**
 * Le bas de l'écran du téléphone : le fil d'Ariane (où l'on est, et le chemin pour y remonter), puis le bandeau de la ferme (la maison, la balance, les boucles, les
 * rappels) — c'est ce qu'on touche le plus, et le bas est la zone que le pouce atteint sans effort. Il respecte la barre de navigation du système. Pas de flèche de
 * retour : le fil d'Ariane et la maison suffisent, et le geste de retour du téléphone reste.
 */
export function BandeauBas() {
  const { bottom } = useSafeAreaInsets();
  const [rappelsOuverts, setRappelsOuverts] = useState(false);
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
