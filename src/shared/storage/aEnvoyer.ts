import AsyncStorage from '@react-native-async-storage/async-storage';
import { modeSimpleActif } from '@/shared/hooks/useModeSimple';

/**
 * Combien de saisies du mode normal n'ont pas encore été envoyées sur Drive : le bouton « Envoyer » l'affiche (« 3 à envoyer »). Chaque saisie simple qui aboutit en ajoute une
 * (une naissance, une mort, une vente, une fabrication, du lait, une visite…) ; une saisie annulée en retire une ; un envoi réussi remet le compte à zéro. Le compte est celui de
 * l'appareil, tous établissements confondus (l'envoi les pousse tous). Seul le mode normal compte : les saisies du mode avancé ne passent pas par ici.
 */
const CLE = 'troupeau:v1:a-envoyer';

type Ecouteur = (nombre: number) => void;
const ecouteurs = new Set<Ecouteur>();

/** Prévient chaque écouteur du nouveau compte. */
const prevenir = (nombre: number) => {
  for (const ecouteur of [...ecouteurs]) ecouteur(nombre);
};

export async function lireAEnvoyer(): Promise<number> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    const nombre = brut ? Number(brut) : 0;
    return Number.isFinite(nombre) && nombre > 0 ? Math.round(nombre) : 0;
  } catch {
    return 0;
  }
}

async function ecrire(nombre: number): Promise<void> {
  const compte = Math.max(0, Math.round(nombre));
  try {
    await AsyncStorage.setItem(CLE, String(compte));
  } catch {
    // Le compte n'est qu'un repère : il ne doit jamais faire échouer une saisie.
  }
  prevenir(compte);
}

/** Ajoute (ou, en négatif, retire) des saisies du mode normal au compte ; sans effet hors du mode normal. */
export async function noterAEnvoyer(nombre = 1): Promise<void> {
  if (!modeSimpleActif() || nombre === 0) return;
  await ecrire((await lireAEnvoyer()) + nombre);
}

/** Un envoi réussi : plus rien n'est à envoyer. */
export const remettreAEnvoyer = (): Promise<void> => ecrire(0);

/** Suit le compte : appelé à chaque changement. Rend la fonction qui se désabonne. */
export function surAEnvoyer(ecouteur: Ecouteur): () => void {
  ecouteurs.add(ecouteur);
  return () => {
    ecouteurs.delete(ecouteur);
  };
}
