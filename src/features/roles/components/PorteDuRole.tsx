import type { PropsWithChildren } from 'react';
import { ChoixDuRole } from '@/features/roles/components/ChoixDuRole';
import { useRole } from '@/features/roles/context/RoleContext';

/** Tant que le rôle n'est pas choisi, rien d'autre ne s'ouvre : seul le choix « Qui êtes-vous ? » s'affiche. */
export function PorteDuRole({ children }: PropsWithChildren) {
  const { role } = useRole();
  return role ? <>{children}</> : <ChoixDuRole />;
}
