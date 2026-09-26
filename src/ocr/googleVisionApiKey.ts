/**
 * Clé API Google Cloud Vision (Google Cloud Console > API et services > Identifiants
 * > Créer des identifiants > Clé API), utilisée pour lire le numéro de boucle sur une
 * photo (OCR).
 *
 * ⚠️ Contrairement au Client ID OAuth, cette clé permet d'appeler l'API et donc de
 * générer des coûts si elle est volée (ex: APK décompilé). Avant de l'utiliser :
 * 1. Activez l'API "Cloud Vision API" sur le projet Google Cloud.
 * 2. Restreignez la clé (dans ses paramètres) à cette seule API "Cloud Vision API".
 * 3. Optionnel mais recommandé : définissez une alerte de budget sur le projet.
 */
export const GOOGLE_VISION_API_KEY = 'À_REMPLACER';
