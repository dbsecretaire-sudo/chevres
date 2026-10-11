import type { CATEGORIE_CLIENT } from '@/shared/constants/clients';
import type { ValeurDe } from '@/shared/constants/valeurDe';

/** Fiche client, réutilisable pour préremplir le client d'une vente de production (lait, fromage, cabris). */
export interface Client {
  id: string;
  nom: string;
  prenom?: string;
  telephone?: string;
  email?: string;
  adressePostale?: string;
  /** Particulier, récolteur, organisme ou entreprise (particulier pour une fiche d'avant ce choix : voir `categorieDuClient`). */
  categorie?: ValeurDe<typeof CATEGORIE_CLIENT>;
  /** Vrai une fois que la structure type de sous-dossiers a été créée pour ce client (voir features/dossiers). */
  structureInitialisee?: boolean;
}
