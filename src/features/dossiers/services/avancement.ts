import type { Element, StatutElement } from '@/features/dossiers/types';
import { STATUT_ELEMENT } from '@/shared/constants/dossiers';

/** L'avancement d'un contenu : celui qu'on a choisi, « à faire » pour les contenus d'avant le choix de l'avancement. */
export const statutEffectif = (element: Pick<Element, 'statut'>): StatutElement =>
  element.statut ?? STATUT_ELEMENT.A_FAIRE;
