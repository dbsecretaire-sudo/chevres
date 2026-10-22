import { choisirFichiers, rangerFichier, supprimerPiece, type FichierChoisi } from '@/features/fichiers/services/pieces';
import { rafraichirImages } from '@/features/stock/hooks/useImageDeLArticle';
import { lireArchiveStock, remplacerArchiveStock } from '@/features/stock/repository';

/** Ce que l'utilisateur a décidé pour l'image d'une carte : une image de son appareil, ou le retour au dessin d'origine. */
export type ChoixImage = { fichier: FichierChoisi } | { retirer: true };

/** Ouvre le sélecteur de l'appareil pour une image ; rien si on annule. */
export async function choisirUneImage(): Promise<FichierChoisi | null> {
  return (await choisirFichiers(['image/*']))[0] ?? null;
}

/** Remplace l'image d'une carte (l'ancienne est effacée de l'appareil), ou la retire pour revenir au dessin d'origine. */
export async function definirImageArticle(cle: string, choix: ChoixImage): Promise<void> {
  const archive = await lireArchiveStock();
  const ancienne = archive.images?.[cle];
  const autres = { ...archive.images };
  delete autres[cle];
  const images = 'fichier' in choix ? { ...autres, [cle]: await rangerFichier(choix.fichier) } : autres;
  await remplacerArchiveStock({ ...archive, images });
  if (ancienne) await supprimerPiece(ancienne);
  await rafraichirImages();
}
