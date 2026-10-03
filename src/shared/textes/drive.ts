/** Textes de l'interface — « drive ». À modifier ici uniquement. */
export const TEXTES_DRIVE = {
  googleAuth: {
    googlePlayServicesEstIndisponible: 'Google Play Services est indisponible ou à mettre à jour.',
    erreurGoogleCodeCodeMessage: (code: string, message: string) =>
      `Erreur Google (code ${code}) : ${message}`,
  },
} as const;
