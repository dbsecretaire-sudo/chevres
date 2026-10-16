import AsyncStorage from '@react-native-async-storage/async-storage';
import { cleStockage } from '@/features/etablissements/repository';
import { CLE_STOCKAGE } from '@/shared/constants/stockage';
import { todayISO } from '@/shared/utils/dates';

/** Au-delà de ce nombre de jours sans sauvegarde, l'accueil le rappelle. */
export const DELAI_RAPPEL_SAUVEGARDE_JOURS = 14;

/** Ce qu'on sait des sauvegardes de l'établissement : la dernière (export ou Drive) et le jour où le suivi a commencé. */
export interface SuiviSauvegarde {
  derniere?: string;
  depuis: string;
}

const cle = () => cleStockage(CLE_STOCKAGE.DERNIERE_SAUVEGARDE);

/** Le suivi des sauvegardes ; le premier appel fixe le jour de départ (on ne gronde pas à la première ouverture). */
export async function lireSuiviSauvegarde(aujourdhui: string = todayISO()): Promise<SuiviSauvegarde> {
  const brut = await AsyncStorage.getItem(cle());
  if (brut) {
    try {
      const lu = JSON.parse(brut) as Partial<SuiviSauvegarde>;
      if (typeof lu.depuis === 'string') {
        return { depuis: lu.depuis, derniere: typeof lu.derniere === 'string' ? lu.derniere : undefined };
      }
    } catch {
      // Un suivi illisible repart de zéro.
    }
  }
  const neuf: SuiviSauvegarde = { depuis: aujourdhui };
  await AsyncStorage.setItem(cle(), JSON.stringify(neuf));
  return neuf;
}

/** Note qu'une sauvegarde vient d'être faite (export en fichier ou envoi sur Google Drive). */
export async function noterSauvegarde(aujourdhui: string = todayISO()): Promise<void> {
  const suivi = await lireSuiviSauvegarde(aujourdhui);
  await AsyncStorage.setItem(cle(), JSON.stringify({ ...suivi, derniere: aujourdhui }));
}

/** Le nombre de jours entre deux dates ISO (AAAA-MM-JJ). */
export const joursEntre = (debut: string, fin: string): number =>
  Math.round((Date.parse(`${fin}T00:00:00Z`) - Date.parse(`${debut}T00:00:00Z`)) / 86_400_000);

/**
 * Le nombre de jours depuis la dernière sauvegarde (ou depuis le début du suivi, faute de sauvegarde) quand il dépasse le délai ;
 * rien tant que la sauvegarde est récente. `jamais` : aucune sauvegarde n'a été faite depuis le début du suivi.
 */
export function retardDeSauvegarde(
  suivi: SuiviSauvegarde,
  aujourdhui: string,
  delai: number = DELAI_RAPPEL_SAUVEGARDE_JOURS,
): { jours: number; jamais: boolean } | undefined {
  const jours = joursEntre(suivi.derniere ?? suivi.depuis, aujourdhui);
  return jours > delai ? { jours, jamais: !suivi.derniere } : undefined;
}
