/** Textes de l'interface — « rappels » de déclarations. À modifier ici uniquement. */
export const TEXTES_RAPPELS = {
  titre: 'Rappels',
  titreFiscalite: 'À valider',
  aucun: 'Rien à valider pour le moment.',
  genre: {
    rsa: 'Déclaration RSA',
    urssaf: 'Déclaration URSSAF',
  },
  trimestre: (rang: number, annee: number) => `${rang}${rang === 1 ? 'er' : 'e'} trimestre ${annee}`,
  ligne: (genre: string, periode: string) => `${genre} · ${periode}`,
  avant: (date: string) => `À faire avant le ${date}`,
  enRetard: (date: string) => `En retard : à faire avant le ${date}`,
  gerer: 'Gérer les rappels',
  historique: {
    titre: 'Historique des rappels',
    aucun: 'Aucun rappel validé pour le moment.',
    valide: 'Validé',
    rouvrir: 'Remettre à valider',
  },
  validerLeRappel: 'Marquer comme fait',
  reglages: {
    titre: 'Rappels de déclarations',
    rsa: 'Rappeler la déclaration trimestrielle du RSA',
    urssaf: 'Rappeler la déclaration mensuelle de l’URSSAF',
    aide: 'Un rappel s’affiche sur l’accueil à la fin de chaque période, jusqu’à ce que vous le validiez. Vous pouvez les désactiver.',
  },
} as const;
