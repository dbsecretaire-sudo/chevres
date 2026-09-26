/**
 * Client ID OAuth de type "Web" (Google Cloud Console > Identifiants > Créer des
 * identifiants > ID client OAuth > type "Application Web"). Requis par
 * @react-native-google-signin/google-signin même sur Android — sans lui, la
 * bibliothèque échoue avec une erreur "redirect_uri_mismatch". Ce n'est pas un
 * secret (comme le Client ID Android, il finit de toute façon dans l'APK).
 */
export const GOOGLE_WEB_CLIENT_ID = '378502586374-iithlqmp6la9tck5mm697auc77k1v9be.apps.googleusercontent.com';
