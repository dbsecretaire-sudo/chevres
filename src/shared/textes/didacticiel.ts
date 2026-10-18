/** Textes de l'interface — le didacticiel (toutes les options de l'application, expliquées). À modifier ici uniquement. */
export const TEXTES_DIDACTICIEL = {
  titre: 'Didacticiel',
  activer: 'Activer le didacticiel',
  desactiver: 'Désactiver le didacticiel',
  parcourir: 'Parcourir le didacticiel',
  aide: 'Toutes les options de l’application, onglet par onglet. Un appui sur « Ouvrir » mène à l’écran de l’option. On l’active ou le désactive depuis le bouton en haut à droite de l’accueil.',
  ouvrir: 'Ouvrir',
  commencer: 'Commencer la visite guidée',
  aideVisite: 'La visite guidée présente chaque page, au fur et à mesure, et vous invite à toucher les boutons de l’interface.',
  /** La visite guidée : la bulle qui présente une page et dit quoi toucher. */
  visite: {
    etape: (i: number, n: number) => `Étape ${i} sur ${n}`,
    enCours: (i: number, n: number) => `Visite guidée · ${i}/${n}`,
    quitter: 'Quitter la visite',
    reprendre: 'Reprendre',
    suivant: 'Suivant',
    passer: 'Passer cette étape',
    terminer: 'Terminer',
    touchezLaZone: 'Touchez la zone en surbrillance.',
    touchezLeBouton: 'Touchez ce qui est indiqué pour continuer.',
  },
} as const;
