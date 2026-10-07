import type { Duree } from '@/shared/utils/age';

/**
 * Tout ce qui définit une espèce : son nom, ses seuils d'âge et ses mots (femelle, mâle, petit). Pour une espèce d'office, c'est
 * ce que l'utilisateur a modifié ; pour une espèce ajoutée, tout.
 */
export interface DefinitionEspece {
  id: string;
  nom: string;
  /** À partir de cet âge, un petit sevré compte dans l'effectif (jours ou mois). */
  ageSevrage: Duree;
  /** L'âge de la maturité sexuelle : en dessous, l'animal est un petit (jours ou mois). */
  agePetitMax: Duree;
  nbPetitsMax: number;
  femelle: string;
  male: string;
  petit: string;
}

/** Ce qui est enregistré : les espèces ajoutées, et les réglages modifiés des espèces d'office. */
export interface ArchiveEspeces {
  ajoutees: DefinitionEspece[];
  modifiees: Record<string, DefinitionEspece>;
}
