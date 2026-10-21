import { useRouter } from 'expo-router';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import { noterOrigine } from '@/shared/navigation/origineRetour';

/**
 * Ouvre une page depuis l'écran affiché (un menu, la page d'un lieu) en notant d'où l'on part : la flèche de retour de la page ouverte, « Annuler »
 * et l'enregistrement d'une écriture ramènent ici, et non à l'écran d'avant de l'onglet de cette page (une nouvelle écriture, ouverte depuis la
 * Production, ne retombait pas sur la Production mais sur le dernier écran de la Comptabilité).
 */
export function useOuvrir(): (route: string) => void {
  const router = useRouter();
  const adresse = useAdresseCourante();
  return (route) => {
    noterOrigine(adresse, route);
    router.push(route as never);
  };
}
