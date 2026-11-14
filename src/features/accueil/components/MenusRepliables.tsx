import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { BlocListe } from '@/shared/components/BlocListe';

interface EtatMenus {
  /** Le titre du groupe déplié, ou rien : un seul à la fois. */
  ouvert: string | null;
  basculer: (titre: string) => void;
}

const MenusContext = createContext<EtatMenus | null>(null);

/**
 * Des groupes de menus qui se replient : tout `GroupeAccueil` placé dedans se replie d'un appui sur son titre, et un seul reste déplié à la fois.
 * Replié au départ. Hors de ce cadre, un groupe reste déplié.
 */
export function MenusRepliables({ children }: PropsWithChildren) {
  const [ouvert, setOuvert] = useState<string | null>(null);
  const valeur = useMemo<EtatMenus>(
    () => ({ ouvert, basculer: (titre) => setOuvert((actuel) => (actuel === titre ? null : titre)) }),
    [ouvert],
  );
  // Les groupes forment un seul bloc blanc, séparés par des traits gris (comme une liste d'items).
  return (
    <MenusContext.Provider value={valeur}>
      <BlocListe>{children}</BlocListe>
    </MenusContext.Provider>
  );
}

/** L'état des menus repliables autour de ce groupe, ou rien hors d'un `MenusRepliables`. */
export const useMenusRepliables = (): EtatMenus | null => useContext(MenusContext);
