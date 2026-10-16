/** Fiche fournisseur, réutilisable pour préremplir le tiers d'une facture reçue (achat). */
export interface Fournisseur {
  id: string;
  nom: string;
  prenom?: string;
  nomEntreprise: string;
  /** Facultatif : un organisme n'en a pas toujours (vide si absent). */
  siret: string;
  /** Numéro de TVA intracommunautaire — facultatif (ex : fournisseur en franchise en base). */
  tva?: string;
  rib?: string;
  /** Facultative (vide si absente). */
  adressePostale: string;
  /** Les coordonnées facultatives : elles s'affichent aussi pour un équarrisseur, dans Groupements. */
  telephone?: string;
  email?: string;
  /** La catégorie du fournisseur (voir categoriesFournisseur) : elle règle les dépenses possibles ; à défaut, la catégorie d'office. */
  categorie?: string;
  /** Sa fiche client quand c'est aussi un client : un seul contact, deux fiches (voir features/contacts). */
  clientId?: string;
}
