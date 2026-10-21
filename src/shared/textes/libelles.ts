import { CIRCUIT_NON_RENSEIGNE, CIRCUIT_VENTE, STATUT_COMMANDE } from '@/shared/constants/commercial';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { SEXE, STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { ATELIER } from '@/shared/constants/ateliers';
import { CATEGORIE_CLIENT } from '@/shared/constants/clients';
import { CATEGORIE_FOURNISSEUR } from '@/shared/constants/fournisseurs';
import { ZONE_ICHN } from '@/shared/constants/controles';
import { PERIODICITE_TVA, REGIME_TVA_PILOTAGE } from '@/shared/constants/tva';
import {
  GROUPE_RECETTE,
  CATEGORIE_DEPENSE,
  CATEGORIE_RECETTE,
  CATEGORIE_VENTE,
  TYPE_AIDE,
  TYPE_ALIMENT,
  TYPE_CARBURANT,
  TYPE_FROMAGE,
  UNITE_CONDITIONNEMENT,
  UNITE_VENTE,
  RUBRIQUE_MARCHANDISE,
  UNITE_MARCHANDISE,
  OBJET_ASSURANCE,
} from '@/shared/constants/comptabilite';
import {
  ACTIVITE_COMMUNE,
  ACTIVITE_SOCIETE,
  TYPE_ANIMAL_ETABLISSEMENT,
} from '@/shared/constants/etablissements';
import { NATURE_URSSAF, REGIME_FISCAL, REGIME_TVA, STATUT_JURIDIQUE } from '@/shared/constants/entreprise';
import { FILTRE_DOSSIERS, STATUT_ELEMENT } from '@/shared/constants/dossiers';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { SERVICE_REPAS } from '@/shared/constants/gite';
import { ARTICLE_BOUCLE, ARTICLE_EMBALLAGE, ARTICLE_MATERIEL } from '@/shared/constants/stock';
import {
  ANGLE_ANALYSE,
  ETAT_ESPRIT,
  FILTRE_TRADES,
  PLAN_RESPECTE,
  SENS_TRADE,
  TYPE_INSTRUMENT,
} from '@/shared/constants/trading';
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

export const LABEL_CATEGORIE_CLIENT: Record<ValeurDe<typeof CATEGORIE_CLIENT>, string> = {
  [CATEGORIE_CLIENT.PARTICULIER]: 'Particulier',
  [CATEGORIE_CLIENT.RECOLTEUR]: 'Récolteur',
  [CATEGORIE_CLIENT.ORGANISME]: 'Organisme',
  [CATEGORIE_CLIENT.ENTREPRISE]: 'Entreprise',
  [CATEGORIE_CLIENT.SURFACE_COMMERCIALE]: 'Surface commerciale',
  [CATEGORIE_CLIENT.GROUPEMENT]: 'Groupement',
  [CATEGORIE_CLIENT.VISITEUR]: 'Visiteur',
  [CATEGORIE_CLIENT.GROUPE_VISITEURS]: 'Groupe de visiteurs',
};

export const LABEL_ZONE_ICHN: Record<ValeurDe<typeof ZONE_ICHN>, string> = {
  [ZONE_ICHN.HAUTE_MONTAGNE_SECHE]: 'Haute montagne sèche',
  [ZONE_ICHN.MONTAGNE_SECHE]: 'Montagne sèche',
  [ZONE_ICHN.ZSCN]: 'Zone à contraintes naturelles (ZSCN)',
  [ZONE_ICHN.ZSCS]: 'Zone à contraintes spécifiques (ZSCS)',
};

export const LABEL_OBJET_ASSURANCE: Record<ValeurDe<typeof OBJET_ASSURANCE>, string> = {
  [OBJET_ASSURANCE.BATIMENTS]: 'Bâtiments',
  [OBJET_ASSURANCE.ANIMAUX]: 'Animaux',
  [OBJET_ASSURANCE.VEHICULE]: 'Véhicule',
};

export const LABEL_CATEGORIE_FOURNISSEUR: Record<ValeurDe<typeof CATEGORIE_FOURNISSEUR>, string> = {
  [CATEGORIE_FOURNISSEUR.GENERAL]: 'Général',
  [CATEGORIE_FOURNISSEUR.VETERINAIRE]: 'Vétérinaire',
  [CATEGORIE_FOURNISSEUR.ETAT]: 'État',
  [CATEGORIE_FOURNISSEUR.ALIMENTS]: 'Aliments',
  [CATEGORIE_FOURNISSEUR.CARBURANT]: 'Distributeur de carburant',
  [CATEGORIE_FOURNISSEUR.GARAGE]: 'Garage / réparateur',
  [CATEGORIE_FOURNISSEUR.ORGANISME]: 'Organisme',
  [CATEGORIE_FOURNISSEUR.CHAMBRE_AGRICULTURE]: 'Chambre d’agriculture',
  [CATEGORIE_FOURNISSEUR.GROUPEMENT]: 'Groupement',
  [CATEGORIE_FOURNISSEUR.GROUPEMENT_SANITAIRE]: 'Groupement sanitaire (GDS)',
  [CATEGORIE_FOURNISSEUR.LABORATOIRE]: 'Laboratoire d’analyses',
  [CATEGORIE_FOURNISSEUR.ABATTOIR]: 'Abattoir',
  [CATEGORIE_FOURNISSEUR.EQUARRISSAGE]: 'Équarrissage',
  [CATEGORIE_FOURNISSEUR.ASSUREUR]: 'Assureur',
  [CATEGORIE_FOURNISSEUR.BANQUE]: 'Banque',
  [CATEGORIE_FOURNISSEUR.EMBALLAGES]: 'Fournisseur d’emballages',
  [CATEGORIE_FOURNISSEUR.TOURISME]: 'Office de tourisme / partenaire',
  [CATEGORIE_FOURNISSEUR.REPAS]: 'Fournisseur du repas',
  [CATEGORIE_FOURNISSEUR.NON_FACTURABLE]: 'Non facturable',
};

export const LABEL_CATEGORIE_VENTE: Record<ValeurDe<typeof CATEGORIE_VENTE>, string> = {
  [CATEGORIE_VENTE.LAIT]: 'Lait',
  [CATEGORIE_VENTE.FROMAGE]: 'Fromage',
  [CATEGORIE_VENTE.VIANDE]: 'Viande',
  [CATEGORIE_VENTE.BOUCHERIE_CHARCUTERIE]: 'Boucherie / charcuterie',
  [CATEGORIE_VENTE.ANIMAL_SUR_PIED]: 'Animal sur pied',
  [CATEGORIE_VENTE.ANIMAL_VIVANT]: 'Animal vivant',
  [CATEGORIE_VENTE.ANIMAL_MORT]: 'Animal mort',
  [CATEGORIE_VENTE.OEUFS]: 'Œufs',
  get [CATEGORIE_VENTE.CABRIS]() {
    return capitaliser(vocabulaire().petit.pluriel);
  },
};

export const LABEL_TYPE_FROMAGE: Record<ValeurDe<typeof TYPE_FROMAGE>, string> = {
  [TYPE_FROMAGE.FRAIS]: 'Frais',
  [TYPE_FROMAGE.AFFINE]: 'Affiné',
  [TYPE_FROMAGE.CROTTIN]: 'Crottin',
  [TYPE_FROMAGE.BROCCIU]: 'Brocciu',
  [TYPE_FROMAGE.AUTRE]: 'Autre',
};

/** Unité d'une vente, abrégée (affichage dans une phrase). */
export const LABEL_UNITE_VENTE_COURT: Record<ValeurDe<typeof UNITE_VENTE>, string> = {
  [UNITE_VENTE.LITRES]: 'L',
  [UNITE_VENTE.PIECE]: 'pièce(s)',
  [UNITE_VENTE.KG]: 'kg',
};

/** Les mois en court, sous les points d'un graphique (juin et juillet restent distincts). */
export const NOMS_MOIS_COURTS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
] as const;

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
  [CATEGORIE_DEPENSE.ANALYSES_LABORATOIRE]: 'Analyses de laboratoire',
  [CATEGORIE_DEPENSE.ASSURANCE_VEHICULE]: 'Assurance véhicule',
  [CATEGORIE_DEPENSE.PRODUCTION]: 'Production',
  [CATEGORIE_DEPENSE.ANIMAUX_VIVANTS]: 'Animaux vivants (achat)',
  [CATEGORIE_DEPENSE.ANIMAUX_VIVANTS_VENTE]: 'Animaux vivants (sortie)',
  [CATEGORIE_DEPENSE.IMPOTS]: 'Impôts & taxes',
  [CATEGORIE_DEPENSE.AUTRE]: 'Autre',
  [CATEGORIE_DEPENSE.ACHATS_MARCHANDISES]: 'Achats de marchandises',
  [CATEGORIE_DEPENSE.FOURNITURES]: 'Fournitures',
  [CATEGORIE_DEPENSE.SOUS_TRAITANCE]: 'Sous-traitance',
  [CATEGORIE_DEPENSE.LOYER_CHARGES]: 'Loyer et charges',
  [CATEGORIE_DEPENSE.ASSURANCES]: 'Assurances',
  [CATEGORIE_DEPENSE.TELECOM]: 'Téléphone et internet',
  [CATEGORIE_DEPENSE.DEPLACEMENTS]: 'Déplacements',
  [CATEGORIE_DEPENSE.FRAIS_BANCAIRES]: 'Frais bancaires',
  [CATEGORIE_DEPENSE.COTISATIONS_SOCIALES]: 'Cotisations sociales (URSSAF)',
  [CATEGORIE_DEPENSE.FORMATION]: 'Formation',
  [CATEGORIE_DEPENSE.HONORAIRES]: 'Honoraires',
  [CATEGORIE_DEPENSE.PUBLICITE]: 'Publicité',
  [CATEGORIE_DEPENSE.MATERIEL]: 'Matériel et équipement',
  [CATEGORIE_DEPENSE.REMBOURSEMENT_CLIENT]: 'Remboursement client',
  [CATEGORIE_DEPENSE.PERTES_TRADING]: 'Pertes de trading',
  [CATEGORIE_DEPENSE.RETRAIT]: 'Retrait du compte',
};

