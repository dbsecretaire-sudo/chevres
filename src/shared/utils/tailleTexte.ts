import AsyncStorage from '@react-native-async-storage/async-storage';
import { afficheSobre } from '@/shared/utils/affichage';
import { estBureau } from '@/shared/utils/plateforme';

/** La clé, dans les données de l'ordinateur, de la taille du texte choisie (elle n'est pas dans les sauvegardes : chaque ordinateur a la sienne). */
export const CLE_TAILLE_TEXTE = 'bureau:taille';

/** Le poste de comptabilité (affichage sobre) est agrandi de 15 % d'office : « 100 % » dans le réglage est ce zoom, pas la taille brute. bureau/preload.js applique le même. */
export const BASE_SOBRE = 1.15;

/** Les tailles proposées (1 = normale) : tout grandit ou rapetisse ensemble — texte, boutons, tableaux. Au-delà la fenêtre n'aurait plus la place de son menu. */
export const TAILLES_DU_TEXTE = [0.85, 1, 1.1, 1.2, 1.3] as const;

/** La taille proposée la plus proche d'une valeur lue (une valeur absente ou fausse : la taille normale). */
export function tailleValide(valeur: unknown): number {
  const n = typeof valeur === 'string' ? Number(valeur) : typeof valeur === 'number' ? valeur : NaN;
  if (!Number.isFinite(n)) return 1;
  return TAILLES_DU_TEXTE.reduce((proche, t) => (Math.abs(t - n) < Math.abs(proche - n) ? t : proche), 1 as number);
}

/** La taille voisine dans la liste : `sens` 1 pour agrandir, -1 pour réduire ; la dernière taille reste où elle est. */
export function tailleVoisine(courante: number, sens: 1 | -1): number {
  const i = TAILLES_DU_TEXTE.findIndex((t) => t === tailleValide(courante));
  const j = Math.min(TAILLES_DU_TEXTE.length - 1, Math.max(0, i + sens));
  return TAILLES_DU_TEXTE[j];
}

/** La taille choisie, lue dans les données de l'ordinateur (ou du navigateur pour l'essai). */
export function lireTailleTexte(): number {
  try {
    const brut = estBureau() ? window.bureau?.donnees[CLE_TAILLE_TEXTE] : typeof localStorage === 'undefined' ? undefined : localStorage.getItem(CLE_TAILLE_TEXTE);
    return tailleValide(brut);
  } catch {
    return 1;
  }
}

/** Pose la taille sur la page : le zoom de la fenêtre sous Windows, le zoom de la page dans un navigateur. */
export function appliquerTailleTexte(taille: number): void {
  if (typeof document === 'undefined') return;
  const zoom = taille * (afficheSobre() ? BASE_SOBRE : 1);
  if (estBureau() && window.bureau?.zoom) window.bureau.zoom(zoom);
  else document.documentElement.style.setProperty('zoom', String(zoom));
}

/** Change la taille du texte (partout à la fois) et la garde pour la prochaine ouverture. */
export async function changerTailleTexte(taille: number): Promise<void> {
  appliquerTailleTexte(taille);
  await AsyncStorage.setItem(CLE_TAILLE_TEXTE, String(taille));
}
