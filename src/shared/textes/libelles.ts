import type { ValeurDe } from '@/shared/constants/valeurDe';
import { CATEGORIE_ANIMAL, SEXE, STATUT_CHEVRE } from '@/shared/constants/cheptel';
import {
  CATEGORIE_DEPENSE,
  CATEGORIE_RECETTE,
  CATEGORIE_VENTE,
  TYPE_AIDE,
  TYPE_ALIMENT,
  TYPE_CARBURANT,
  TYPE_FROMAGE,
  UNITE_CONDITIONNEMENT,
  UNITE_VENTE,
} from '@/shared/constants/comptabilite';
import {
  ACTIVITE_COMMUNE,
  ACTIVITE_SOCIETE,
  TYPE_ANIMAL_ETABLISSEMENT,
} from '@/shared/constants/etablissements';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { capitaliser, de, vocabulaire } from '@/shared/dictionnaire/animaux';

/** Libellés des valeurs énumérées (sexe, statut, catégories, types…) — à modifier ici uniquement. */

export const LABEL_SEXE: Record<ValeurDe<typeof SEXE>, string> = {
  [SEXE.FEMELLE]: 'Femelle',
  [SEXE.MALE]: 'Mâle',
};

/** Libellé de statut accordé au genre de l'animal : [féminin, masculin]. */
export const LIBELLES_STATUT_CHEVRE: Record<
  ValeurDe<typeof STATUT_CHEVRE>,
  [feminin: string, masculin: string]
> = {
  [STATUT_CHEVRE.VIVANTE]: ['Vivante', 'Vivant'],
  [STATUT_CHEVRE.MORTE]: ['Morte', 'Mort'],
  [STATUT_CHEVRE.ABATTOIR]: ['Abattoir', 'Abattoir'],
  [STATUT_CHEVRE.VENDUE]: ['Vendue', 'Vendu'],
  [STATUT_CHEVRE.AUTOCONSOMMEE]: ['Auto-consommée', 'Auto-consommé'],
  [STATUT_CHEVRE.MORT_NE]: ['Mort-née', 'Mort-né'],
};

export const LABEL_CATEGORIE_VENTE: Record<ValeurDe<typeof CATEGORIE_VENTE>, string> = {
  [CATEGORIE_VENTE.LAIT]: 'Lait',
  [CATEGORIE_VENTE.FROMAGE]: 'Fromage',
  get [CATEGORIE_VENTE.CABRIS]() {
    return capitaliser(vocabulaire().petit.pluriel);
  },
};

export const LABEL_TYPE_FROMAGE: Record<ValeurDe<typeof TYPE_FROMAGE>, string> = {
  [TYPE_FROMAGE.FRAIS]: 'Frais',
  [TYPE_FROMAGE.AFFINE]: 'Affiné (vieux)',
  [TYPE_FROMAGE.CROTTIN]: 'Crottin',
  [TYPE_FROMAGE.BROCCIU]: 'Brocciu',
  [TYPE_FROMAGE.AUTRE]: 'Autre',
};

/** Unité d'une vente, en toutes lettres (liste déroulante). */
export const LABEL_UNITE_VENTE: Record<ValeurDe<typeof UNITE_VENTE>, string> = {
  [UNITE_VENTE.LITRES]: 'Litres',
  [UNITE_VENTE.PIECE]: 'Pièce',
  [UNITE_VENTE.KG]: 'Kg',
};

/** Unité d'une vente, abrégée (affichage dans une phrase). */
export const LABEL_UNITE_VENTE_COURT: Record<ValeurDe<typeof UNITE_VENTE>, string> = {
  [UNITE_VENTE.LITRES]: 'L',
  [UNITE_VENTE.PIECE]: 'pièce(s)',
  [UNITE_VENTE.KG]: 'kg',
};

export const NOMS_MOIS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
] as const;

export const LABEL_CATEGORIE_DEPENSE: Record<ValeurDe<typeof CATEGORIE_DEPENSE>, string> = {
  [CATEGORIE_DEPENSE.ALIMENTATION]: 'Alimentation',
  [CATEGORIE_DEPENSE.CARBURANT]: 'Carburant',
  [CATEGORIE_DEPENSE.REPARATION]: 'Réparation',
  [CATEGORIE_DEPENSE.VETERINAIRE]: 'Vétérinaire',
  [CATEGORIE_DEPENSE.PRODUCTION]: 'Production',
  [CATEGORIE_DEPENSE.IMPOTS]: 'Impôts & taxes',
  [CATEGORIE_DEPENSE.AUTRE]: 'Autre',
};

export const LABEL_CATEGORIE_RECETTE: Record<ValeurDe<typeof CATEGORIE_RECETTE>, string> = {
  [CATEGORIE_RECETTE.LAIT]: 'Vente de lait',
  [CATEGORIE_RECETTE.FROMAGE]: 'Vente de fromage',
  get [CATEGORIE_RECETTE.CABRIS]() {
    return `Vente ${de(vocabulaire().petit.pluriel)}`;
  },
  [CATEGORIE_RECETTE.AIDE]: 'Aide / subvention',
  [CATEGORIE_RECETTE.AUTRE]: 'Autre recette',
};

