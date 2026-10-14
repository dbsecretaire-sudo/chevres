import {
  CATEGORIE_FOURNISSEUR,
  CATEGORIE_FOURNISSEUR_PAR_DEFAUT,
  CATEGORIES_FOURNISSEUR_PROTEGEES,
  DEPENSES_ETAT,
  DEPENSES_PAR_CATEGORIE_FOURNISSEUR,
  DEPENSES_VETERINAIRE,
} from '@/shared/constants/fournisseurs';
import { LABEL_CATEGORIE_FOURNISSEUR } from '@/shared/textes/libelles';

/**
 * Une catégorie de fournisseur (de tiers). `depenses` : les catégories de dépense (CATEGORIE_DEPENSE) que ses factures peuvent avoir ;
 * à défaut, celles d'office pour un vétérinaire (dépenses vétérinaires) et pour l'État (impôts et taxes), et aucune limite pour les autres.
 */
export interface CategorieFournisseurReglage {
  id: string;
  nom: string;
  depenses?: string[];
  /** Afficher la case « Pas encore payée » dans les factures de ses fournisseurs (d'office : oui). */
  pasPayee?: boolean;
  /** Afficher la case « Cette dépense n'a pas été facturée » dans les factures de ses fournisseurs (d'office : oui). */
  sansFacture?: boolean;
}

/** Vrai quand la case « Pas encore payée » s'affiche pour les fournisseurs de cette catégorie (sans catégorie connue : oui). */
export const pasPayeeAffichee = (categorie?: CategorieFournisseurReglage): boolean =>
  categorie?.pasPayee !== false;

/** Vrai quand la case « Cette dépense n'a pas été facturée » s'affiche pour les fournisseurs de cette catégorie (sans catégorie connue : oui). */
export const sansFactureAffichee = (categorie?: CategorieFournisseurReglage): boolean =>
  categorie?.sansFacture !== false;

/** Les catégories proposées d'office. */
export const categoriesFournisseurParDefaut = (): CategorieFournisseurReglage[] => [
  { id: CATEGORIE_FOURNISSEUR.GENERAL, nom: LABEL_CATEGORIE_FOURNISSEUR.general },
  { id: CATEGORIE_FOURNISSEUR.VETERINAIRE, nom: LABEL_CATEGORIE_FOURNISSEUR.veterinaire },
  { id: CATEGORIE_FOURNISSEUR.ETAT, nom: LABEL_CATEGORIE_FOURNISSEUR.etat },
  ...[
    CATEGORIE_FOURNISSEUR.ALIMENTS,
    CATEGORIE_FOURNISSEUR.CARBURANT,
    CATEGORIE_FOURNISSEUR.GARAGE,
    CATEGORIE_FOURNISSEUR.ORGANISME,
    CATEGORIE_FOURNISSEUR.CHAMBRE_AGRICULTURE,
    CATEGORIE_FOURNISSEUR.ASSUREUR,
    CATEGORIE_FOURNISSEUR.BANQUE,
  ].map((id) => ({
    id,
    nom: LABEL_CATEGORIE_FOURNISSEUR[id],
    depenses: [...DEPENSES_PAR_CATEGORIE_FOURNISSEUR[id]],
  })),
  // Un groupement n'a pas de limite : une cotisation (autre), un achat groupé (alimentation, production…).
  { id: CATEGORIE_FOURNISSEUR.GROUPEMENT, nom: LABEL_CATEGORIE_FOURNISSEUR.groupement },
  // Un fournisseur qui ne remet pas de facture : aucune limite de dépense, mais ses dépenses se notent « non facturées ».
  { id: CATEGORIE_FOURNISSEUR.NON_FACTURABLE, nom: LABEL_CATEGORIE_FOURNISSEUR.non_facturable },
];

let liste: CategorieFournisseurReglage[] = categoriesFournisseurParDefaut();

/** Les catégories de fournisseur de l'établissement actif (celles des réglages, à défaut celles d'office). */
export const categoriesFournisseur = (): CategorieFournisseurReglage[] => liste;

/** Pose les catégories de l'établissement ; celles qui ne se retirent pas (d'office, vétérinaire) y sont toujours. */
export function definirCategoriesFournisseur(choisies?: CategorieFournisseurReglage[]): void {
  const defauts = categoriesFournisseurParDefaut();
  const retenues = choisies?.length ? choisies : defauts;
  const manquantes = defauts.filter(
    (d) => CATEGORIES_FOURNISSEUR_PROTEGEES.includes(d.id) && !retenues.some((c) => c.id === d.id),
  );
  liste = [
    ...manquantes.filter((c) => c.id === CATEGORIE_FOURNISSEUR_PAR_DEFAUT),
    ...retenues,
    ...manquantes.filter((c) => c.id !== CATEGORIE_FOURNISSEUR_PAR_DEFAUT),
  ];
}

/** La catégorie d'un identifiant ; une catégorie retirée ou inconnue vaut la catégorie d'office. */
export const categorieFournisseurDe = (id: string | undefined): CategorieFournisseurReglage =>
  liste.find((c) => c.id === id) ?? liste.find((c) => c.id === CATEGORIE_FOURNISSEUR_PAR_DEFAUT) ?? liste[0];

/** Les catégories de dépense que peut avoir un fournisseur de cette catégorie ; rien (undefined) : aucune limite. */
export const depensesDeLaCategorie = (
  categorie: CategorieFournisseurReglage,
): readonly string[] | undefined =>
  categorie.depenses ??
  (categorie.id === CATEGORIE_FOURNISSEUR.VETERINAIRE
    ? DEPENSES_VETERINAIRE
    : categorie.id === CATEGORIE_FOURNISSEUR.ETAT
      ? DEPENSES_ETAT
      : undefined);

/**
 * Les catégories d'office que la liste n'a pas (ni par leur identifiant, ni par leur nom) : l'écran des catégories de tiers les
 * ajoute d'un bouton, pour une liste enregistrée avant qu'elles n'existent.
 */
export const categoriesFournisseurManquantes = (
  actuelles: CategorieFournisseurReglage[],
): CategorieFournisseurReglage[] =>
  categoriesFournisseurParDefaut().filter(
    (d) => !actuelles.some((c) => c.id === d.id || c.nom.trim().toLowerCase() === d.nom.trim().toLowerCase()),
  );
