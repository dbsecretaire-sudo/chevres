import type { Client } from '@/features/clients/types';
import {
  CATEGORIE_CLIENT,
  CATEGORIE_CLIENT_PAR_DEFAUT,
  CATEGORIE_CLIENT_PRIX_LIBRE,
  CATEGORIES_CLIENT_VENTE_DECLAREE,
} from '@/shared/constants/clients';
import { CATEGORIE_VENTE } from '@/shared/constants/comptabilite';
import type { ValeurDe } from '@/shared/constants/valeurDe';

export type CategorieClient = ValeurDe<typeof CATEGORIE_CLIENT>;

/** La catégorie d'un client : celle de sa fiche, à défaut particulier (aucun client choisi : particulier aussi). */
export const categorieDuClient = (client: Pick<Client, 'categorie'> | undefined): CategorieClient =>
  client?.categorie ?? CATEGORIE_CLIENT_PAR_DEFAUT;

/** Vrai quand le prix de la vente est libre (récolteur) : on le saisit, il n'est pas tiré de l'inventaire. */
export const prixLibre = (client: Pick<Client, 'categorie'> | undefined): boolean =>
  categorieDuClient(client) === CATEGORIE_CLIENT_PRIX_LIBRE;

/** Vrai quand le numéro de facture peut contenir des lettres (récolteur) ; sinon chiffres, tirets et barres seulement. */
export const numeroFactureLibre = prixLibre;

/** La valeur d'office de « le client souhaite déclarer la vente » : décochée pour un particulier, cochée pour les autres. */
export const venteDeclareeParDefaut = (client: Pick<Client, 'categorie'> | undefined): boolean =>
  CATEGORIES_CLIENT_VENTE_DECLAREE.includes(categorieDuClient(client));

/**
 * Vrai quand la vente peut être un réajustement : la vente de lait déclarée d'un récolteur. Un réajustement n'a ni litrage ni numéro
 * de facture saisis.
 */
export const reajustementPossible = (
  client: Pick<Client, 'categorie'> | undefined,
  categorie: string,
  declaree: boolean,
): boolean => prixLibre(client) && categorie === CATEGORIE_VENTE.LAIT && declaree;
