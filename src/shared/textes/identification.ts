/** Textes de l'interface — « documents d'identification » de l'exploitation. À modifier ici uniquement. */
export const TEXTES_IDENTIFICATION = {
  /** La ligne de Mon établissement qui mène à la liste. */
  titre: 'Documents d’identification',
  aide: 'Vos pièces scannées : documents d’identification et d’installation.',
  aucun: 'Aucun document : ajoutez vos pièces scannées avec le bouton +.',
  nouveau: 'Nouveau document',
  modifier: 'Modifier ce document',
  nature: {
    label: 'Nature',
    identification: 'Document d’identification',
    installation: 'Document d’installation',
  },
  fiche: {
    titre: 'Titre',
    exempleTitre: 'ex : Attestation de pacage',
    date: 'Date',
    notes: 'Notes',
    titreRequis: 'Donnez un titre au document.',
    supprimer: 'Supprimer ce document',
    supprimerQuestion: 'Supprimer ce document ?',
    supprimerMessage: 'Le document et ses fichiers joints seront supprimés.',
  },
  /** « Document d'installation · 12/03/2026 · 2 fichiers » */
  nombreFichiers: (n: number) => `${n} fichier${n > 1 ? 's' : ''}`,
} as const;