export const LABEL_TYPE_ALIMENT: Record<ValeurDe<typeof TYPE_ALIMENT>, string> = {
  [TYPE_ALIMENT.MAIS]: 'Maïs',
  [TYPE_ALIMENT.LUZERNE]: 'Luzerne',
  [TYPE_ALIMENT.FOIN]: 'Foin',
  [TYPE_ALIMENT.PAILLE]: 'Paille',
  [TYPE_ALIMENT.FOURRAGE]: 'Fourrage',
  [TYPE_ALIMENT.CEREALES]: 'Céréales (orge, blé, maïs)',
  [TYPE_ALIMENT.SEL]: 'Sel',
  [TYPE_ALIMENT.PORC_CROISSANCE]: 'Porc croissance',
  [TYPE_ALIMENT.AUTRE]: 'Autre',
};

export const LABEL_UNITE_CONDITIONNEMENT: Record<ValeurDe<typeof UNITE_CONDITIONNEMENT>, string> = {
  [UNITE_CONDITIONNEMENT.MATELAS]: 'Matelas',
  [UNITE_CONDITIONNEMENT.BOTTE]: 'Botte',
  [UNITE_CONDITIONNEMENT.BALLOT]: 'Ballot',
};

export const LABEL_TYPE_CARBURANT: Record<ValeurDe<typeof TYPE_CARBURANT>, string> = {
  [TYPE_CARBURANT.GAZOIL]: 'Gazole',
  [TYPE_CARBURANT.ESSENCE]: 'Essence',
  [TYPE_CARBURANT.GNR]: 'GNR (Gazole Non Routier)',
  [TYPE_CARBURANT.AUTRE]: 'Autre',
};

/**
 * Catégories d'aides PAC courantes — d'après un relevé d'aides type. Le nom exact et le
 * détail (montants par dispositif) figurent sur votre relevé annuel ; ajustez "Autre" si
 * votre aide ne correspond à aucune de ces lignes.
 */
export const LABEL_TYPE_AIDE: Record<ValeurDe<typeof TYPE_AIDE>, string> = {
  [TYPE_AIDE.PAIEMENT_BASE]: 'Aides découplées — Paiement de base (DPB)',
  [TYPE_AIDE.PAIEMENT_REDISTRIBUTIF]: 'Aides découplées — Paiement redistributif',
  [TYPE_AIDE.ECOREGIME]: 'Aides découplées — Écorégime',
  [TYPE_AIDE.PETITS_RUMINANTS]: 'Aide couplée aux petits ruminants',
  [TYPE_AIDE.ICHN]: 'ICHN (indemnité compensatoire de handicaps naturels)',
  [TYPE_AIDE.AUTRE]: 'Autre aide',
};

export const LABEL_CATEGORIE_ANIMAL: Record<ValeurDe<typeof CATEGORIE_ANIMAL>, string> = {
  get [CATEGORIE_ANIMAL.CHEVRE]() {
    return capitaliser(vocabulaire().femelle.pluriel);
  },
  get [CATEGORIE_ANIMAL.BOUC]() {
    return capitaliser(vocabulaire().male.pluriel);
  },
  get [CATEGORIE_ANIMAL.CABRIT]() {
    return capitaliser(vocabulaire().petit.pluriel);
  },
  [CATEGORIE_ANIMAL.VIVANTE]: 'Vivante',
  [CATEGORIE_ANIMAL.TOUT]: 'Tout',
};

export const LABEL_CATEGORIE_STOCKAGE: Record<ValeurDe<typeof CATEGORIE_STOCKAGE>, string> = {
  [CATEGORIE_STOCKAGE.CHEPTEL]: 'Cheptel',
  [CATEGORIE_STOCKAGE.VENTES]: 'Ventes',
  [CATEGORIE_STOCKAGE.FACTURES]: 'Factures',
  [CATEGORIE_STOCKAGE.VISITES_VETERINAIRE]: 'Visites vétérinaire',
  [CATEGORIE_STOCKAGE.CONTROLES]: 'Contrôles',
};

export const LABEL_TYPE_ANIMAL_ETABLISSEMENT: Record<ValeurDe<typeof TYPE_ANIMAL_ETABLISSEMENT>, string> = {
  [TYPE_ANIMAL_ETABLISSEMENT.COCHONS]: 'Cochons',
  [TYPE_ANIMAL_ETABLISSEMENT.VACHES]: 'Vaches',
  [TYPE_ANIMAL_ETABLISSEMENT.CHEVRES]: 'Chèvres',
  [TYPE_ANIMAL_ETABLISSEMENT.BREBIS]: 'Brebis',
};

export const LABEL_ACTIVITE_SOCIETE: Record<ValeurDe<typeof ACTIVITE_SOCIETE>, string> = {
  [ACTIVITE_SOCIETE.LIBERAL]: 'Libéral',
  [ACTIVITE_SOCIETE.PRESTATIONS_SERVICE]: 'Prestations de service',
  [ACTIVITE_SOCIETE.VENTE]: 'Vente',
  [ACTIVITE_SOCIETE.AGRICOLE]: 'Agriculture',
};

/** Activité d'une écriture comptable : une espèce, ou « commun ». */
export const LABEL_ACTIVITE_COMPTABLE: Record<
  ValeurDe<typeof TYPE_ANIMAL_ETABLISSEMENT> | typeof ACTIVITE_COMMUNE,
  string
> = {
  ...LABEL_TYPE_ANIMAL_ETABLISSEMENT,
  [ACTIVITE_COMMUNE]: 'Commun',
};
