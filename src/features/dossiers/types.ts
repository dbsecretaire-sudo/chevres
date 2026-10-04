import type { ValeurDe } from '@/shared/constants/valeurDe';
import type { STATUT_ELEMENT } from '@/shared/constants/dossiers';

export type StatutElement = ValeurDe<typeof STATUT_ELEMENT>;

/**
 * Un dossier dans le dossier d'un client (le dossier d'un client, c'est sa fiche : voir features/clients). Il peut
 * lui-même contenir des dossiers, à n'importe quelle profondeur.
 */
export interface SousDossier {
  id: string;
  clientId: string;
  nom: string;
  /** Le dossier qui le contient ; absent s'il est directement dans le dossier du client. */
  parentId?: string;
}

/** Un contenu rangé dans un sous-dossier : une note, un courrier, une démarche… (le scan viendra plus tard). */
export interface Element {
  id: string;
  clientId: string;
  dossierId: string;
  titre: string;
  texte?: string;
  /** Date du contenu (AAAA-MM-JJ). */
  date: string;
  /** Échéance facultative (AAAA-MM-JJ). */
  echeance?: string;
  statut?: StatutElement;
  etiquettes?: string[];
}

/** Tout ce que contient l'explorateur pour un établissement : stocké, sauvegardé et synchronisé ensemble. */
export interface ArchiveDossiers {
  sousDossiers: SousDossier[];
  elements: Element[];
}
