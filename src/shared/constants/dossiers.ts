/** Valeurs de l'explorateur de dossiers (clients, sous-dossiers, contenus) — à modifier ici uniquement. */

/** Avancement d'un contenu rangé dans un sous-dossier. */
export const STATUT_ELEMENT = {
  A_FAIRE: 'a_faire',
  EN_COURS: 'en_cours',
  TERMINE: 'termine',
} as const;

/** Filtres de l'explorateur : par avancement, ou les contenus dont l'échéance est dépassée. */
export const FILTRE_DOSSIERS = {
  TOUT: 'tout',
  A_FAIRE: STATUT_ELEMENT.A_FAIRE,
  EN_COURS: STATUT_ELEMENT.EN_COURS,
  TERMINE: STATUT_ELEMENT.TERMINE,
  EN_RETARD: 'en_retard',
} as const;

/** Séparateur des étiquettes d'un contenu quand on les saisit dans un seul champ. */
export const SEPARATEUR_ETIQUETTES = ',';

/** Ce qu'on fait pour facturer un contenu : une facture, un acompte, ou une prestation ajoutée sur la note du client. */
export const TYPE_FACTURATION = {
  FACTURE: 'facture',
  ACOMPTE: 'acompte',
  NOTE: 'note',
} as const;
