import type { ValeurDe } from '@/shared/constants/valeurDe';
import { ONGLET_STOCK_BAR } from '@/shared/constants/bar';
import { SECTION_STOCK } from '@/shared/constants/stock';
import {
  CATEGORIE_DEPENSE,
  CATEGORIE_RECETTE,
  TYPE_AIDE,
  TYPE_ALIMENT,
  UNITE_CONDITIONNEMENT,
} from '@/shared/constants/comptabilite';

/** Plan comptable (comptes PCG), poids de conditionnement et taux d'imposition par défaut — à modifier ici uniquement. */

export interface CompteComptable {
  numero: string;
  libelle: string;
}

/**
 * Correspondance indicative avec le Plan Comptable Général français, basée sur les
 * pratiques courantes pour une petite exploitation agricole. Ce ne sont PAS des
 * numéros validés par un expert-comptable pour votre cas précis — à confirmer avec
 * votre comptable ou CGA avant tout usage officiel (déclaration, bilan...).
 */
export const COMPTE_PAR_DEPENSE: Record<ValeurDe<typeof CATEGORIE_DEPENSE>, CompteComptable> = {
  [CATEGORIE_DEPENSE.ALIMENTATION]: { numero: '601100', libelle: 'Achats stockés — Aliments du bétail' },
  [CATEGORIE_DEPENSE.CARBURANT]: { numero: '606110', libelle: 'Achats non stockés — Carburants' },
  [CATEGORIE_DEPENSE.REPARATION]: { numero: '615400', libelle: 'Entretien et réparations — Matériel' },
  [CATEGORIE_DEPENSE.VETERINAIRE]: { numero: '622600', libelle: 'Honoraires vétérinaires' },
  [CATEGORIE_DEPENSE.ASSURANCE_VEHICULE]: { numero: '616100', libelle: 'Primes d’assurances — Véhicules' },
  [CATEGORIE_DEPENSE.ANALYSES_LABORATOIRE]: { numero: '622800', libelle: 'Honoraires divers — Analyses de laboratoire' },
  [CATEGORIE_DEPENSE.PRODUCTION]: {
    numero: '602200',
    libelle: 'Fournitures consommables — Fournitures liées à la production (sel, présure...)',
  },
  [CATEGORIE_DEPENSE.ANIMAUX_VIVANTS]: { numero: '601200', libelle: 'Achats stockés — Animaux vivants' },
  [CATEGORIE_DEPENSE.ANIMAUX_VIVANTS_VENTE]: { numero: '611000', libelle: 'Sous-traitance générale — Abattage des animaux vivants' },
  [CATEGORIE_DEPENSE.IMPOTS]: { numero: '635000', libelle: 'Autres impôts, taxes et versements assimilés' },
  [CATEGORIE_DEPENSE.AUTRE]: { numero: '606800', libelle: 'Autres matières et fournitures' },
  [CATEGORIE_DEPENSE.ACHATS_MARCHANDISES]: { numero: '607000', libelle: 'Achats de marchandises' },
  [CATEGORIE_DEPENSE.FOURNITURES]: { numero: '606400', libelle: 'Fournitures administratives' },
  [CATEGORIE_DEPENSE.SOUS_TRAITANCE]: { numero: '611000', libelle: 'Sous-traitance générale' },
  [CATEGORIE_DEPENSE.LOYER_CHARGES]: { numero: '613200', libelle: 'Locations immobilières et charges' },
  [CATEGORIE_DEPENSE.ASSURANCES]: { numero: '616000', libelle: 'Primes d’assurances' },
  [CATEGORIE_DEPENSE.TELECOM]: { numero: '626000', libelle: 'Frais postaux et télécommunications' },
  [CATEGORIE_DEPENSE.DEPLACEMENTS]: { numero: '625100', libelle: 'Voyages et déplacements' },
  [CATEGORIE_DEPENSE.FRAIS_BANCAIRES]: { numero: '627000', libelle: 'Services bancaires et assimilés' },
  [CATEGORIE_DEPENSE.COTISATIONS_SOCIALES]: {
    numero: '646000',
    libelle: 'Cotisations sociales personnelles de l’exploitant',
  },
  [CATEGORIE_DEPENSE.FORMATION]: { numero: '618400', libelle: 'Formation professionnelle' },
  [CATEGORIE_DEPENSE.HONORAIRES]: { numero: '622600', libelle: 'Honoraires (comptable, conseil…)' },
  [CATEGORIE_DEPENSE.PERTES_TRADING]: {
    numero: '667000',
    libelle: 'Charges nettes sur cessions de valeurs mobilières de placement',
  },
  [CATEGORIE_DEPENSE.RETRAIT]: { numero: '108000', libelle: 'Compte de l’exploitant — Prélèvements' },
  [CATEGORIE_DEPENSE.REMBOURSEMENT_CLIENT]: {
    numero: '709000',
    libelle: 'Rabais, remises et ristournes accordés (remboursements aux clients)',
  },
  [CATEGORIE_DEPENSE.PUBLICITE]: { numero: '623000', libelle: 'Publicité, publications' },
  [CATEGORIE_DEPENSE.MATERIEL]: { numero: '606300', libelle: 'Fournitures d’entretien et petit équipement' },
};

