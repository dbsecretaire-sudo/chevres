import type { Client } from '@/features/clients/types';
import { categorieClientDe, groupesRecetteDeLaCategorie } from '@/shared/dictionnaire/categoriesClient';
import { CATEGORIE_VENTE } from '@/shared/constants/comptabilite';
import { GROUPES_RECETTE_SANS_CLIENT } from '@/shared/constants/clients';

/** L'identifiant de la catégorie d'un client : celle de sa fiche, à défaut (ou si elle a été retirée) particulier. */
export const categorieDuClient = (client: Pick<Client, 'categorie'> | undefined): string =>
  categorieClientDe(client?.categorie).id;

/** Vrai quand le prix de la vente est libre (récolteur, ou toute catégorie réglée ainsi) : on le saisit, il n'est pas tiré de l'inventaire. */
export const prixLibre = (client: Pick<Client, 'categorie'> | undefined): boolean =>
  categorieClientDe(client?.categorie).prixLibre;

/** Vrai quand le numéro de facture peut contenir des lettres ; sinon chiffres, tirets et barres seulement. */
export const numeroFactureLibre = prixLibre;

/** La valeur d'office de « le client souhaite déclarer la vente », selon la catégorie du client. */
export const venteDeclareeParDefaut = (client: Pick<Client, 'categorie'> | undefined): boolean =>
  categorieClientDe(client?.categorie).declaree;

/**
 * Vrai quand la vente peut être un réajustement : la vente de lait déclarée d'un client à prix libre. Un réajustement n'a ni litrage ni
 * numéro de facture saisis.
 */
export const reajustementPossible = (
  client: Pick<Client, 'categorie'> | undefined,
  categorie: string,
  declaree: boolean,
): boolean => prixLibre(client) && categorie === CATEGORIE_VENTE.LAIT && declaree;

/**
 * Vrai quand un client peut recevoir ce groupe de recette : la catégorie du client le règle (un organisme n'a que l'aide ou les
 * prestations, et l'aide n'est proposée qu'à un organisme). Sans client choisi, tout sauf l'aide est permis.
 */
export const groupeRecetteAutorise = (
  client: Pick<Client, 'categorie'> | undefined,
  groupe: string,
): boolean =>
  GROUPES_RECETTE_SANS_CLIENT.includes(groupe) ||
  groupesRecetteDeLaCategorie(categorieClientDe(client?.categorie)).includes(groupe);
