import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { EnTeteFerme } from '@/features/accueil/ferme/EnTeteFerme';
import TousLesAnimaux from '@/features/accueil/ferme/TousLesAnimaux';
import LieuTiers from '@/features/production/screens/LieuTiers';
import PageBoucles from '@/features/stock/screens/PageBoucles';
import EntrepotJeu from '@/features/stock/screens/EntrepotJeu';
import { CATEGORIE_INVENTAIRE, SECTION_STOCK } from '@/shared/constants/stock';
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
          avecCompte
          seulement={CATEGORIE_INVENTAIRE.MATIERES_PREMIERES}
          // Le stock de boucles n'est pas à la grange : il est avec les boucles (Cheptel › Boucles).
          sauf={[SECTION_STOCK.BOUCLES]}
          titre={TEXTES.production.lieux.entrepot.grange}
        />
      </View>
    );
  // Tous les animaux : la chèvrerie (son mur et ses chèvres), puis la liste du troupeau sur tout l'écran.
  if (lieu === 'animaux') return <TousLesAnimaux />;
  // Le stock de boucles (Cheptel › Boucles) : le même cadre que la grange, avec ses boucles et leur compte ; une carte ouvre le tableau des boucles.
  if (lieu === 'boucles') return <PageBoucles />;
  return lieu === 'entrepot' ? <EntrepotJeu /> : <LieuTiers />;
}
