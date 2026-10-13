import { GROUPE_RECETTE } from '@/shared/constants/comptabilite';
import {
  CATEGORIE_CLIENT,
  GROUPES_RECETTE_ORGANISME,
  GROUPES_RECETTE_SANS_CLIENT,
  CATEGORIE_CLIENT_PAR_DEFAUT,
  CATEGORIES_CLIENT_PROTEGEES,
} from '@/shared/constants/clients';
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
  /**
   * Les groupes de recette (GROUPE_RECETTE) qu'un client de cette catégorie peut recevoir : à défaut, l'aide ou les prestations pour un
   * organisme, et toutes les recettes sauf l'aide pour les autres catégories. Seul un organisme a une aide, sauf réglage contraire.
   */
  recettes?: string[];
  /** Afficher la case « Pas encore encaissée » dans les factures de ses clients (d'office : oui). */
  pasEncaissee?: boolean;
}

/** Vrai quand la case « Pas encore encaissée » s'affiche pour les clients de cette catégorie (sans catégorie connue : oui). */
export const pasEncaisseeAffichee = (categorie?: CategorieClientReglage): boolean =>
  categorie?.pasEncaissee !== false;

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
  {
    id: CATEGORIE_CLIENT.GROUPEMENT,
    nom: LABEL_CATEGORIE_CLIENT.groupement,
    declaree: true,
    prixLibre: false,
  },
];

let liste: CategorieClientReglage[] = categoriesClientParDefaut();

/** Les catégories de l'établissement actif (celles des réglages, à défaut celles d'office). */
export const categoriesClient = (): CategorieClientReglage[] => liste;

/** Pose les catégories de l'établissement ; celles qui ne se retirent pas (particulier, groupement) y sont toujours. */
export function definirCategoriesClient(choisies?: CategorieClientReglage[]): void {
  const defauts = categoriesClientParDefaut();
  const retenues = choisies?.length ? choisies : defauts;
  const manquantes = defauts.filter(
    (d) => CATEGORIES_CLIENT_PROTEGEES.includes(d.id) && !retenues.some((c) => c.id === d.id),
  );
  // « Particulier », celle d'office, vient en tête ; une autre catégorie manquante suit la liste.
  liste = [
    ...manquantes.filter((c) => c.id === CATEGORIE_CLIENT_PAR_DEFAUT),
    ...retenues,
    ...manquantes.filter((c) => c.id !== CATEGORIE_CLIENT_PAR_DEFAUT),
  ];
}

/** Les groupes de recette qu'une catégorie de client peut recevoir (ceux de ses réglages, à défaut ceux d'office). */
export const groupesRecetteDeLaCategorie = (categorie: CategorieClientReglage): readonly string[] =>
  categorie.recettes ??
  (categorie.id === CATEGORIE_CLIENT.ORGANISME
    ? GROUPES_RECETTE_ORGANISME
    : Object.values(GROUPE_RECETTE).filter(
        (g) => g !== GROUPE_RECETTE.AIDE && !GROUPES_RECETTE_SANS_CLIENT.includes(g),
      ));

/** La catégorie d'un identifiant ; une catégorie retirée ou inconnue vaut « particulier ». */
export const categorieClientDe = (id: string | undefined): CategorieClientReglage =>
  liste.find((c) => c.id === id) ?? liste.find((c) => c.id === CATEGORIE_CLIENT_PAR_DEFAUT) ?? liste[0];
