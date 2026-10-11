/** Textes de l'interface — fichiers joints (Word, Excel, PDF, images) et captures. À modifier ici uniquement. */
export const TEXTES_FICHIERS = {
  titre: 'Fichiers',
  ajouter: 'Ajouter un fichier',
  remplacer: 'Remplacer le fichier',
  aucun: 'Aucun fichier joint',
  retirer: 'Retirer',
  importerUnFichier: 'Importer un fichier',
  nombre: (nombre: number) => `${nombre} fichier${nombre > 1 ? 's' : ''}`,
  aide: 'Word, Excel, PDF et images (PNG, JPEG). Ils sont rangés dans l’application et envoyés aussi sur Google Drive.',
  indisponibleWeb: 'Les fichiers joints ne sont disponibles que dans l’application mobile.',
  erreurAjout: 'Impossible d’ajouter le fichier',
  /** La visionneuse d'une image en plein écran. */
  visionneuse: {
    agrandir: 'Voir en plein écran',
    fermer: 'Fermer',
    zoomPlus: 'Agrandir',
    zoomMoins: 'Réduire',
    ajuster: 'Ajuster à l’écran',
    niveau: (zoom: number) => `${Math.round(zoom * 100)} %`,
  },
  captures: {
    titre: 'Captures du trade',
    ajouter: 'Ajouter une capture',
    aucune: 'Aucune capture',
    aide: 'Une capture d’écran ou une photo est transformée en PDF automatiquement, puis envoyée aussi sur Google Drive.',
  },
} as const;
