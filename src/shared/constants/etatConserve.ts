/** Les valeurs qu'un écran garde quand on le quitte (recherche, filtres) : une clé par écran et par champ. */
export const ETAT_CONSERVE = {
  COMPTABILITE_RECHERCHE: 'comptabilite.recherche',
  COMPTABILITE_FILTRES: 'comptabilite.filtres',
  CHEPTEL_RECHERCHE: 'cheptel.recherche',
  CHEPTEL_STATUT: 'cheptel.statut',
  CHEPTEL_CATEGORIE: 'cheptel.categorie',
  CHEPTEL_TRI: 'cheptel.tri',
  CHEPTEL_CRITERES: 'cheptel.criteres',
} as const;
