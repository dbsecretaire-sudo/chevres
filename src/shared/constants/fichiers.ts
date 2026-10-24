/** Fichiers joints (Word, Excel, PDF, images, captures) : dossiers, types acceptés et noms — à modifier ici uniquement. */

/** Sous-dossier local des fichiers joints (un dossier par établissement dedans). */
export const DOSSIER_PIECES_LOCAL = 'pieces';

/** Version Windows : l'adresse sous laquelle la fenêtre affiche un fichier de l'ordinateur (suivie du chemin, encodé). */
export const ADRESSE_FICHIERS_BUREAU = 'app://local/fichier/';

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

/** Les analyses du contrôle laitier : un PDF ou une image. */
export const TYPES_ANALYSES_ACCEPTES: string[] = [
  MIME_FICHIER.PDF,
  MIME_FICHIER.PNG,
  MIME_FICHIER.JPEG,
  'image/*',
];

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

/** Les extensions de fichiers qui sont des images : on en montre un aperçu. */
export const EXTENSIONS_IMAGE: readonly string[] = ['jpg', 'jpeg', 'png'];

/** Les agrandissements de la visionneuse d'image en plein écran (1 : l'image tient dans l'écran), du plus petit au plus grand. */
export const NIVEAUX_ZOOM_IMAGE: readonly number[] = [1, 1.5, 2, 3, 4];

/** L'agrandissement qu'un double appui donne à l'image (un second double appui revient à 1). */
export const ZOOM_DOUBLE_APPUI = 2;

/** Deux appuis qui se suivent en moins de ce temps (ms) forment un double appui. */
export const DELAI_DOUBLE_APPUI_MS = 300;
