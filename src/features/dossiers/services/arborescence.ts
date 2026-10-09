import type { Client } from '@/features/clients/types';
import type { Element, SousDossier } from '@/features/dossiers/types';
import { statutEffectif } from '@/features/dossiers/services/avancement';
import { STATUT_ELEMENT } from '@/shared/constants/dossiers';
import { nomComplet } from '@/shared/utils/personne';
import { TEXTES } from '@/shared/textes';

/** Les identifiants d'un dossier et de tous ceux qu'il contient, à n'importe quelle profondeur. */
export function dossiersDuSousArbre(sousDossiers: SousDossier[], racineId: string): Set<string> {
  const ids = new Set<string>([racineId]);
  // Un passage par niveau : on ajoute les enfants des dossiers déjà trouvés jusqu'à ce qu'il n'y en ait plus.
  let ajoute = true;
  while (ajoute) {
    ajoute = false;
    for (const dossier of sousDossiers) {
      if (dossier.parentId && ids.has(dossier.parentId) && !ids.has(dossier.id)) {
        ids.add(dossier.id);
        ajoute = true;
      }
    }
  }
  return ids;
}

/** Les dossiers directement sous un dossier (ou, sans identifiant, directement sous le dossier du client). */
export const dossiersEnfants = (
  sousDossiers: SousDossier[],
  clientId: string,
  parentId?: string,
): SousDossier[] => sousDossiers.filter((d) => d.clientId === clientId && d.parentId === parentId);

/** Ce que contient un dossier, ses sous-dossiers compris : nombre de contenus, de contenus à faire et de dossiers. */
export function resumeDossier(
  sousDossiers: SousDossier[],
  elements: Element[],
  dossierId: string,
): { contenus: number; aFaire: number; dossiers: number } {
  const ids = dossiersDuSousArbre(sousDossiers, dossierId);
  const siens = elements.filter((e) => ids.has(e.dossierId));
  return {
    contenus: siens.length,
    aFaire: siens.filter((e) => statutEffectif(e) === STATUT_ELEMENT.A_FAIRE).length,
    dossiers: ids.size - 1,
  };
}

/** Le chemin d'un dossier : « Client › Dossier › Sous-dossier ». */
export function cheminDuDossier(dossierId: string, sousDossiers: SousDossier[], clients: Client[]): string {
  const noms: string[] = [];
  let courant = sousDossiers.find((d) => d.id === dossierId);
  const client = courant ? clients.find((c) => c.id === courant!.clientId) : undefined;
  while (courant) {
    noms.unshift(courant.nom);
    courant = courant.parentId ? sousDossiers.find((d) => d.id === courant!.parentId) : undefined;
  }
  if (client) noms.unshift(nomComplet(client));
  return noms.join(TEXTES.dossiers.explorateur.separateurChemin);
}

/** Le chemin d'un dossier dans le dossier de son client, sans le nom du client : « Santé › Fertilité ». */
export function cheminDansLeClient(dossierId: string, sousDossiers: SousDossier[]): string {
  const noms: string[] = [];
  let courant = sousDossiers.find((d) => d.id === dossierId);
  while (courant) {
    noms.unshift(courant.nom);
    courant = courant.parentId ? sousDossiers.find((d) => d.id === courant!.parentId) : undefined;
  }
  return noms.join(TEXTES.dossiers.explorateur.separateurChemin);
}
