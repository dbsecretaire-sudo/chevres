import AsyncStorage from '@react-native-async-storage/async-storage';
import { currentYear } from '@/shared/utils/dates';
import { cleStockage } from '@/features/etablissements/repository';
import { CLE_STOCKAGE } from '@/shared/constants/stockage';
import type { EspeceAnimale } from '@/shared/dictionnaire/animaux';

const cle = () => cleStockage(CLE_STOCKAGE.SETTINGS);

/** Ce qui identifie le cheptel d'une espèce : son n° de cheptel et l'indicatif qui précède ses numéros de boucle. */
export interface IdentificationCheptel {
  numeroCheptel?: string;
  indicatifMarquage?: string;
}

/** Coordonnées administratives de l'exploitation, affichées sur les rapports PDF. */
export interface InfosExploitation {
  numeroExploitation?: string;
  siret?: string;
  nomExploitant?: string;
  adresseExploitant?: string;
  numeroPacage?: string;
  numeroDetenteur?: string;
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
  anneeActive: number;
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
