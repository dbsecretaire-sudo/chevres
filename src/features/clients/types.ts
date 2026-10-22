/** Fiche client, réutilisable pour préremplir le client d'une vente de production (lait, fromage, cabris). */
export interface Client {
  id: string;
  nom: string;
  prenom?: string;
  telephone?: string;
  email?: string;
  adressePostale?: string;
  /** L'identifiant de sa catégorie (voir categoriesClient) ; particulier pour une fiche d'avant ce choix (voir `categorieDuClient`). */
  categorie?: string;
  /** Vrai une fois que la structure type de sous-dossiers a été créée pour ce client (voir features/dossiers). */
  structureInitialisee?: boolean;
  /** Sa fiche fournisseur quand c'est aussi un fournisseur : un seul contact, deux fiches (voir features/contacts). */
  fournisseurId?: string;
  /** La personne à contacter, quand le client est une organisation. */
  contact?: string;
  /** Association ou coopérative agricole : les volets que l'utilisateur a cochés (achats groupés, ventes groupées…). Sans volet : des écritures simples. */
  volets?: string[];
  /** Son circuit de vente privilégié (voir CIRCUIT_VENTE) : repris d'office dans ses ventes, ses réservations et ses commandes. */
  circuit?: string;
}
