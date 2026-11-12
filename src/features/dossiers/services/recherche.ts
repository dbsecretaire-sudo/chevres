
import type { Element } from '@/features/dossiers/types';

import { STATUT_ELEMENT } from '@/shared/constants/dossiers';


/** Vrai si l'échéance est dépassée et que le contenu n'est pas terminé. */
export const estEnRetard = (element: Pick<Element, 'echeance' | 'statut'>, aujourdhui: string): boolean =>
  !!element.echeance && element.echeance < aujourdhui && element.statut !== STATUT_ELEMENT.TERMINE;
