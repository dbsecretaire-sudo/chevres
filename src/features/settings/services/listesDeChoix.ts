import { categoriesDepenseDuMode } from '@/features/comptabilite/utils/categories';
import { choixProposes, nomDuChoix, type Choix, type ListePerso } from '@/features/settings/services/listesPerso';
import { OBJET_ASSURANCE } from '@/shared/constants/comptabilite';
import { LABEL_CATEGORIE_DEPENSE, LABEL_OBJET_ASSURANCE } from '@/shared/textes/libelles';

/** Les listes que l'utilisateur personnalise (leur clé dans les réglages). */
export type CleListePerso = 'objetsAssurance' | 'categoriesDepense';

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

/** Les choix de « Catégorie de dépense » (sans le renommage : le nom d'une catégorie d'office porte son sens comptable) ; les masquées ne sont plus proposées. */
export const choixCategoriesDepense = (perso: ListePerso | undefined, choisie?: string): Choix[] =>
  choixProposes(categoriesDepenseDOffice(), perso ? { ...perso, renommes: undefined } : undefined, choisie ? [choisie] : []);
