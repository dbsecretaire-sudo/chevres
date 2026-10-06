import { Platform } from 'react-native';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { DRIVE_SCOPES, GOOGLE_WEB_CLIENT_ID } from '@/shared/constants/google';
import { TEXTES } from '@/shared/textes';

// email et profil sont inclus par défaut par la bibliothèque.
// Note : "drive.file" (accès restreint aux fichiers créés par l'app) empêche l'app
// de voir des fichiers déposés manuellement par l'utilisateur dans le dossier Drive
// depuis le site/l'appli Google Drive — d'où le scope complet "drive" ici, nécessaire
// pour que "Récupérer depuis Drive" trouve des fichiers importés à la main.

let configured = false;

/**
 * À appeler avant toute autre fonction (chaque export ci-dessous s'en charge).
 * webClientId (type "Web" dans Google Cloud Console, distinct du client Android)
 * est requis même sur Android par cette bibliothèque, sans quoi la connexion
 * échoue avec "redirect_uri_mismatch".
 * Le client ID Android, lui, n'apparaît nulle part dans le code : Google le
 * retrouve grâce au nom de package + empreinte SHA-1 enregistrés dans la console.
 */
export function configureGoogle(): void {
  if (configured) return;
  GoogleSignin.configure({
    scopes: DRIVE_SCOPES,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
  });
  configured = true;
}

/** Conservé pour compatibilité avec le reste de l'appli. */
export function isSecureStoreAvailable(): boolean {
  return Platform.OS !== 'web';
}

export interface GoogleSignInResult {
  email: string;
  accessToken: string;
}

/**
 * Ouvre le sélecteur de comptes natif d'Android AVANT toute connexion.
 * Retourne null si l'utilisateur annule.
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult | null> {
  configureGoogle();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Oublie le dernier compte utilisé -> le choix du compte est reproposé à chaque fois.
    // signOut() seul ne suffit pas toujours : Google Play Services garde en mémoire, au
    // niveau système, le dernier compte utilisé avec cette appli. revokeAccess() efface
    // aussi ce consentement, ce qui force la sélection + le consentement à chaque connexion.
    try {
      await GoogleSignin.revokeAccess();
    } catch {
      // rien à révoquer (première connexion) : pas grave
    }
    await GoogleSignin.signOut();

    const res = await GoogleSignin.signIn();
    if (!isSuccessResponse(res)) return null; // annulé par l'utilisateur

    const { accessToken } = await GoogleSignin.getTokens();
    return { email: res.data.user.email, accessToken };
  } catch (e) {
    if (isErrorWithCode(e)) {
      switch (e.code) {
        case statusCodes.IN_PROGRESS:
          return null;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          throw new Error(TEXTES.drive.googleAuth.googlePlayServicesEstIndisponible);
        default:
          // Code 10 / DEVELOPER_ERROR = nom de package ou SHA-1 différent de la console.
          throw new Error(TEXTES.drive.googleAuth.erreurGoogleCodeCodeMessage(e.code, e.message));
      }
    }
    throw e;
  }
}

/** L'adresse du compte Google connecté sur l'appareil (null s'il n'y en a pas ou si la session a expiré). */
export async function emailGoogleCourant(): Promise<string | null> {
  configureGoogle();
  try {
    const res = await GoogleSignin.signInSilently();
    return res.type === 'success' ? res.data.user.email : null;
  } catch {
    return null;
  }
}

/**
 * Retourne un access token valide pour l'API Drive (rafraîchi automatiquement).
 * Null si l'utilisateur ne s'est jamais connecté.
 * Le paramètre est ignoré ; il est gardé pour ne pas casser les appels existants.
 */
export async function getValidAccessToken(_clientId?: string): Promise<string | null> {
  configureGoogle();
  try {
    const res = await GoogleSignin.signInSilently();
    if (res.type !== 'success') return null;
    const { accessToken } = await GoogleSignin.getTokens();
    return accessToken;
  } catch {
    return null;
  }
}

/**
 * À appeler si l'API Drive répond 401 avec un token : le vide du cache,
 * puis renvoie un token neuf.
 */
export async function renewAccessToken(expiredToken: string): Promise<string | null> {
  configureGoogle();
  await GoogleSignin.clearCachedAccessToken(expiredToken);
  return getValidAccessToken();
}

export async function isGoogleConnected(): Promise<boolean> {
  configureGoogle();
  return await GoogleSignin.hasPreviousSignIn();
}

export async function disconnectGoogle(): Promise<void> {
  configureGoogle();
  try {
    await GoogleSignin.revokeAccess();
  } catch {
    // pas grave si l'accès était déjà révoqué
  }
  await GoogleSignin.signOut();
}
