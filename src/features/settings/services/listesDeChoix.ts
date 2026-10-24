import { categoriesDepenseDuMode } from '@/features/comptabilite/utils/categories';
import { choixProposes, nomDuChoix, type Choix, type ListePerso } from '@/features/settings/services/listesPerso';
import { CIRCUIT_VENTE } from '@/shared/constants/commercial';
import { OBJET_ASSURANCE } from '@/shared/constants/comptabilite';
import { LABEL_CATEGORIE_DEPENSE, LABEL_CIRCUIT_VENTE, LABEL_OBJET_ASSURANCE } from '@/shared/textes/libelles';

/** Les listes que l'utilisateur personnalise (leur clé dans les réglages). */
export type CleListePerso = 'objetsAssurance' | 'categoriesDepense' | 'circuitsVente';

/** Ce que couvre une assurance, d'office : les bâtiments, les animaux, les visiteurs, un véhicule. */
export const objetsAssuranceDOffice = (): { id: string; nom: string }[] =>
  Object.values(OBJET_ASSURANCE).map((id) => ({ id, nom: LABEL_OBJET_ASSURANCE[id] }));

/** Les catégories de dépense d'office du type d'établissement (élevage, entreprise). Leur nom reste celui de l'application : il porte leur sens comptable. */
export const categoriesDepenseDOffice = (): { id: string; nom: string }[] =>
  categoriesDepenseDuMode().map((id) => ({ id, nom: LABEL_CATEGORIE_DEPENSE[id] }));

/** Les choix d'« Assurance de » : ceux d'office, renommés ou masqués, et ceux de l'utilisateur ; le choix déjà fait reste proposé même masqué. */
export const choixObjetsAssurance = (perso: ListePerso | undefined, choisi?: string): Choix[] =>
  choixProposes(objetsAssuranceDOffice(), perso, choisi ? [choisi] : []);

/** Le nom d'un « Assurance de » (d'office, renommé ou ajouté). */
export const nomObjetAssurance = (id: string, perso: ListePerso | undefined): string => nomDuChoix(id, objetsAssuranceDOffice(), perso);

/** Les circuits de vente d'office (la ferme, le marché, les paniers…). */
export const circuitsDOffice = (): { id: string; nom: string }[] =>
  Object.values(CIRCUIT_VENTE).map((id) => ({ id, nom: LABEL_CIRCUIT_VENTE[id] }));

/** Les circuits proposés pour une vente ou une commande : ceux d'office (renommés, sauf les masqués) et ceux de l'utilisateur ; le circuit déjà choisi reste proposé. */
export const choixCircuits = (perso: ListePerso | undefined, choisi?: string): Choix[] =>
  choixProposes(circuitsDOffice(), perso, choisi ? [choisi] : []);

/** Le nom d'un circuit (d'office, renommé ou ajouté). */
export const nomCircuit = (id: string, perso: ListePerso | undefined): string => nomDuChoix(id, circuitsDOffice(), perso);
