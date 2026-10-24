export const googleVisionTextes = {
  lectureIndisponible:
    'La lecture de la photo n’est pas disponible dans cette version de l’application : saisissez le numéro à la main.',
  cleApiGoogleVisionNon:
    "Clé API Google Vision non configurée. Voir src/ocr/googleVisionApiKey.ts pour l'obtenir dans Google Cloud Console.",
  erreurGoogleVisionStatusStatustext: (status: number, statusText: string, body: string) =>
    `Erreur Google Vision : ${status} ${statusText} — ${body}`,
  erreurGoogleVisionMessage: (message: unknown) => `Erreur Google Vision : ${message}`,
} as const;
