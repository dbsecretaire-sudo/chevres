import { useLocalSearchParams } from 'expo-router';
import LieuTiers from '@/features/production/screens/LieuTiers';
import EntrepotJeu from '@/features/stock/screens/EntrepotJeu';

/** La page d'un lieu de la carte de la ferme : l'entrepôt a son inventaire en style jeu, les autres lieux leur page de tiers. */
export default function Lieu() {
  const { lieu } = useLocalSearchParams<{ lieu?: string }>();
  return lieu === 'entrepot' ? <EntrepotJeu /> : <LieuTiers />;
}
