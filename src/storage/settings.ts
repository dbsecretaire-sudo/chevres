import AsyncStorage from '@react-native-async-storage/async-storage';
import { currentYear } from '@/utils/dates';

const KEY = 'troupeau:v1:settings';

/** Coordonnées administratives de l'exploitation, affichées sur les rapports PDF. */
export interface InfosExploitation {
  numeroExploitation?: string;
  siret?: string;
  numeroCheptel?: string;
  indicatifMarquage?: string;
  nomExploitant?: string;
  adresseExploitant?: string;
  numeroPacage?: string;
  numeroDetenteur?: string;
}

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
  const raw = await AsyncStorage.getItem(KEY);
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
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
