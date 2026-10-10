/** Fichiers joints (Word, Excel, PDF, images, captures) : dossiers, types acceptés et noms — à modifier ici uniquement. */

/** Sous-dossier local des fichiers joints (un dossier par établissement dedans). */
export const DOSSIER_PIECES_LOCAL = 'pieces';

/** Sous-dossier, dans le dossier Drive de l'établissement, des fichiers joints. */
export const DOSSIER_PIECES_DRIVE = 'Pièces';

/** Sépare l'identifiant du nom d'origine dans le nom d'un fichier sur Drive. */
export const SEPARATEUR_NOM_PIECE = '__';

export const MIME_FICHIER = {
  PDF: 'application/pdf',
  WORD: 'application/msword',
  WORD_DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  EXCEL: 'application/vnd.ms-excel',
  EXCEL_XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  PNG: 'image/png',
  JPEG: 'image/jpeg',
  INCONNU: 'application/octet-stream',
} as const;

/** Les fichiers qu'on peut joindre à un contenu du secrétariat : Word, Excel, PDF, images PNG et JPEG. */
export const TYPES_FICHIERS_ACCEPTES: string[] = [
  MIME_FICHIER.PDF,
  MIME_FICHIER.WORD,
  MIME_FICHIER.WORD_DOCX,
  MIME_FICHIER.EXCEL,
  MIME_FICHIER.EXCEL_XLSX,
  MIME_FICHIER.PNG,
  MIME_FICHIER.JPEG,
];

/** Les captures d'un trade : des images (converties en PDF) ou des PDF. */
export const TYPES_CAPTURES_ACCEPTES: string[] = [
  MIME_FICHIER.PNG,
  MIME_FICHIER.JPEG,
  MIME_FICHIER.PDF,
  'image/*',
];

/** Les analyses du contrôle laitier : un PDF ou une image. */
export const TYPES_ANALYSES_ACCEPTES: string[] = [
  MIME_FICHIER.PDF,
  MIME_FICHIER.PNG,
  MIME_FICHIER.JPEG,
  'image/*',
];

export const EXTENSION_PDF = 'pdf';

/** Le type d'un fichier d'après son extension (quand le sélecteur de fichiers ne le donne pas). */
export const MIME_PAR_EXTENSION: Record<string, string> = {
  pdf: MIME_FICHIER.PDF,
  doc: MIME_FICHIER.WORD,
  docx: MIME_FICHIER.WORD_DOCX,
  xls: MIME_FICHIER.EXCEL,
  xlsx: MIME_FICHIER.EXCEL_XLSX,
  png: MIME_FICHIER.PNG,
  jpg: MIME_FICHIER.JPEG,
  jpeg: MIME_FICHIER.JPEG,
};

/** L'extension d'un fichier d'après son type, quand son nom n'en a pas. */
export const EXTENSION_PAR_MIME: Record<string, string> = {
  [MIME_FICHIER.PDF]: 'pdf',
  [MIME_FICHIER.WORD]: 'doc',
  [MIME_FICHIER.WORD_DOCX]: 'docx',
  [MIME_FICHIER.EXCEL]: 'xls',
  [MIME_FICHIER.EXCEL_XLSX]: 'xlsx',
  [MIME_FICHIER.PNG]: 'png',
  [MIME_FICHIER.JPEG]: 'jpg',
};

/** Largeur maximale (%) d'une image dans le PDF qui la contient. */
export const LARGEUR_IMAGE_PDF = '100%';
