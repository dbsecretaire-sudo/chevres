import type { ValeurDe } from '@/shared/constants/valeurDe';

/** Formats, types MIME et noms de fichiers des exports (PDF, Excel) et de la sauvegarde — à modifier ici uniquement. */

export const FORMAT_EXPORT = {
  PDF: 'pdf',
  XLSX: 'xlsx',
} as const;

export type FormatExport = ValeurDe<typeof FORMAT_EXPORT>;

export const MIME_PDF = 'application/pdf';
export const UTI_PDF = 'com.adobe.pdf';
export const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const UTI_XLSX = 'org.openxmlformats.spreadsheetml.sheet';

/** Longueur maximale (imposée par Excel) du nom d'un onglet. */
export const LONGUEUR_MAX_NOM_ONGLET = 31;

/** Début des noms de fichiers d'export (l'extension dépend du format). */
export const NOM_FICHIER_EXPORT_ANNEE = 'troupeau_chevres';
export const NOM_FICHIER_EXPORT_EXPLOITATION = 'exploitation';
export const NOM_FICHIER_EXPORT_PLAN_COMPTABLE = 'plan_comptable';
export const NOM_FICHIER_EXPORT_CHEPTEL = 'cheptel';
/** Export de l'année d'une entreprise (prestations de service, association…). */
export const NOM_FICHIER_EXPORT_ENTREPRISE = 'entreprise';

/** Version du format du fichier de sauvegarde locale (à incrémenter si sa structure change). */
export const VERSION_SAUVEGARDE = 1;

/** Début du nom du fichier de sauvegarde locale (suivi de la date et de l'extension .json). */
export const NOM_FICHIER_SAUVEGARDE = 'troupeau_chevres_sauvegarde';
export const NOM_FICHIER_SAUVEGARDE_ENTREPRISE = 'entreprise_sauvegarde';
export const EXTENSION_SAUVEGARDE = 'json';

/** Classe CSS qui force un saut de page dans les rapports PDF. */
export const CLASSE_CSS_SAUT_PAGE = 'page-break';
