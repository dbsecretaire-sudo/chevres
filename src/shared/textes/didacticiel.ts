/** Textes de l'interface — le didacticiel (toutes les options de l'application, expliquées). À modifier ici uniquement. */
export const TEXTES_DIDACTICIEL = {
  titre: 'Didacticiel',
  activer: 'Activer le didacticiel',
  desactiver: 'Désactiver le didacticiel',
  parcourir: 'Parcours de cas',
  aide: 'Des cas du quotidien suivis pas à pas. Un appui sur « Ouvrir » mène à l’écran de l’étape. On active ou on désactive le didacticiel depuis le bouton en haut à droite de l’accueil.',
  ouvrir: 'Ouvrir',
  commencer: 'Commencer la visite guidée',
  /** L'onglet « Parcours de cas » : un cas du quotidien suivi pas à pas, en lecture ou en visite guidée. */
  parcours: {
    titre: 'Parcours de cas',
    presentation: 'Chaque cas se lit ici, dans l’ordre où on le fait dans l’application, ou se parcourt en visite guidée (une bulle sur chaque écran, avec « Précédent » et « Suivant »).',
    lancer: 'Lancer la visite guidée de ce parcours',
    nEtapes: (n: number) => `${n} étape${n > 1 ? 's' : ''}`,
  },
  aideVisite: 'La visite guidée présente chaque page, au fur et à mesure, et vous invite à toucher les boutons de l’interface.',
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
