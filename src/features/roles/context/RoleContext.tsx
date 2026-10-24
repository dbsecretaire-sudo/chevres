import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { ROLE } from '@/shared/constants/roles';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { definirModeSimple } from '@/shared/hooks/useModeSimple';
import { afficheSobre } from '@/shared/utils/affichage';
import { estBureau } from '@/shared/utils/plateforme';

export type Role = ValeurDe<typeof ROLE>;

interface RoleContextValue {
  /** Le rôle choisi au lancement ; absent tant qu'on ne l'a pas choisi. */
  role: Role | undefined;
  choisir: (role: Role | undefined) => void;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

/**
 * Le rôle de cette séance : la secrétaire (toute l'application) ou le berger (les saisies simples du terrain). Il se choisit à chaque lancement sur le téléphone ; le poste Windows
 * et l'affichage sobre (le poste de comptabilité) sont toujours ceux de la secrétaire.
 */
export function RoleProvider({ children }: PropsWithChildren) {
  const [role, setRole] = useState<Role | undefined>(estBureau() || afficheSobre() ? ROLE.SECRETAIRE : undefined);
  // Les composants partagés (le bouton « + »…) savent ainsi que le mode normal est choisi.
  useEffect(() => {
    definirModeSimple(role === ROLE.BERGER);
    return () => definirModeSimple(false);
  }, [role]);
  return <RoleContext.Provider value={{ role, choisir: setRole }}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole doit être utilisé dans un RoleProvider');
  return ctx;
}
