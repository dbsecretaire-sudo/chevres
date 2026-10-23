import type { DocumentGenere } from '@/features/bibliotheque/types';

/**
 * Ce qui fait le type d'un fichier généré : son nom sans l'extension ni ce qui s'y ajoute (l'année, la période, la date) — « plan_comptable_2026 »
 * et « plan_comptable_2025 » sont du même type, « plan_comptable ».
 */
export const racineDuFichier = (nomFichier: string): string => nomFichier.replace(/\.pdf$/i, '').replace(/_\d.*$/, '');

/** Un texte sans accent ni majuscule, pour que « declaration » trouve « Déclaration ». */
const simple = (texte: string): string =>
  texte
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/**
 * Les documents qui répondent à la recherche : chaque mot saisi se retrouve dans le titre, le nom du fichier ou la date de génération (« 2026 », « octobre » n'y est pas :
 * « 10/2026 » ou « 2026-10 » oui). Sans recherche, tous, dans l'ordre reçu.
 */
export const documentsRecherches = (documents: DocumentGenere[], recherche: string): DocumentGenere[] => {
  const mots = simple(recherche).split(/\s+/).filter(Boolean);
  if (mots.length === 0) return documents;
  return documents.filter((d) => {
    const jour = d.genereLe.slice(0, 10);
    const [annee, mois, date] = jour.split('-');
    const texte = simple(`${d.titre} ${d.nomFichier} ${jour} ${date}/${mois}/${annee}`);
    return mots.every((m) => texte.includes(m));
  });
};

/** Les documents déjà générés d'un ou plusieurs types (par la racine de leur nom), du plus récent au plus ancien. */
export const documentsDuType = (documents: DocumentGenere[], racines: (string | undefined)[]): DocumentGenere[] =>
  documents
    .filter((d) => racines.includes(racineDuFichier(d.nomFichier)))
    .sort((a, b) => b.genereLe.localeCompare(a.genereLe));
