import type { CategorieDepense, CategorieRecette, TypeAide, TypeAliment, TypeCarburant } from '@/types/models';

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

export const LABEL_CATEGORIE_DEPENSE: Record<CategorieDepense, string> = {
  alimentation: 'Alimentation',
  carburant: 'Carburant',
  reparation: 'Réparation',
  veterinaire: 'Vétérinaire',
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

export const LABEL_TYPE_CARBURANT: Record<TypeCarburant, string> = {
  gazoil: 'Gazole',
  essence: 'Essence',
  gnr: 'GNR (Gazole Non Routier)',
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
