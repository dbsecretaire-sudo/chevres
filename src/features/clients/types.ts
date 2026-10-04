/** Fiche client, réutilisable pour préremplir le client d'une vente de production (lait, fromage, cabris). */
export interface Client {
  id: string;
  nom: string;
  prenom?: string;
  telephone?: string;
  email?: string;
  adressePostale?: string;
  /** Vrai une fois que la structure type de sous-dossiers a été créée pour ce client (voir features/dossiers). */
  structureInitialisee?: boolean;
}
