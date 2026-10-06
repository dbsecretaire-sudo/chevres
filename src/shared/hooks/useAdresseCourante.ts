import { useGlobalSearchParams, usePathname } from 'expo-router';

/** L'adresse de l'écran affiché, paramètres compris (« /comptabilite/nouvelle?type=recue »), pour pouvoir y revenir. */
export function useAdresseCourante(): string {
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const requete = Object.entries(params)
    .filter(([, valeur]) => typeof valeur === 'string')
    .map(([cle, valeur]) => `${cle}=${encodeURIComponent(valeur as string)}`)
    .join('&');
  return requete ? `${pathname}?${requete}` : pathname;
}
