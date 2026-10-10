/** Textes de l'interface — « à traiter ». À modifier ici uniquement. */
export const TEXTES_A_TRAITER = {
  titre: 'À traiter',
  rienATraiter: 'Rien à traiter pour le moment.',
  /** Le total, sous le titre de l'écran d'accueil. */
  resume: (n: number) => `${n} à traiter`,
  /** Le logo d'un établissement qui a des choses à traiter : un appui les affiche ou les masque. */
  logo: (n: number) => `${n} à traiter : afficher ou masquer`,
  /** Le titre d'un groupe par genre de chose à traiter. */
  genre: {
    tache_en_retard: 'En retard',
    tache_proche: 'À faire bientôt',
    rappel_fiscal: 'À déclarer',
    lots_a_rappeler: 'À rappeler',
    rappel_lot_a_valider: 'À valider',
    sejour_a_encaisser: 'À encaisser',
    note_a_facturer: 'À facturer',
  },
  tacheEnRetard: (titre: string, client: string, echeance: string) =>
    `${titre} — ${client} · échéance ${echeance}`,
  tacheProche: (titre: string, client: string, echeance: string) =>
    `${titre} — ${client} · pour le ${echeance}`,
  rappelDeLot: (lot: string, date: string) => `Rappel de lot · ${lot} · rappelé le ${date}`,
  lots: (n: number) => `${n} lot${n > 1 ? 's' : ''} vendu${n > 1 ? 's' : ''} à rappeler (contrôle non ok)`,
  sejour: (nom: string, arrivee: string, depart: string, restant: string) =>
    `${nom} · du ${arrivee} au ${depart} · ${restant} à encaisser`,
  note: (client: string, prestations: number, total: string) =>
    `${client} · ${prestations} ${prestations > 1 ? 'prestations' : 'prestation'} · ${total}`,
} as const;
