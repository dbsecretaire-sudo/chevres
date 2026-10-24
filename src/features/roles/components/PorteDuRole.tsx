import type { PropsWithChildren } from 'react';
import { ChoixDuRole } from '@/features/roles/components/ChoixDuRole';
import { useRole } from '@/features/roles/context/RoleContext';

/** Tant que le mode n'est pas choisi, rien d'autre ne s'ouvre : seul le choix « Quel mode ? » s'affiche. */
export function PorteDuRole({ children }: PropsWithChildren) {
  const { role } = useRole();
  return role ? <>{children}</> : <ChoixDuRole />;
}
