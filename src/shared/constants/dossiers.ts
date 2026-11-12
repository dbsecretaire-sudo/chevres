/** Valeurs de l'explorateur de dossiers (clients, sous-dossiers, contenus) — à modifier ici uniquement. */

/** Avancement d'un contenu rangé dans un sous-dossier. */
export const STATUT_ELEMENT = {
  A_FAIRE: 'a_faire',
  EN_COURS: 'en_cours',
  TERMINE: 'termine',
} as const;

/** Ce qu'on fait pour facturer un contenu : une facture, un acompte, ou une prestation ajoutée sur la note du client. */
export const TYPE_FACTURATION = {
  FACTURE: 'facture',
  ACOMPTE: 'acompte',
  NOTE: 'note',
} as const;
