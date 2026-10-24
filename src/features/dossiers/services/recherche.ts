import type { Client } from '@/features/clients/types';
import type { Element, SousDossier } from '@/features/dossiers/types';
import { statutEffectif } from '@/features/dossiers/services/avancement';
import { FILTRE_DOSSIERS, STATUT_ELEMENT } from '@/shared/constants/dossiers';
import type { ValeurDe } from '@/shared/constants/valeurDe';

export type FiltreDossiers = ValeurDe<typeof FILTRE_DOSSIERS>;

/** Minuscules et sans accents, pour qu'on retrouve « echéance » en tapant « echeance ». */
export const normaliser = (texte: string | undefined): string =>
  (texte ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Vrai si l'échéance est dépassée et que le contenu n'est pas terminé. */
export const estEnRetard = (element: Pick<Element, 'echeance' | 'statut'>, aujourdhui: string): boolean =>
  !!element.echeance && element.echeance < aujourdhui && element.statut !== STATUT_ELEMENT.TERMINE;

/** Un contenu respecte le filtre : tous, un avancement précis, ou « en retard ». */
export const correspondAuFiltre = (element: Element, filtre: FiltreDossiers, aujourdhui: string): boolean => {
  if (filtre === FILTRE_DOSSIERS.TOUT) return true;
  if (filtre === FILTRE_DOSSIERS.EN_RETARD) return estEnRetard(element, aujourdhui);
  return statutEffectif(element) === filtre;
};

export interface Sources {
  clients: Client[];
  sousDossiers: SousDossier[];
  elements: Element[];
}
