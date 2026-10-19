/** Textes de l'interface — le didacticiel (toutes les options de l'application, expliquées). À modifier ici uniquement. */
export const TEXTES_DIDACTICIEL = {
  titre: 'Didacticiel',
  activer: 'Activer le didacticiel',
  desactiver: 'Désactiver le didacticiel',
  parcourir: 'Parcours de cas',
  ouvrir: 'Ouvrir',
  commencer: 'Commencer la visite guidée',
  /** L'onglet « Parcours de cas » : un cas du quotidien suivi pas à pas, en lecture ou en visite guidée. */
  parcours: {
    titre: 'Parcours de cas',
    lancer: 'Lancer la visite guidée de ce parcours',
  },
  /** La visite guidée : la bulle qui présente une page et dit quoi toucher. */
  visite: {
    etape: (i: number, n: number) => `Étape ${i} sur ${n}`,
    enCours: (i: number, n: number) => `Visite guidée · ${i}/${n}`,
    quitter: 'Quitter la visite',
    reprendre: 'Reprendre',
    suivant: 'Suivant',
    precedent: 'Précédent',
    passer: 'Passer cette étape',
    terminer: 'Terminer',
    touchezLaZone: 'Touchez la zone en surbrillance.',
    touchezLeBouton: 'Touchez ce qui est indiqué pour continuer.',
  },
} as const;
