/**
 * Un contrat d'un assureur : sa dénomination (« Multirisque exploitation »), son numéro de contrat — c'est lui qui s'inscrit comme numéro de la facture quand on le choisit —,
 * ce qu'il couvre, le véhicule de la flotte s'il en couvre un, et le dossier de l'assureur où ses papiers sont rangés.
 */
export interface ContratAssureur {
  id: string;
  denomination: string;
  numero: string;
  /** Ce que le contrat couvre (voir OBJET_ASSURANCE) ; absent : non précisé. */
  objet?: string;
  vehiculeId?: string;
  /** Le dossier de l'assureur (son entrée de contenus, voir DossierDeContenus) où sont rangés ses papiers. */
  dossierId?: string;
}

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
  /** Association ou coopérative agricole : les volets que l'utilisateur a cochés (achats groupés, ventes groupées…). Sans volet : des écritures simples. */
  volets?: string[];
  /** Un assureur : la liste de ses contrats (dénomination, numéro, dossier), à choisir dans une écriture d'assurance. */
  contrats?: ContratAssureur[];
  /** Sa fiche client quand c'est aussi un client : un seul contact, deux fiches (voir features/contacts). */
  clientId?: string;
}
