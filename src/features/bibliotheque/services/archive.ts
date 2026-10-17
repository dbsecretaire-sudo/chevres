import { ajouterDocument } from '@/features/bibliotheque/repository';
import { piecesDisponibles, rangerFichier } from '@/features/fichiers/services/pieces';
import { MIME_FICHIER } from '@/shared/constants/fichiers';
import { generateId } from '@/shared/utils/id';

/**
 * Garde une copie d'un document qui vient d'être généré dans la bibliothèque (un historique de tous les PDF). Silencieux : si la copie échoue,
 * le document s'envoie quand même.
 */
export async function archiverDocument(uri: string, nomFichier: string, titre: string): Promise<void> {
  if (!piecesDisponibles()) return;
  try {
    const piece = await rangerFichier({ uri, nom: nomFichier, mime: MIME_FICHIER.PDF });
    await ajouterDocument({ id: generateId(), titre, nomFichier, genereLe: new Date().toISOString(), piece });
  } catch {
    // La bibliothèque est un plus : on ne gêne pas l'envoi du document.
  }
}
