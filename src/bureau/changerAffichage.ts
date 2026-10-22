import AsyncStorage from '@react-native-async-storage/async-storage';
import { CLE_AFFICHAGE, type ModeAffichage } from '@/shared/utils/affichage';

/** Le temps laissé à l'enregistrement du choix avant de recharger la fenêtre (ms). */
const DELAI_AVANT_RECHARGEMENT = 300;

/**
 * Change l'affichage de la version Windows (bureau, mobile, sobre) : le choix est gardé dans les données de l'ordinateur, puis la fenêtre se recharge
 * pour le prendre en compte (les couleurs, les menus et les colonnes sont décidés au démarrage).
 */
export async function changerAffichage(mode: ModeAffichage): Promise<void> {
  await AsyncStorage.setItem(CLE_AFFICHAGE, mode);
  setTimeout(() => window.location.reload(), DELAI_AVANT_RECHARGEMENT);
}
