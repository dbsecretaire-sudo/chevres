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
/** Une page A4 en points (595 × 842) : la taille du PDF, en portrait ou en paysage. */
export const LARGEUR_PAGE_A4 = 595;
export const HAUTEUR_PAGE_A4 = 842;

export const NOM_FICHIER_EXPORT_ANNEE = 'troupeau_chevres';
export const NOM_FICHIER_EXPORT_EXPLOITATION = 'exploitation';
export const NOM_FICHIER_EXPORT_PLAN_COMPTABLE = 'plan_comptable';
export const NOM_FICHIER_EXPORT_CHEPTEL = 'cheptel';
export const NOM_FICHIER_EXPORT_REGISTRE_COMPLET = 'registre_cheptel_complet';
/** Les mouvements de l'inventaire. */
export const NOM_FICHIER_EXPORT_INVENTAIRE = 'inventaire';
/** La liste des boucles d'identification (celle que les filtres de l'écran montrent). */
export const NOM_FICHIER_EXPORT_BOUCLES = 'boucles';
/** Export de l'année d'une entreprise (prestations de service, association…). */
export const NOM_FICHIER_EXPORT_ENTREPRISE = 'entreprise';

/** Version du format du fichier de sauvegarde locale (à incrémenter si sa structure change). */
export const VERSION_SAUVEGARDE = 1;

/** Début du nom du fichier de sauvegarde locale (suivi de la date et de l'extension .json). */
export const NOM_FICHIER_SAUVEGARDE = 'troupeau_chevres_sauvegarde';
export const NOM_FICHIER_SAUVEGARDE_ENTREPRISE = 'entreprise_sauvegarde';
export const EXTENSION_SAUVEGARDE = 'json';