export const COMPTE_PAR_RECETTE: Record<ValeurDe<typeof CATEGORIE_RECETTE>, CompteComptable> = {
  [CATEGORIE_RECETTE.LAIT]: { numero: '701100', libelle: 'Ventes de produits finis — Lait' },
  [CATEGORIE_RECETTE.FROMAGE]: { numero: '701200', libelle: 'Ventes de produits finis — Fromage' },
  [CATEGORIE_RECETTE.CABRIS]: { numero: '701300', libelle: 'Ventes de produits finis — Animaux' },
  [CATEGORIE_RECETTE.VIANDE]: { numero: '701300', libelle: 'Ventes de produits finis — Animaux' },
  [CATEGORIE_RECETTE.BOUCHERIE_CHARCUTERIE]: {
    numero: '701500',
    libelle: 'Ventes de produits finis — Boucherie et charcuterie',
  },
  [CATEGORIE_RECETTE.SAVONS]: { numero: '701700', libelle: 'Ventes de produits finis — Savons (cosmétiques)' },
  [CATEGORIE_RECETTE.ANIMAL_SUR_PIED]: { numero: '701300', libelle: 'Ventes de produits finis — Animaux' },
  [CATEGORIE_RECETTE.ANIMAL_VIVANT]: { numero: '701300', libelle: 'Ventes de produits finis — Animaux' },
  [CATEGORIE_RECETTE.ANIMAL_MORT]: {
    numero: '701500',
    libelle: 'Ventes de produits finis — Boucherie et charcuterie',
  },
  [CATEGORIE_RECETTE.OEUFS]: { numero: '701600', libelle: 'Ventes de produits finis — Œufs' },
  [CATEGORIE_RECETTE.AIDE]: { numero: '740000', libelle: 'Subventions d’exploitation' },
  [CATEGORIE_RECETTE.GROUPEMENT_SANITAIRE]: { numero: '758000', libelle: 'Produits divers de gestion courante — Groupement sanitaire (GDS)' },
  [CATEGORIE_RECETTE.ASSURANCE_VEHICULE]: { numero: '791000', libelle: 'Transferts de charges — Indemnités d’assurance des véhicules' },
  [CATEGORIE_RECETTE.REMBOURSEMENT_ANALYSES]: { numero: '758000', libelle: 'Produits divers de gestion courante — Remboursement d’analyses' },
  [CATEGORIE_RECETTE.AUTRE]: { numero: '708000', libelle: 'Produits des activités annexes' },
  [CATEGORIE_RECETTE.PRESTATIONS]: { numero: '706000', libelle: 'Prestations de services' },
  [CATEGORIE_RECETTE.VENTE_MARCHANDISES]: { numero: '707000', libelle: 'Ventes de marchandises' },
  [CATEGORIE_RECETTE.HEBERGEMENT]: { numero: '706100', libelle: 'Prestations de services — Hébergement' },
  [CATEGORIE_RECETTE.RESTAURATION]: { numero: '707100', libelle: 'Ventes de marchandises — Restauration' },
  [CATEGORIE_RECETTE.BAR]: { numero: '707200', libelle: 'Ventes de marchandises — Bar' },
  [CATEGORIE_RECETTE.COTISATIONS]: { numero: '756000', libelle: 'Cotisations des adhérents' },
  [CATEGORIE_RECETTE.DONS]: { numero: '754000', libelle: 'Dons manuels' },
  [CATEGORIE_RECETTE.GAINS_TRADING]: {
    numero: '767000',
    libelle: 'Produits nets sur cessions de valeurs mobilières de placement',
  },
  [CATEGORIE_RECETTE.DEPOT]: { numero: '108000', libelle: 'Compte de l’exploitant — Apports' },
};

