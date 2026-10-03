/** Adresses, types MIME et réglages des API Google (Drive, connexion, Vision) — à modifier ici uniquement. */

// --- Google Drive ---
export const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
export const DRIVE_UPLOAD_API_URL = 'https://www.googleapis.com/upload/drive/v3';
export const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

/** Scope complet "drive" : "drive.file" empêche de voir les fichiers déposés à la main dans le dossier Drive. */
export const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive'];

export const MIME_DOSSIER_DRIVE = 'application/vnd.google-apps.folder';
export const MIME_CSV = 'text/csv';
export const MIME_JSON = 'application/json';
export const CHARSET_UTF8 = 'charset=UTF-8';

/** Séparateur des envois multipart vers Drive. */
export const DRIVE_BOUNDARY = 'troupeau_chevres_boundary_9f3c1a';

/** Nombre maximal de fichiers renvoyés par un listage Drive. */
export const DRIVE_TAILLE_PAGE = 1000;

// --- Connexion Google ---
/**
 * Client ID OAuth de type "Web" (Google Cloud Console > Identifiants > ID client OAuth > Application Web).
 * Requis par @react-native-google-signin/google-signin même sur Android. Ce n'est pas un secret
 * (comme le Client ID Android, il finit de toute façon dans l'APK).
 */
export const GOOGLE_WEB_CLIENT_ID =
  '378502586374-iithlqmp6la9tck5mm697auc77k1v9be.apps.googleusercontent.com';

// --- Google Cloud Vision (lecture du n° de boucle sur une photo) ---
export const VISION_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';
export const VISION_TYPE_DETECTION = 'TEXT_DETECTION';
export const VISION_LANGUE = 'fr';
export const VISION_MAX_RESULTATS = 1;
/** Qualité JPEG (0-1) de la photo envoyée à l'OCR. */
export const QUALITE_PHOTO_OCR = 0.5;
/** Longueur minimale (en chiffres) d'un numéro candidat. */
export const LONGUEUR_MIN_NUMERO_BOUCLE = 2;

/** Valeur de remplacement tant que la clé API Vision n'est pas renseignée. */
export const CLE_VISION_NON_CONFIGUREE = 'À_REMPLACER';

/**
 * Clé API Google Cloud Vision (Google Cloud Console > API et services > Identifiants > Clé API).
 *
 * ⚠️ Contrairement au Client ID OAuth, cette clé permet d'appeler l'API et donc de générer des coûts si
 * elle est volée (ex : APK décompilé). Avant de l'utiliser : activez l'API "Cloud Vision API", restreignez
 * la clé à cette seule API, et définissez une alerte de budget sur le projet.
 */
export const GOOGLE_VISION_API_KEY = CLE_VISION_NON_CONFIGUREE;
