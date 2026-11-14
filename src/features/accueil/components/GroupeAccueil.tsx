import type { PropsWithChildren } from 'react';
import { texteDeBalance } from '@/features/comptabilite/services/balanceDesEcritures';
import { GroupeListe } from '@/shared/components/GroupeListe';
import { useMenusRepliables } from '@/features/accueil/components/MenusRepliables';

/**
 * Un groupe de menus (Ferme, Atelier, Commerce, Comptabilité, Plus) : la présentation commune de `GroupeListe`. Dans un `MenusRepliables`, le titre
 * se replie d'un appui, et un seul groupe reste déplié à la fois ; hors de ce cadre, le groupe reste déplié. `balance` : la balance des écritures.
 */
export function GroupeAccueil({ titre, balance, children }: PropsWithChildren<{ titre: string; balance?: number }>) {
  const menus = useMenusRepliables();
  return (
    <GroupeListe
      titre={titre}
      balance={balance !== undefined ? texteDeBalance(balance) : undefined}
      balanceNegative={balance !== undefined && balance < 0}
      ouvert={!menus || menus.ouvert === titre}
      onBasculer={menus ? () => menus.basculer(titre) : undefined}
    >
      {children}
    </GroupeListe>
  );
}
