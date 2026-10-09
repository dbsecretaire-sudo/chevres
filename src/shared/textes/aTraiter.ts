/** Textes de l'interface — « à traiter ». À modifier ici uniquement. */
export const TEXTES_A_TRAITER = {
  titre: 'À traiter',
  rienATraiter: 'Rien à traiter pour le moment.',
  voirPlus: (n: number) => `Voir ${n} de plus`,
  voirMoins: 'Voir moins',
  /** Le titre d'un groupe par genre de chose à traiter. */
  genre: {
    tache_en_retard: 'En retard',
    tache_proche: 'À faire bientôt',
    sejour_a_encaisser: 'À encaisser',
    note_a_facturer: 'À facturer',
  },
  tacheEnRetard: (titre: string, client: string, echeance: string) =>
    `${titre} — ${client} · échéance ${echeance}`,
  tacheProche: (titre: string, client: string, echeance: string) =>
    `${titre} — ${client} · pour le ${echeance}`,
  sejour: (nom: string, arrivee: string, depart: string, restant: string) =>
    `${nom} · du ${arrivee} au ${depart} · ${restant} à encaisser`,
  note: (client: string, prestations: number, total: string) =>
    `${client} · ${prestations} ${prestations > 1 ? 'prestations' : 'prestation'} · ${total}`,
} as const;
