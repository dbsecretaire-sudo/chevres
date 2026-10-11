/** La catégorie d'un client (obligatoire dans sa fiche) : elle règle le prix, le numéro de facture et la déclaration de ses ventes. */
export const CATEGORIE_CLIENT = {
  PARTICULIER: 'particulier',
  RECOLTEUR: 'recolteur',
  ORGANISME: 'organisme',
  ENTREPRISE: 'entreprise',
} as const;

/** La catégorie d'un client dont la fiche n'en a pas encore (fiches d'avant ce choix). */
export const CATEGORIE_CLIENT_PAR_DEFAUT = CATEGORIE_CLIENT.PARTICULIER;

/**
 * Les catégories dont la vente est déclarée d'office (la case « le client souhaite déclarer la vente » est cochée) : un particulier
 * n'en demande pas, un organisme ou une entreprise oui. Le récolteur, qui facture le lait lui-même, est déclaré aussi.
 */
export const CATEGORIES_CLIENT_VENTE_DECLAREE: readonly string[] = [
  CATEGORIE_CLIENT.RECOLTEUR,
  CATEGORIE_CLIENT.ORGANISME,
  CATEGORIE_CLIENT.ENTREPRISE,
];

/** La catégorie dont le prix est libre (le récolteur fixe son prix : il n'est pas tiré de l'inventaire) et le numéro de facture libre (lettres permises). */
export const CATEGORIE_CLIENT_PRIX_LIBRE = CATEGORIE_CLIENT.RECOLTEUR;

/** Ce que peut contenir le numéro de facture d'un client qui n'est pas récolteur : chiffres, tirets, barres et points. */
export const MOTIF_NUMERO_FACTURE_NUMERIQUE = /^[0-9\-/. ]*$/;
