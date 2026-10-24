/** Textes de l'interface — « à traiter ». À modifier ici uniquement. */
export const TEXTES_A_TRAITER = {
  titre: 'À traiter',
  /** Le total, sous le titre de l'écran d'accueil. */
  resume: (n: number) => `${n} à traiter`,
  /** Le logo d'un établissement qui a des choses à traiter : un appui les affiche ou les masque. */
  logo: (n: number) => `${n} à traiter : afficher ou masquer`,
  /** Le titre d'un groupe par genre de chose à traiter. */
  genre: {
    rappel_fiscal: 'À déclarer',
    lots_a_rappeler: 'À rappeler',
    rappel_lot_a_valider: 'À valider',
  },
  rappelDeLot: (lot: string, date: string) => `Rappel de lot · ${lot} · rappelé le ${date}`,
  lots: (n: number) => `${n} lot${n > 1 ? 's' : ''} vendu${n > 1 ? 's' : ''} à rappeler (contrôle non ok)`,
} as const;
