import { CATEGORIE_CLIENT, CATEGORIE_CLIENT_PAR_DEFAUT } from '@/shared/constants/clients';
import { LABEL_CATEGORIE_CLIENT } from '@/shared/textes/libelles';

/**
 * Une catégorie de client. `declaree` : la vente est déclarée d'office (la case « le client souhaite déclarer la vente » est cochée) ;
 * `prixLibre` : le prix de la vente est saisi, le numéro de facture peut avoir des lettres et un réajustement est possible.
 */
export interface CategorieClientReglage {
  id: string;
  nom: string;
  declaree: boolean;
  prixLibre: boolean;
}

/** Les catégories proposées d'office : un particulier n'est pas déclaré ; le récolteur facture lui-même, à prix libre. */
export const categoriesClientParDefaut = (): CategorieClientReglage[] => [
  {
    id: CATEGORIE_CLIENT.PARTICULIER,
    nom: LABEL_CATEGORIE_CLIENT.particulier,
    declaree: false,
    prixLibre: false,
  },
  { id: CATEGORIE_CLIENT.RECOLTEUR, nom: LABEL_CATEGORIE_CLIENT.recolteur, declaree: true, prixLibre: true },
  { id: CATEGORIE_CLIENT.ORGANISME, nom: LABEL_CATEGORIE_CLIENT.organisme, declaree: true, prixLibre: false },
  {
    id: CATEGORIE_CLIENT.ENTREPRISE,
    nom: LABEL_CATEGORIE_CLIENT.entreprise,
    declaree: true,
    prixLibre: false,
  },
];

let liste: CategorieClientReglage[] = categoriesClientParDefaut();

/** Les catégories de l'établissement actif (celles des réglages, à défaut celles d'office). */
export const categoriesClient = (): CategorieClientReglage[] => liste;

/** Pose les catégories de l'établissement ; « particulier » est toujours présente (c'est celle d'office). */
export function definirCategoriesClient(choisies?: CategorieClientReglage[]): void {
  const defauts = categoriesClientParDefaut();
  const retenues = choisies?.length ? choisies : defauts;
  liste = retenues.some((c) => c.id === CATEGORIE_CLIENT_PAR_DEFAUT) ? retenues : [defauts[0], ...retenues];
}

/** La catégorie d'un identifiant ; une catégorie retirée ou inconnue vaut « particulier ». */
export const categorieClientDe = (id: string | undefined): CategorieClientReglage =>
  liste.find((c) => c.id === id) ?? liste.find((c) => c.id === CATEGORIE_CLIENT_PAR_DEFAUT) ?? liste[0];
