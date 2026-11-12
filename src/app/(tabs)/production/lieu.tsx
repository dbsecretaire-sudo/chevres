import { Stack, useLocalSearchParams } from 'expo-router';
import TousLesAnimaux from '@/features/accueil/ferme/TousLesAnimaux';
import LieuTiers from '@/features/production/screens/LieuTiers';
import PageBoucles from '@/features/stock/screens/PageBoucles';

/**
 * La page d'un lieu de la carte de la ferme : les animaux et les boucles ont leur page, les autres lieux leur page de tiers. La grange
 * et l'entrepôt en style jeu ont été retirés : le stock se consulte dans l'écran Stock.
 */
export default function Lieu() {
  const { lieu } = useLocalSearchParams<{ lieu?: string }>();
  // Tous les animaux : la chèvrerie (son mur et ses chèvres), puis la liste du troupeau sur tout l'écran.
  if (lieu === 'animaux') return <TousLesAnimaux />;
  // Le stock de boucles (Cheptel › Boucles) : ses boucles et leur compte ; une carte ouvre le tableau des boucles.
  if (lieu === 'boucles') return <PageBoucles />;
  return (
    <>
      {/* Le bouton « Lots d'animaux » de la page des animaux ne reste pas dans l'en-tête des autres pages. */}
      <Stack.Screen options={{ headerRight: () => null }} />
      <LieuTiers />
    </>
  );
}
