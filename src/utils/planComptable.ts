import type { CategorieDepense, CategorieRecette, TypeAide, TypeAliment, TypeCarburant, UniteConditionnement } from '@/types/models';

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
export const COMPTE_PAR_DEPENSE: Record<CategorieDepense, CompteComptable> = {
  alimentation: { numero: '601100', libelle: 'Achats stockés — Aliments du bétail' },
  carburant: { numero: '606110', libelle: 'Achats non stockés — Carburants' },
  reparation: { numero: '615400', libelle: 'Entretien et réparations — Matériel' },
  veterinaire: { numero: '622600', libelle: 'Honoraires vétérinaires' },
  production: { numero: '601500', libelle: 'Achats stockés — Fournitures liées à la production (sel, emballages...)' },
  impots: { numero: '635000', libelle: 'Autres impôts, taxes et versements assimilés' },
  autre: { numero: '606800', libelle: 'Autres matières et fournitures' },
};

export const COMPTE_PAR_RECETTE: Record<CategorieRecette, CompteComptable> = {
  lait: { numero: '701100', libelle: 'Ventes de produits finis — Lait' },
  fromage: { numero: '701200', libelle: 'Ventes de produits finis — Fromage' },
  cabris: { numero: '701300', libelle: 'Ventes de produits finis — Animaux' },
  aide: { numero: '740000', libelle: 'Subventions d’exploitation' },
  autre: { numero: '708000', libelle: 'Produits des activités annexes' },
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
  { numero: '602600', libelle: 'Emballages' },
  { numero: '604000', libelle: 'Études et prestations de services' },
  { numero: '606100', libelle: 'Eau, électricité' },
  { numero: '606110', libelle: 'Carburants' },
  { numero: '606300', libelle: 'Fournitures d’entretien, petit équipement' },
  { numero: '606400', libelle: 'Fournitures de bureau' },
  { numero: '606800', libelle: 'Autres matières et fournitures' },
  { numero: '611000', libelle: 'Sous-traitance générale' },
  { numero: '613200', libelle: 'Location de locaux' },
  { numero: '613500', libelle: 'Location de matériel' },
  { numero: '615400', libelle: 'Entretien et réparations — Matériel' },
  { numero: '615500', libelle: 'Entretien et réparations — Bâtiments' },
  { numero: '616100', libelle: 'Assurance — Multirisques' },
  { numero: '616300', libelle: 'Assurance — Responsabilité civile' },
  { numero: '618300', libelle: 'Documentation technique' },
  { numero: '621000', libelle: 'Personnel extérieur, main-d’œuvre' },
  { numero: '622600', libelle: 'Honoraires vétérinaires' },
  { numero: '622700', libelle: 'Frais d’actes et de contentieux' },
  { numero: '623000', libelle: 'Publicité, publications' },
  { numero: '625100', libelle: 'Voyages et déplacements' },
  { numero: '626000', libelle: 'Frais postaux et télécommunications' },
  { numero: '627000', libelle: 'Services bancaires' },
  { numero: '635000', libelle: 'Impôts, taxes et versements assimilés' },
  { numero: '645100', libelle: 'Cotisations MSA' },
  { numero: '661100', libelle: 'Intérêts d’emprunts' },
];

export const COMPTES_PCG_RECETTE: CompteComptable[] = [
  { numero: '701100', libelle: 'Ventes — Lait' },
  { numero: '701200', libelle: 'Ventes — Fromage' },
  { numero: '701300', libelle: 'Ventes — Animaux' },
  { numero: '701400', libelle: 'Ventes — Laine, peaux' },
  { numero: '706000', libelle: 'Prestations de services' },
  { numero: '708000', libelle: 'Activités annexes' },
  { numero: '740000', libelle: 'Subventions d’exploitation' },
  { numero: '758000', libelle: 'Produits divers de gestion courante' },
  { numero: '771000', libelle: 'Produits exceptionnels de gestion' },
  { numero: '791000', libelle: 'Transferts de charges d’exploitation' },
];

export const LABEL_CATEGORIE_DEPENSE: Record<CategorieDepense, string> = {
  alimentation: 'Alimentation',
  carburant: 'Carburant',
  reparation: 'Réparation',
  veterinaire: 'Vétérinaire',
  production: 'Production',
  impots: 'Impôts & taxes',
  autre: 'Autre',
};

export const LABEL_CATEGORIE_RECETTE: Record<CategorieRecette, string> = {
  lait: 'Vente de lait',
  fromage: 'Vente de fromage',
  cabris: 'Vente de cabris',
  aide: 'Aide / subvention',
  autre: 'Autre recette',
};

export const LABEL_TYPE_ALIMENT: Record<TypeAliment, string> = {
  mais: 'Maïs',
  luzerne: 'Luzerne',
  foin: 'Foin',
  paille: 'Paille',
  autre: 'Autre',
};

/** Types d'aliment vendus au conditionnement (matelas/ballot) plutôt qu'au kg direct. */
export const TYPES_ALIMENT_CONDITIONNES: TypeAliment[] = ['luzerne', 'foin', 'paille'];

export const LABEL_UNITE_CONDITIONNEMENT: Record<UniteConditionnement, string> = {
  matela: 'Matelas',
  botte: 'Botte',
  ballot: 'Ballot',
};

/** Poids approximatif (kg) d'une unité de conditionnement (luzerne, foin, paille). */
export const POIDS_UNITE_CONDITIONNEMENT: Record<UniteConditionnement, number> = {
  matela: 17,
  botte: 30,
  ballot: 360,
};

export const LABEL_TYPE_CARBURANT: Record<TypeCarburant, string> = {
  gazoil: 'Gazole',
  essence: 'Essence',
  gnr: 'GNR (Gazole Non Routier)',
  autre: 'Autre'
};

/**
 * Catégories d'aides PAC courantes — d'après un relevé d'aides type. Le nom exact et le
 * détail (montants par dispositif) figurent sur votre relevé annuel ; ajustez "Autre" si
 * votre aide ne correspond à aucune de ces lignes.
 */
export const LABEL_TYPE_AIDE: Record<TypeAide, string> = {
  paiement_base: 'Aides découplées — Paiement de base (DPB)',
  paiement_redistributif: 'Aides découplées — Paiement redistributif',
  ecoregime: 'Aides découplées — Écorégime',
  petits_ruminants: 'Aide couplée aux petits ruminants',
  ichn: 'ICHN (indemnité compensatoire de handicaps naturels)',
  autre: 'Autre aide',
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
export const TAUX_IMPOSITION_TYPE_AIDE: Record<Exclude<TypeAide, 'autre'>, number> = {
  paiement_base: 100,
  paiement_redistributif: 100,
  ecoregime: 100,
  petits_ruminants: 100,
  ichn: 100,
};

/** Taux (0-100) réellement saisi pour une aide ; retombe sur la valeur par défaut si absent (anciens enregistrements). */
export function tauxImpositionAide(typeAide: TypeAide, taux?: number): number {
  if (taux !== undefined) return taux;
  return typeAide === 'autre' ? 0 : TAUX_IMPOSITION_TYPE_AIDE[typeAide];
}
