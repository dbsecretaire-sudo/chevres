import type { DocumentGenere } from '@/features/bibliotheque/types';

/**
 * Ce qui fait le type d'un fichier généré : son nom sans l'extension ni ce qui s'y ajoute (l'année, la période, la date) — « plan_comptable_2026 »
 * et « plan_comptable_2025 » sont du même type, « plan_comptable ».
 */
export const racineDuFichier = (nomFichier: string): string => nomFichier.replace(/\.pdf$/i, '').replace(/_\d.*$/, '');

/** Les documents déjà générés d'un ou plusieurs types (par la racine de leur nom), du plus récent au plus ancien. */
export const documentsDuType = (documents: DocumentGenere[], racines: (string | undefined)[]): DocumentGenere[] =>
  documents
    .filter((d) => racines.includes(racineDuFichier(d.nomFichier)))
    .sort((a, b) => b.genereLe.localeCompare(a.genereLe));
