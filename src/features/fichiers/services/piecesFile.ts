import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PieceJointe } from '@/features/fichiers/types';

/** Les fichiers joints qui attendent d'être envoyés au serveur de la ferme (leur fiche suffit : le contenu est dans l'appareil). */
export const CLE_PIECES_A_ENVOYER = 'troupeau:v1:sync-pieces-a-envoyer';

/** La taille maximale d'un fichier joint synchronisé : 5 Mo. Au-delà, le fichier reste sur l'appareil seulement. */
export const TAILLE_MAX_PIECE = 5 * 1024 * 1024;

let verrou: Promise<unknown> = Promise.resolve();

/** Les écritures de la file se font une à une : deux ajouts en même temps ne doivent pas se perdre. */
function enSerie<T>(travail: () => Promise<T>): Promise<T> {
  const suite = verrou.then(travail, travail);
  verrou = suite.catch(() => undefined);
  return suite;
}

export async function lirePiecesAEnvoyer(): Promise<PieceJointe[]> {
  try {
    const brut = await AsyncStorage.getItem(CLE_PIECES_A_ENVOYER);
    return brut ? (JSON.parse(brut) as PieceJointe[]) : [];
  } catch {
    return [];
  }
}

/** Ajoute une pièce à la file (une seule fois : une pièce déjà en file n'y revient pas). */
export function ajouterPieceAEnvoyer(piece: PieceJointe): Promise<void> {
  return enSerie(async () => {
    const file = await lirePiecesAEnvoyer();
    if (file.some((p) => p.id === piece.id)) return;
    await AsyncStorage.setItem(CLE_PIECES_A_ENVOYER, JSON.stringify([...file, piece]));
  });
}

/** Les fichiers joints référencés par une valeur (une fiche, un lot de fiches) : les objets qui ont la forme d'une fiche de pièce. */
export function piecesDe(valeur: unknown): PieceJointe[] {
  const trouvees: PieceJointe[] = [];
  const parcourir = (noeud: unknown): void => {
    if (Array.isArray(noeud)) {
      noeud.forEach(parcourir);
      return;
    }
    if (!noeud || typeof noeud !== 'object') return;
    const objet = noeud as Record<string, unknown>;
    if (
      typeof objet.id === 'string' &&
      typeof objet.nom === 'string' &&
      typeof objet.extension === 'string' &&
      typeof objet.mime === 'string' &&
      typeof objet.ajoutLe === 'string'
    ) {
      trouvees.push({ id: objet.id, nom: objet.nom, extension: objet.extension, mime: objet.mime, ajoutLe: objet.ajoutLe });
      return;
    }
    Object.values(objet).forEach(parcourir);
  };
  parcourir(valeur);
  return trouvees;
}

/** Retire une pièce de la file (envoyée, ou introuvable sur l'appareil). */
export function retirerPieceAEnvoyer(id: string): Promise<void> {
  return enSerie(async () => {
    const file = await lirePiecesAEnvoyer();
    await AsyncStorage.setItem(CLE_PIECES_A_ENVOYER, JSON.stringify(file.filter((p) => p.id !== id)));
  });
}