export const LABEL_CATEGORIE_RECETTE: Record<ValeurDe<typeof CATEGORIE_RECETTE>, string> = {
  [CATEGORIE_RECETTE.LAIT]: 'Vente de lait',
  [CATEGORIE_RECETTE.FROMAGE]: 'Vente de fromage',
  [CATEGORIE_RECETTE.VIANDE]: 'Vente de viande',
  [CATEGORIE_RECETTE.BOUCHERIE_CHARCUTERIE]: 'Vente de boucherie / charcuterie',
  [CATEGORIE_RECETTE.ANIMAL_SUR_PIED]: 'Vente d’animal sur pied',
  [CATEGORIE_RECETTE.ANIMAL_VIVANT]: 'Vente d’animal vivant',
  [CATEGORIE_RECETTE.ANIMAL_MORT]: 'Vente d’animal mort',
  [CATEGORIE_RECETTE.OEUFS]: 'Vente d’œufs',
  get [CATEGORIE_RECETTE.CABRIS]() {
    return `Vente ${de(vocabulaire().petit.pluriel)}`;
  },
  [CATEGORIE_RECETTE.AIDE]: 'Aide / subvention',
  [CATEGORIE_RECETTE.AUTRE]: 'Autre recette',
  [CATEGORIE_RECETTE.PRESTATIONS]: 'Prestations de services',
  [CATEGORIE_RECETTE.VENTE_MARCHANDISES]: 'Vente de marchandises',
  [CATEGORIE_RECETTE.HEBERGEMENT]: 'Hébergement',
  [CATEGORIE_RECETTE.RESTAURATION]: 'Restauration',
  [CATEGORIE_RECETTE.BAR]: 'Bar',
  [CATEGORIE_RECETTE.COTISATIONS]: 'Cotisations des adhérents',
  [CATEGORIE_RECETTE.DONS]: 'Dons',
  [CATEGORIE_RECETTE.GROUPEMENT_SANITAIRE]: 'Groupement sanitaire (GDS)',
  [CATEGORIE_RECETTE.REMBOURSEMENT_ANALYSES]: 'Remboursement d’analyses',
  [CATEGORIE_RECETTE.ASSURANCE_VEHICULE]: 'Assurance véhicule (indemnité)',
  [CATEGORIE_RECETTE.GAINS_TRADING]: 'Gains de trading',
  [CATEGORIE_RECETTE.DEPOT]: 'Dépôt sur le compte',
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
  [TYPE_ALIMENT.MAIS_CONCASSE]: 'Maïs concassé',
  [TYPE_ALIMENT.MAIS_PONTE]: 'Maïs ponte',
  [TYPE_ALIMENT.CROQUETTES]: 'Croquettes',
  [TYPE_ALIMENT.AUTRE]: 'Autre',
};