/** Le compte des matières alimentaires consommables (farine, œufs, huile d'olive…) : des matières premières, achats stockés (601). */
export const COMPTE_DENREES: CompteComptable = {
  numero: '601400',
  libelle: 'Matières alimentaires consommables (farine, œufs, huile…)',
};

/** Le compte des matières premières des savons (huiles, soude, beurres, huiles essentielles) : des achats stockés de matières premières (601). */
export const COMPTE_MATIERES_SAVON: CompteComptable = {
  numero: '601410',
  libelle: 'Matières premières des savons (huiles, soude, beurres…)',
};

/** Le compte des boucles d'identification (la section des boucles de l'inventaire). */
export const COMPTE_BOUCLES: CompteComptable = {
  numero: '601500',
  libelle: 'Boucles d’identification',
};

/**
 * Liste élargie de comptes PCG courants pour une petite exploitation agricole, proposée dans le
 * sélecteur manuel (catégorie "Autre") en plus des comptes déjà affectés automatiquement ci-dessus.
 * Toujours indicatif — à confirmer avec votre comptable/CGA.
 */
export const COMPTES_PCG_DEPENSE: CompteComptable[] = [
  { numero: '601100', libelle: 'Aliments du bétail' },
  { numero: '601200', libelle: 'Engrais et amendements' },
  { numero: '601300', libelle: 'Semences et plants' },
  { numero: COMPTE_DENREES.numero, libelle: COMPTE_DENREES.libelle },
  { numero: COMPTE_MATIERES_SAVON.numero, libelle: COMPTE_MATIERES_SAVON.libelle },
  { numero: COMPTE_BOUCLES.numero, libelle: COMPTE_BOUCLES.libelle },
  { numero: '602200', libelle: 'Fournitures consommables — Production (sel, présure...)' },
  { numero: '602600', libelle: 'Emballages' },
  { numero: '604000', libelle: 'Études et prestations de services' },
  { numero: '606100', libelle: 'Eau, électricité' },
  { numero: '606110', libelle: 'Carburants' },
  { numero: '606300', libelle: 'Fournitures d’entretien, petit équipement' },
  { numero: '606400', libelle: 'Fournitures de bureau' },
  { numero: '606800', libelle: 'Autres matières et fournitures' },
  { numero: '607000', libelle: 'Achats de marchandises' },
  { numero: '607100', libelle: 'Achats de marchandises — Restauration et bar' },
  { numero: '611000', libelle: 'Sous-traitance générale' },
  { numero: '613200', libelle: 'Location de locaux' },
  { numero: '613500', libelle: 'Location de matériel' },
  { numero: '614000', libelle: 'Charges locatives et de copropriété' },
  { numero: '615600', libelle: 'Maintenance (logiciels, abonnements)' },
  { numero: '615400', libelle: 'Entretien et réparations — Matériel' },
  { numero: '615500', libelle: 'Entretien et réparations — Bâtiments' },
  { numero: '616100', libelle: 'Assurance — Multirisques' },
  { numero: '616300', libelle: 'Assurance — Responsabilité civile' },
  { numero: '618100', libelle: 'Documentation générale' },
  { numero: '618300', libelle: 'Documentation technique' },
  { numero: '618400', libelle: 'Formation professionnelle' },
  { numero: '621000', libelle: 'Personnel extérieur, main-d’œuvre' },
  { numero: '622600', libelle: 'Honoraires vétérinaires' },
  { numero: '622700', libelle: 'Frais d’actes et de contentieux' },
  { numero: '623000', libelle: 'Publicité, publications' },
  { numero: '625100', libelle: 'Voyages et déplacements' },
  { numero: '626000', libelle: 'Frais postaux et télécommunications' },
  { numero: '627000', libelle: 'Services bancaires' },
  { numero: '627100', libelle: 'Frais sur titres (courtage, droits de garde)' },
  { numero: '627800', libelle: 'Autres frais et commissions sur prestations de services' },
  { numero: '635000', libelle: 'Impôts, taxes et versements assimilés' },
  { numero: '645100', libelle: 'Cotisations MSA' },
  { numero: '646000', libelle: 'Cotisations sociales personnelles de l’exploitant' },
  { numero: '661100', libelle: 'Intérêts d’emprunts' },
  { numero: '666000', libelle: 'Pertes de change' },
  { numero: '667000', libelle: 'Charges nettes sur cessions de valeurs mobilières de placement' },
  { numero: '668000', libelle: 'Autres charges financières' },
  { numero: '108000', libelle: 'Compte de l’exploitant (prélèvements)' },
];

