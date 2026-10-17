import type { Chevre } from '@/features/cheptel/types';

/**
 * Règle d'or : tout tiptag est destiné à l'abattoir pour les cabris. Un animal dont la boucle est l'un des tiptag de l'inventaire est donc
 * destiné à l'abattoir : il n'est pas de ceux du renouvellement, le carnet de mise bas le note « A » dès sa naissance, et on le propose
 * aux animaux à l'abattoir.
 */
export const estTiptag = (animal: Pick<Chevre, 'numeroBoucle'>, tiptags: ReadonlySet<string>): boolean =>
  !!animal.numeroBoucle?.trim() && tiptags.has(animal.numeroBoucle.trim());
