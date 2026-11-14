import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import TousLesAnimaux from '@/features/accueil/ferme/TousLesAnimaux';
import LieuTiers from '@/features/production/screens/LieuTiers';
import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
import { ROUTES } from '@/shared/constants/routes';

/**
 * La page d'un lieu de la carte de la ferme : les animaux et les boucles ont leur page, les autres lieux leur page de tiers. La grange
 * et l'entrepôt en style jeu ont été retirés : le stock se consulte dans l'écran Stock.
 */
export default function Lieu() {
  const { lieu } = useLocalSearchParams<{ lieu?: string }>();
  // Tous les animaux : la chèvrerie (son mur et ses chèvres), puis la liste du troupeau sur tout l'écran.
  if (lieu === 'animaux') return <TousLesAnimaux />;
  // Les boucles (Documents › Réglementation et contrôles › Boucles, Cheptel › Boucles) : la liste des contrôles des boucles, avec ses onglets.
  if (lieu === 'boucles')
    return <Redirect href={ROUTES.santeControlesOnglet(FAMILLE_CONTROLE.ANIMAUX, FAMILLE_CONTROLE.BOUCLES) as never} />;
  return (
    <>
      {/* Le bouton « Lots d'animaux » de la page des animaux ne reste pas dans l'en-tête des autres pages. */}
      <Stack.Screen options={{ headerRight: () => null }} />
      <LieuTiers />
    </>
  );
}