export const LABEL_RUBRIQUE_MARCHANDISE: Record<ValeurDe<typeof RUBRIQUE_MARCHANDISE>, string> = {
  [RUBRIQUE_MARCHANDISE.BAR]: 'Bar',
  [RUBRIQUE_MARCHANDISE.RESTAURANT]: 'Restaurant',
  [RUBRIQUE_MARCHANDISE.ANNEXE]: 'Activité annexe',
};

export const LABEL_UNITE_MARCHANDISE: Record<ValeurDe<typeof UNITE_MARCHANDISE>, string> = {
  [UNITE_MARCHANDISE.UNITE]: 'Unité',
  [UNITE_MARCHANDISE.KG]: 'kg',
  [UNITE_MARCHANDISE.BAC]: 'Bac',
  [UNITE_MARCHANDISE.PIECE]: 'Pièce',
  [UNITE_MARCHANDISE.LITRE]: 'Litre',
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

export const LABEL_CATEGORIE_STOCKAGE: Record<ValeurDe<typeof CATEGORIE_STOCKAGE>, string> = {
  [CATEGORIE_STOCKAGE.CHEPTEL]: 'Cheptel',
  [CATEGORIE_STOCKAGE.VENTES]: 'Ventes',
  [CATEGORIE_STOCKAGE.FACTURES]: 'Factures',
  [CATEGORIE_STOCKAGE.VISITES_VETERINAIRE]: 'Visites vétérinaire',
  [CATEGORIE_STOCKAGE.TRAITEMENTS]: 'Traitements',
  [CATEGORIE_STOCKAGE.CONTROLES]: 'Contrôles',
};

export const LABEL_TYPE_ANIMAL_ETABLISSEMENT: Record<string, string> = {
  [TYPE_ANIMAL_ETABLISSEMENT.COCHONS]: 'Cochons',
  [TYPE_ANIMAL_ETABLISSEMENT.VACHES]: 'Vaches',
  [TYPE_ANIMAL_ETABLISSEMENT.CHEVRES]: 'Chèvres',
  [TYPE_ANIMAL_ETABLISSEMENT.BREBIS]: 'Brebis',
  [TYPE_ANIMAL_ETABLISSEMENT.POULES]: 'Poules',
  [TYPE_ANIMAL_ETABLISSEMENT.DOMESTIQUES]: 'Animaux domestiques',
};

export const LABEL_ACTIVITE_SOCIETE: Record<ValeurDe<typeof ACTIVITE_SOCIETE>, string> = {
  [ACTIVITE_SOCIETE.LIBERAL]: 'Activité financière',
  [ACTIVITE_SOCIETE.PRESTATIONS_SERVICE]: 'Secrétariat',
  [ACTIVITE_SOCIETE.ASSOCIATION]: 'Gestion de gîte',
  [ACTIVITE_SOCIETE.AGRICOLE]: 'Agriculture (élevage)',
  [ACTIVITE_SOCIETE.PERSO]: 'Perso',
};

/** Activité d'une écriture comptable : une espèce, ou « commun ». */
export const LABEL_ACTIVITE_COMPTABLE: Record<string, string> = {
  ...LABEL_TYPE_ANIMAL_ETABLISSEMENT,
  [ACTIVITE_COMMUNE]: 'Commun',
};

/** Premier niveau du choix d'une recette. */
export const LABEL_GROUPE_RECETTE: Record<ValeurDe<typeof GROUPE_RECETTE>, string> = {
  // Les titres des listes de l'inventaire (35. Produits finis, 33. Produits animaux).
  [GROUPE_RECETTE.FROMAGES]: 'Fromages',
  [GROUPE_RECETTE.LAIT]: 'Lait',
  [GROUPE_RECETTE.OEUFS]: 'Œufs',
  [GROUPE_RECETTE.VIANDE]: 'Animaux',
  [GROUPE_RECETTE.BOUCHERIE]: 'Boucherie et charcuterie',
  [GROUPE_RECETTE.AIDE]: 'Aide / subvention',
  [GROUPE_RECETTE.AUTRE]: 'Autre recette',
  [GROUPE_RECETTE.GROUPEMENT_SANITAIRE]: 'Groupement sanitaire (GDS)',
  [GROUPE_RECETTE.REMBOURSEMENT_ANALYSES]: 'Remboursement d’analyses',
  [GROUPE_RECETTE.ASSURANCE_VEHICULE]: 'Assurance véhicule (indemnité)',
  [GROUPE_RECETTE.PRESTATIONS]: 'Prestations de services',
  [GROUPE_RECETTE.VENTE_MARCHANDISES]: 'Vente de marchandises',
  [GROUPE_RECETTE.HEBERGEMENT]: 'Hébergement',
  [GROUPE_RECETTE.RESTAURATION]: 'Restauration',
  [GROUPE_RECETTE.BAR]: 'Bar',
  [GROUPE_RECETTE.COTISATIONS]: 'Cotisations des adhérents',
  [GROUPE_RECETTE.DONS]: 'Dons',
  [GROUPE_RECETTE.GAINS_TRADING]: 'Gains de trading',
  [GROUPE_RECETTE.DEPOT]: 'Dépôt sur le compte',
};

export const LABEL_STATUT_JURIDIQUE: Record<ValeurDe<typeof STATUT_JURIDIQUE>, string> = {
  [STATUT_JURIDIQUE.MICRO_ENTREPRISE]: 'Auto-entrepreneur (micro-entreprise)',
  [STATUT_JURIDIQUE.ENTREPRISE_INDIVIDUELLE]: 'Entreprise individuelle',
  [STATUT_JURIDIQUE.EURL]: 'EURL',
  [STATUT_JURIDIQUE.SASU]: 'SASU',
  [STATUT_JURIDIQUE.SARL]: 'SARL',
  [STATUT_JURIDIQUE.SAS]: 'SAS',
  [STATUT_JURIDIQUE.ASSOCIATION]: 'Association loi 1901',
  [STATUT_JURIDIQUE.AUTRE]: 'Autre',
};

export const LABEL_REGIME_FISCAL: Record<ValeurDe<typeof REGIME_FISCAL>, string> = {
  [REGIME_FISCAL.MICRO_BNC]: 'Micro-BNC',
  [REGIME_FISCAL.MICRO_BIC_SERVICES]: 'Micro-BIC (prestations de services)',
  [REGIME_FISCAL.MICRO_BIC_VENTE]: 'Micro-BIC (vente de marchandises)',
  [REGIME_FISCAL.DECLARATION_CONTROLEE]: 'Déclaration contrôlée (BNC au réel)',
  [REGIME_FISCAL.REEL_SIMPLIFIE]: 'Réel simplifié (BIC)',
  [REGIME_FISCAL.REEL_NORMAL]: 'Réel normal (BIC)',
  [REGIME_FISCAL.IMPOT_SOCIETES]: 'Impôt sur les sociétés',
  [REGIME_FISCAL.NON_FISCALISE]: 'Association non fiscalisée',
};

/** Les natures de recette de la déclaration URSSAF (les mots de la déclaration d'un micro-entrepreneur). */
export const LABEL_NATURE_URSSAF: Record<ValeurDe<typeof NATURE_URSSAF>, string> = {
  [NATURE_URSSAF.VENTE_MARCHANDISES]: 'Vente de marchandises',
  [NATURE_URSSAF.SERVICES_COMMERCIAUX]: 'Prestations de services commerciales ou artisanales',
  [NATURE_URSSAF.SERVICES_LIBERAUX]: 'Prestations de services libérales',
};

export const LABEL_REGIME_TVA: Record<ValeurDe<typeof REGIME_TVA>, string> = {
  [REGIME_TVA.REEL_SIMPLIFIE]: 'Réel simplifié',
  [REGIME_TVA.REEL_NORMAL]: 'Réel normal',
};

export const LABEL_REGIME_TVA_PILOTAGE: Record<ValeurDe<typeof REGIME_TVA_PILOTAGE>, string> = {
  [REGIME_TVA_PILOTAGE.FRANCHISE]: 'Franchise en base (pas de TVA)',
  [REGIME_TVA_PILOTAGE.RFA]: 'Remboursement forfaitaire agricole (RFA)',
  [REGIME_TVA_PILOTAGE.REEL_SIMPLIFIE]: 'Réel simplifié (CA12)',
  [REGIME_TVA_PILOTAGE.REEL_NORMAL]: 'Réel normal (CA3)',
};

export const LABEL_PERIODICITE_TVA: Record<ValeurDe<typeof PERIODICITE_TVA>, string> = {
  [PERIODICITE_TVA.MENSUELLE]: 'Mensuelle',
  [PERIODICITE_TVA.TRIMESTRIELLE]: 'Trimestrielle',
  [PERIODICITE_TVA.ANNUELLE]: 'Annuelle',
};

export const LABEL_ATELIER: Record<ValeurDe<typeof ATELIER>, string> = {
  [ATELIER.LAIT]: 'Lait',
  [ATELIER.FROMAGE]: 'Fromage',
  // Les petits (cabris, agneaux…) vendus pour leur viande : l'atelier de la viande.
  [ATELIER.PETITS]: 'Viande',
  [ATELIER.ANIMAUX]: 'Reproducteurs et réformes',
  [ATELIER.VIANDE]: 'Boucherie et charcuterie',
  [ATELIER.OEUFS]: 'Œufs',
  [ATELIER.AGRITOURISME]: 'Agritourisme',
  [ATELIER.AUTRES]: 'Autres recettes',
};

export const LABEL_STATUT_ELEMENT: Record<ValeurDe<typeof STATUT_ELEMENT>, string> = {
  [STATUT_ELEMENT.A_FAIRE]: 'À faire',
  [STATUT_ELEMENT.EN_COURS]: 'En cours',
  [STATUT_ELEMENT.TERMINE]: 'Terminé',
};

export const LABEL_FILTRE_DOSSIERS: Record<ValeurDe<typeof FILTRE_DOSSIERS>, string> = {
  [FILTRE_DOSSIERS.TOUT]: 'Tout',
  [FILTRE_DOSSIERS.A_FAIRE]: 'À faire',
  [FILTRE_DOSSIERS.EN_COURS]: 'En cours',
  [FILTRE_DOSSIERS.TERMINE]: 'Terminé',
  [FILTRE_DOSSIERS.EN_RETARD]: 'En retard',
};

export const LABEL_SENS_TRADE: Record<ValeurDe<typeof SENS_TRADE>, string> = {
  [SENS_TRADE.ACHAT]: 'Achat',
  [SENS_TRADE.VENTE]: 'Vente',
};

export const LABEL_TYPE_INSTRUMENT: Record<ValeurDe<typeof TYPE_INSTRUMENT>, string> = {
  [TYPE_INSTRUMENT.ACTION]: 'Action',
  [TYPE_INSTRUMENT.ETF]: 'ETF',
  [TYPE_INSTRUMENT.FOREX]: 'Forex',
  [TYPE_INSTRUMENT.CRYPTO]: 'Crypto',
  [TYPE_INSTRUMENT.FUTURES]: 'Futures',
  [TYPE_INSTRUMENT.OPTION]: 'Option',
  [TYPE_INSTRUMENT.CFD]: 'CFD',
  [TYPE_INSTRUMENT.AUTRE]: 'Autre',
};

export const LABEL_ETAT_ESPRIT: Record<ValeurDe<typeof ETAT_ESPRIT>, string> = {
  [ETAT_ESPRIT.CALME]: 'Calme',
  [ETAT_ESPRIT.CONFIANT]: 'Confiant',
  [ETAT_ESPRIT.HESITANT]: 'Hésitant',
  [ETAT_ESPRIT.STRESSE]: 'Stressé',
  [ETAT_ESPRIT.IMPULSIF]: 'Impulsif',
  [ETAT_ESPRIT.PEUR_DE_RATER]: 'Peur de rater le mouvement',
  [ETAT_ESPRIT.REVANCHE]: 'Envie de se refaire',
};

export const LABEL_PLAN_RESPECTE: Record<ValeurDe<typeof PLAN_RESPECTE>, string> = {
  [PLAN_RESPECTE.OUI]: 'Oui',
  [PLAN_RESPECTE.NON]: 'Non',
};

export const LABEL_FILTRE_TRADES: Record<ValeurDe<typeof FILTRE_TRADES>, string> = {
  [FILTRE_TRADES.TOUS]: 'Tous',
  [FILTRE_TRADES.OUVERTS]: 'Ouverts',
  [FILTRE_TRADES.GAGNANTS]: 'Gagnants',
  [FILTRE_TRADES.PERDANTS]: 'Perdants',
  [FILTRE_TRADES.HORS_PLAN]: 'Hors plan',
};

export const LABEL_ANGLE_ANALYSE: Record<ValeurDe<typeof ANGLE_ANALYSE>, string> = {
  [ANGLE_ANALYSE.STRATEGIE]: 'Stratégie',
  [ANGLE_ANALYSE.INSTRUMENT]: 'Instrument',
  [ANGLE_ANALYSE.ETAT_ESPRIT]: 'État d’esprit',
  [ANGLE_ANALYSE.JOUR]: 'Jour',
};

export const LABEL_EMBALLAGE: Record<ValeurDe<typeof ARTICLE_EMBALLAGE>, string> = {
  [ARTICLE_EMBALLAGE.PAPIER_ALIMENTAIRE]: 'Papier alimentaire',
  [ARTICLE_EMBALLAGE.POT_500G]: 'Pot 500 g',
  [ARTICLE_EMBALLAGE.COUVERCLE_500G]: 'Couvercle 500 g',
  [ARTICLE_EMBALLAGE.POT_1KG]: 'Pot 1 kg',
  [ARTICLE_EMBALLAGE.COUVERCLE_1KG]: 'Couvercle 1 kg',
  [ARTICLE_EMBALLAGE.FAISSELLE]: 'Faisselle',
  [ARTICLE_EMBALLAGE.PAPIER_CROTTIN]: 'Papier alimentaire (taille crottin)',
  [ARTICLE_EMBALLAGE.ETIQUETTE_CROTTIN]: 'Étiquette (taille crottin)',
  [ARTICLE_EMBALLAGE.SAC_PLASTIQUE]: 'Sac en plastique',
};

export const LABEL_BOUCLE: Record<ValeurDe<typeof ARTICLE_BOUCLE>, string> = {
  [ARTICLE_BOUCLE.BOUCLES]: 'Boucles',
  [ARTICLE_BOUCLE.ROUGES]: 'Boucles rouges',
  [ARTICLE_BOUCLE.REBOUCLAGE]: 'Boucles de rebouclage',
  [ARTICLE_BOUCLE.TIPTAG]: 'Tiptag',
};

export const LABEL_MATERIEL: Record<ValeurDe<typeof ARTICLE_MATERIEL>, string> = {
  [ARTICLE_MATERIEL.BONBONNE_GAZ]: 'Bonbonne de gaz (brocciu)',
  [ARTICLE_MATERIEL.CASSEROLE_40L]: 'Casserole 40 L',
  [ARTICLE_MATERIEL.ECUMOIRE]: 'Écumoire',
  [ARTICLE_MATERIEL.CHARLOTTE]: 'Charlottes',
  [ARTICLE_MATERIEL.GANTS]: 'Gants',
  [ARTICLE_MATERIEL.PRESURE]: 'Présure',
  [ARTICLE_MATERIEL.SEL]: 'Sel',
};

export const LABEL_SERVICE_REPAS: Record<ValeurDe<typeof SERVICE_REPAS>, string> = {
  [SERVICE_REPAS.MIDI]: 'Midi',
  [SERVICE_REPAS.SOIR]: 'Soir',
  [SERVICE_REPAS.MIDI_SOIR]: 'Midi et soir',
};

/** Les circuits de vente. */
export const LABEL_CIRCUIT_VENTE: Record<
  ValeurDe<typeof CIRCUIT_VENTE> | typeof CIRCUIT_NON_RENSEIGNE,
  string
> = {
  [CIRCUIT_VENTE.FERME]: 'Vente à la ferme',
  [CIRCUIT_VENTE.MARCHE]: 'Marché',
  [CIRCUIT_VENTE.PANIER]: 'Paniers et AMAP',
  [CIRCUIT_VENTE.RESTAURATEUR]: 'Restaurateurs',
  [CIRCUIT_VENTE.MAGASIN]: 'Magasins et épiceries',
  [CIRCUIT_VENTE.GROSSISTE]: 'Grossiste ou coopérative',
  [CIRCUIT_VENTE.EN_LIGNE]: 'Vente en ligne',
  [CIRCUIT_VENTE.AUTRE]: 'Autre circuit',
  [CIRCUIT_NON_RENSEIGNE]: 'Circuit non renseigné',
};

/** Les étapes d'une commande. */
export const LABEL_STATUT_COMMANDE: Record<ValeurDe<typeof STATUT_COMMANDE>, string> = {
  [STATUT_COMMANDE.A_PREPARER]: 'À préparer',
  [STATUT_COMMANDE.PREPAREE]: 'Préparée',
  [STATUT_COMMANDE.LIVREE]: 'Livrée',
  [STATUT_COMMANDE.ANNULEE]: 'Annulée',
};
