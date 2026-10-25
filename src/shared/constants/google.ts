/** Adresses, types MIME et réglages de Google Cloud Vision (la lecture du n° de boucle sur une photo) — à modifier ici uniquement. */

// --- Google Cloud Vision (lecture du n° de boucle sur une photo) ---
export const VISION_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';
export const VISION_TYPE_DETECTION = 'TEXT_DETECTION';
export const VISION_LANGUE = 'fr';
export const VISION_MAX_RESULTATS = 1;
export const MIME_JSON = 'application/json';
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
