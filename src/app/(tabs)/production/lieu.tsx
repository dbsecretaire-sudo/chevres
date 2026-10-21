import { ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { EnTeteFerme } from '@/features/accueil/ferme/EnTeteFerme';
import { TransformationInterieure } from '@/features/accueil/ferme/TransformationInterieure';
import LieuTiers from '@/features/production/screens/LieuTiers';
import EntrepotJeu from '@/features/stock/screens/EntrepotJeu';
import { CATEGORIE_INVENTAIRE } from '@/shared/constants/stock';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

/**
 * La page d'un lieu de la carte de la ferme : l'entrepôt et la grange ont leur inventaire en style jeu, la fromagerie le stock de ce qu'on y fait
 * (fromages, viande, emballages, matériel), les autres lieux leur page de tiers.
 */
export default function Lieu() {
  const { lieu } = useLocalSearchParams<{ lieu?: string }>();
  // La grange : l'entrepôt réduit aux matières premières (le foin, le maïs, les concentrés, les boucles).
  if (lieu === 'grange')
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <EnTeteFerme />
        <EntrepotJeu
          seulement={CATEGORIE_INVENTAIRE.MATIERES_PREMIERES}
          titre={TEXTES.production.lieux.entrepot.grange}
        />
      </View>
    );
  // La fromagerie : les cartes de ce qu'on y fabrique et garde, sous l'en-tête habituel des pages.
  if (lieu === 'fromagerie')
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        <TransformationInterieure />
      </ScrollView>
    );
  return lieu === 'entrepot' ? <EntrepotJeu /> : <LieuTiers />;
}
