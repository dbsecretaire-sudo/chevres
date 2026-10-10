import AsyncStorage from '@react-native-async-storage/async-storage';
import { currentYear } from '@/shared/utils/dates';
import { cleStockage } from '@/features/etablissements/repository';
import { CLE_STOCKAGE } from '@/shared/constants/stockage';
import type { EspeceAnimale } from '@/shared/dictionnaire/animaux';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import type {
  NATURE_URSSAF,
  REGIME_FISCAL,
  REGIME_TVA,
  STATUT_JURIDIQUE,
} from '@/shared/constants/entreprise';

const cle = () => cleStockage(CLE_STOCKAGE.SETTINGS);

/** Ce qui identifie le cheptel d'une espèce : son n° de cheptel et l'indicatif qui précède ses numéros de boucle. */
export interface IdentificationCheptel {
  numeroCheptel?: string;
  indicatifMarquage?: string;
}

/** Informations d'une entreprise (hors élevage) ; tout est modifiable : statut, régimes, TVA, taxe de séjour. */
export interface InfosEntreprise {
  nomEntreprise?: string;
  dirigeant?: string;
  adresse?: string;
  siret?: string;
  codeApe?: string;
  numeroTva?: string;
  statut?: ValeurDe<typeof STATUT_JURIDIQUE>;
  regimeFiscal?: ValeurDe<typeof REGIME_FISCAL>;
  /** Vrai si l'entreprise facture avec TVA ; absent ou faux : sans TVA (franchise en base). */
  tvaApplicable?: boolean;
  regimeTva?: ValeurDe<typeof REGIME_TVA>;
  /** Le taux de cotisations URSSAF (%) de chaque nature de recette ; absent : le taux indicatif. */
  tauxUrssaf?: Partial<Record<ValeurDe<typeof NATURE_URSSAF>, number>>;
  /** Noms des sous-dossiers créés dans le dossier de chaque nouveau client (structure type, modifiable). */
  structureDossiers?: string[];
  /** Prix d'une chambre par nuit, en euros (gîte). */
  tarifNuit?: number;
  /** Prix d'un repas, en euros (gîte). */
  tarifRepas?: number;
  /** Le compte du plan comptable (classe 7) des recettes d'hébergement du gîte ; absent : celui d'office. */
  giteCompte?: string;
  /** Le taux de TVA (%) de l'hébergement du gîte ; absent : celui d'office. */
  giteTauxTva?: number;
  /** Vrai si l'établissement suit la taxe de séjour (gîte, hébergement). */
  taxeSejour?: boolean;
  /** Montant de la taxe de séjour ajouté à chaque réservation, en euros (montant fixe, quel que soit le séjour). */
  montantTaxeSejour?: number;
  /** Ancien format : montant par personne et par nuit, repris comme montant fixe (voir montantTaxeSejourDe). */
  taxeSejourParNuit?: number;
}

/** Le montant de la taxe de séjour d'une entreprise (celui d'avant le montant fixe est repris tel quel). */
export const montantTaxeSejourDe = (infos?: InfosEntreprise): number | undefined =>
  infos?.montantTaxeSejour ?? infos?.taxeSejourParNuit;

/** Coordonnées administratives de l'exploitation, affichées sur les rapports PDF. */
export interface InfosExploitation {
  /** Un titre propre à l'utilisateur, imprimé en tête de chaque PDF (nom commercial, adresse, mention…). */
  titrePdf?: string;
  /**
   * Vrai : le mode avancé. Absent ou faux, le mode simple cache ce qui demande des notions de comptabilité (comptes du plan
   * comptable, taux de TVA et nature URSSAF dans une nouvelle écriture) : les valeurs d'office s'appliquent. Propre à chaque
   * établissement ; sauvegardé avec ses informations.
   */
  modeAvance?: boolean;
  /** Les rappels de déclaration que l'utilisateur a désactivés (voir GENRE_RAPPEL). */
  rappelsDesactives?: string[];
  /** Les rappels déjà validés (« rsa:2026-T3 », « urssaf:2026-09 »). */
  rappelsValides?: string[];
  numeroExploitation?: string;
  siret?: string;
  nomExploitant?: string;
  adresseExploitant?: string;
  numeroPacage?: string;
  numeroDetenteur?: string;
  /** Informations de l'entreprise, pour un établissement qui n'est pas un élevage. */
  entreprise?: InfosEntreprise;
  /** Identification propre à chaque espèce élevée (n° de cheptel et indicatif de marquage diffèrent d'une espèce à l'autre). */
  cheptels?: Partial<Record<EspeceAnimale, IdentificationCheptel>>;
  /** Anciens champs uniques (avant la séparation par espèce) : ils valent pour toute espèce sans identification propre. */
  numeroCheptel?: string;
  indicatifMarquage?: string;
}

/** Identification du cheptel d'une espèce : la sienne si elle est renseignée, sinon l'ancien champ unique. */
export function identificationCheptel(
  infos: InfosExploitation | undefined,
  espece: EspeceAnimale,
): IdentificationCheptel {
  const propre = infos?.cheptels?.[espece];
  if (propre) return propre;
  return { numeroCheptel: infos?.numeroCheptel, indicatifMarquage: infos?.indicatifMarquage };
}

/** L'indicatif de marquage à faire précéder les numéros de boucle d'une espèce (rien s'il n'est pas renseigné). */
export const indicatifMarquagePar =
  (infos: InfosExploitation | undefined) =>
  (espece: EspeceAnimale): string | undefined =>
    identificationCheptel(infos, espece).indicatifMarquage?.trim() || undefined;

export interface AppSettings {
  /** L'année active ; quand « Tout » est choisi (toutesAnnees), c'est l'année en cours (partout où une année précise est nécessaire). */
  anneeActive: number;
  /** Vrai quand « Tout » est choisi : les listes regroupent toutes les années. */
  toutesAnnees?: boolean;
  driveFolderId?: string;
  driveFolderName?: string;
  driveAccountEmail?: string;
  derniereSynchronisation?: string; // ISO datetime
  exploitation?: InfosExploitation;
}

const DEFAULTS: AppSettings = {
  anneeActive: currentYear(),
};

export async function getSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(cle());
  if (!raw) return { ...DEFAULTS };
  try {
    return { ...DEFAULTS, ...(JSON.parse(raw) as AppSettings) };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await AsyncStorage.setItem(cle(), JSON.stringify(next));
  return next;
}