export const COMPTES_PCG_RECETTE: CompteComptable[] = [
  { numero: '701100', libelle: 'Ventes — Lait' },
  { numero: '701200', libelle: 'Ventes — Fromage' },
  { numero: '701300', libelle: 'Ventes — Animaux' },
  { numero: '701400', libelle: 'Ventes — Laine, peaux' },
  { numero: '701500', libelle: 'Ventes — Viande, charcuterie' },
  { numero: '701600', libelle: 'Ventes — Œufs' },
  { numero: '706000', libelle: 'Prestations de services' },
  { numero: '706100', libelle: 'Prestations — Hébergement' },
  { numero: '706200', libelle: 'Prestations — Agritourisme' },
  { numero: '707000', libelle: 'Ventes de marchandises' },
  { numero: '707100', libelle: 'Ventes — Restauration' },
  { numero: '707200', libelle: 'Ventes — Bar' },
  { numero: '708000', libelle: 'Activités annexes' },
  { numero: '740000', libelle: 'Subventions d’exploitation' },
  { numero: '754000', libelle: 'Dons manuels' },
  { numero: '756000', libelle: 'Cotisations des adhérents' },
  { numero: '758000', libelle: 'Produits divers de gestion courante' },
  { numero: '766000', libelle: 'Gains de change' },
  { numero: '767000', libelle: 'Produits nets sur cessions de valeurs mobilières de placement' },
  { numero: '768000', libelle: 'Autres produits financiers' },
  { numero: '108000', libelle: 'Compte de l’exploitant (apports)' },
  { numero: '771000', libelle: 'Produits exceptionnels de gestion' },
  { numero: '791000', libelle: 'Transferts de charges d’exploitation' },
];

/** Types d'aliment vendus au conditionnement (matelas/ballot) plutôt qu'au kg direct. */
export const TYPES_ALIMENT_CONDITIONNES: ValeurDe<typeof TYPE_ALIMENT>[] = [
  TYPE_ALIMENT.LUZERNE,
  TYPE_ALIMENT.FOIN,
  TYPE_ALIMENT.PAILLE,
];

/** Poids approximatif (kg) d'une unité de conditionnement (luzerne, foin, paille). */
export const POIDS_UNITE_CONDITIONNEMENT: Record<ValeurDe<typeof UNITE_CONDITIONNEMENT>, number> = {
  [UNITE_CONDITIONNEMENT.MATELAS]: 17,
  [UNITE_CONDITIONNEMENT.BOTTE]: 30,
  [UNITE_CONDITIONNEMENT.BALLOT]: 360,
};

/**
 * Taux d'imposition PRÉ-REMPLI À TITRE INDICATIF (part du montant incluse dans les recettes brutes
 * agricoles) pour chaque type d'aide répertorié hors "autre" — 100 % par défaut, sur l'hypothèse que ce
 * sont des aides d'exploitation classiques. Ce n'est qu'un point de départ dans le formulaire : le champ
 * reste modifiable pour chaque aide, y compris les types répertoriés, car le traitement réel peut
 * différer d'une aide à l'autre (ex : une aide à l'investissement peut être étalée sur plusieurs années,
 * CGI art. 42 septies) — vérifiez chaque taux avec votre comptable/CGA plutôt que de vous fier à cette
 * valeur par défaut.
 *
 * Ce taux ne concerne QUE l'inclusion dans les recettes brutes, pas le taux d'impôt réel : s'appliquent
 * ensuite, sur le total de vos recettes, l'abattement forfaitaire pour charges du micro-BA (son taux
 * change selon les années fiscales) puis le barème progressif de l'impôt sur le revenu de votre foyer.
 * Ni l'un ni l'autre n'est calculé par l'app — voir la notice de l'écran Impôts.
 */
