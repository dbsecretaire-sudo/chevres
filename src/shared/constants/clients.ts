/** Les catégories de client proposées d'office (l'utilisateur peut les renommer, en ajouter ou en retirer : voir categoriesClient). */
export const CATEGORIE_CLIENT = {
  PARTICULIER: 'particulier',
  RECOLTEUR: 'recolteur',
  ORGANISME: 'organisme',
  ENTREPRISE: 'entreprise',
} as const;

/** La catégorie d'un client dont la fiche n'en a pas (ou dont la catégorie a été retirée) : elle ne se retire pas de la liste. */
export const CATEGORIE_CLIENT_PAR_DEFAUT = CATEGORIE_CLIENT.PARTICULIER;

/** Ce que peut contenir le numéro de facture d'un client dont la catégorie n'est pas « libre » : chiffres, tirets, barres et points. */
export const MOTIF_NUMERO_FACTURE_NUMERIQUE = /^[0-9\-/. ]*$/;
