import type { PieceJointe } from '@/features/fichiers/types';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import type { STATUT_ELEMENT, TYPE_FACTURATION } from '@/shared/constants/dossiers';
import type { NatureUrssaf } from '@/features/comptabilite/types';

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

/**
 * Une facturation d'un contenu du secrétariat : une facture ou un acompte (inscrit en comptabilité, avec son numéro), ou une
 * prestation ajoutée sur la note du client, facturée plus tard avec les autres sous un seul numéro.
 */
export interface Facturation {
  id: string;
  type: ValeurDe<typeof TYPE_FACTURATION>;
  /** Le montant TTC (€). */
  montant: number;
  /** La date de la facture ou de l'acompte (AAAA-MM-JJ) ; pour la note, celle où la prestation y est ajoutée. */
  date: string;
  /** La nature de la prestation pour l'URSSAF. */
  nature: NatureUrssaf;
  /** Le numéro de la facture ; pour une prestation de la note, celui de la note une fois facturée. */
  numeroFacture?: string;
  /** La recette inscrite en comptabilité ; absente pour une prestation de la note pas encore facturée. */
  factureId?: string;
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
  /** Fichiers joints : Word, Excel, PDF, images (rangés dans l'appareil, envoyés aussi sur Drive). */
  fichiers?: PieceJointe[];
  /** Ce qui a été facturé pour ce contenu (factures, acomptes, prestations sur la note du client). */
  facturations?: Facturation[];
}

/** Tout ce que contient l'explorateur pour un établissement : stocké, sauvegardé et synchronisé ensemble. */
export interface ArchiveDossiers {
  sousDossiers: SousDossier[];
  elements: Element[];
}
