import { Fragment, type ReactElement } from 'react';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';

/**
 * Enveloppe du contenu d'un écran (option `screenLayout` des navigateurs) : quand l'espèce active change, seul le
 * contenu des écrans est recréé — ils relisent leurs données et leur vocabulaire — sans toucher à la navigation,
 * à la barre d'onglets ni aux en-têtes. Le changement est ainsi aussi fluide que celui de l'année.
 */
function ParEspece({ children }: { children: ReactElement }) {
  const { espece } = useEtablissement();
  return <Fragment key={espece}>{children}</Fragment>;
}

/** À passer en `screenLayout` d'un Stack, ou d'un Tabs dont les écrans ne sont pas eux-mêmes des navigateurs. */
export const ecranParEspece = ({ children }: { children: ReactElement }): ReactElement => (
  <ParEspece>{children}</ParEspece>
);

/**
 * Comme ecranParEspece, mais sans recréer les écrans nommés : ceux qui suivent déjà l'espèce active par eux-mêmes
 * (la liste de la comptabilité), ou qui sont des navigateurs imbriqués (cheptel, comptabilité dans les onglets).
 */
export function ecranParEspeceSauf(...nomsImbriques: string[]) {
  return function EcranParEspeceSauf({
    children,
    route,
  }: {
    children: ReactElement;
    route: { name: string };
  }): ReactElement {
    return nomsImbriques.includes(route.name) ? children : <ParEspece>{children}</ParEspece>;
  };
}