export const TAUX_IMPOSITION_TYPE_AIDE: Record<
  Exclude<ValeurDe<typeof TYPE_AIDE>, typeof TYPE_AIDE.AUTRE>,
  number
> = {
  [TYPE_AIDE.PAIEMENT_BASE]: 100,
  [TYPE_AIDE.PAIEMENT_REDISTRIBUTIF]: 100,
  [TYPE_AIDE.ECOREGIME]: 100,
  [TYPE_AIDE.PETITS_RUMINANTS]: 100,
  [TYPE_AIDE.ICHN]: 100,
};

const COMPTE_EMBALLAGES: CompteComptable = { numero: '602600', libelle: 'Emballages' };
const COMPTE_BAR_RESTAURANT: CompteComptable = {
  numero: '607100',
  libelle: 'Achats de marchandises — Restauration et bar',
};

/**
 * Le compte du plan comptable (celui déjà utilisé pour les ventes et les achats) de chaque section de l'inventaire d'une
 * exploitation : celui où s'enregistre ce qu'elle contient. Le matériel n'a pas de compte d'immobilisation dans ce plan : il
 * suit la catégorie « Matériel et équipement » des dépenses.
 */
export const COMPTE_PAR_SECTION_INVENTAIRE: Record<ValeurDe<typeof SECTION_STOCK>, CompteComptable> = {
  [SECTION_STOCK.FROMAGES]: COMPTE_PAR_RECETTE[CATEGORIE_RECETTE.FROMAGE],
  [SECTION_STOCK.LAIT]: COMPTE_PAR_RECETTE[CATEGORIE_RECETTE.LAIT],
  [SECTION_STOCK.OEUFS]: COMPTE_PAR_RECETTE[CATEGORIE_RECETTE.OEUFS],
  [SECTION_STOCK.VIANDE]: COMPTE_PAR_RECETTE[CATEGORIE_RECETTE.BOUCHERIE_CHARCUTERIE],
  // Un plat préparé se vend comme la charcuterie : même compte.
  [SECTION_STOCK.PLATS]: COMPTE_PAR_RECETTE[CATEGORIE_RECETTE.BOUCHERIE_CHARCUTERIE],
  [SECTION_STOCK.SAVONS]: COMPTE_PAR_RECETTE[CATEGORIE_RECETTE.SAVONS],
  [SECTION_STOCK.ANIMAUX]: COMPTE_PAR_RECETTE[CATEGORIE_RECETTE.ANIMAL_SUR_PIED],
  [SECTION_STOCK.ALIMENTS]: COMPTE_PAR_DEPENSE[CATEGORIE_DEPENSE.ALIMENTATION],
  [SECTION_STOCK.EMBALLAGES]: COMPTE_EMBALLAGES,
  [SECTION_STOCK.BOUCLES]: COMPTE_BOUCLES,
  [SECTION_STOCK.ENTRETIEN]: COMPTE_PAR_DEPENSE[CATEGORIE_DEPENSE.MATERIEL],
  [SECTION_STOCK.EQUIPEMENT_CONSOMMABLE]: COMPTE_PAR_DEPENSE[CATEGORIE_DEPENSE.MATERIEL],
  [SECTION_STOCK.EQUIPEMENT]: COMPTE_PAR_DEPENSE[CATEGORIE_DEPENSE.MATERIEL],
  [SECTION_STOCK.MATERIEL]: COMPTE_PAR_DEPENSE[CATEGORIE_DEPENSE.MATERIEL],
};

/** Le compte de chaque section de l'inventaire d'un gîte (les boissons et la nourriture du bar, le matériel…). */
export const COMPTE_PAR_SECTION_INVENTAIRE_GITE: Record<
  ValeurDe<typeof ONGLET_STOCK_BAR>,
  CompteComptable
> = {
  [ONGLET_STOCK_BAR.CONSOMMABLES]: COMPTE_BAR_RESTAURANT,
  [ONGLET_STOCK_BAR.CONDITIONNEMENT]: COMPTE_EMBALLAGES,
  [ONGLET_STOCK_BAR.ENTRETIEN]: COMPTE_PAR_DEPENSE[CATEGORIE_DEPENSE.MATERIEL],
  [ONGLET_STOCK_BAR.MATERIEL]: COMPTE_PAR_DEPENSE[CATEGORIE_DEPENSE.MATERIEL],
};
