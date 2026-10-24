import type { Client } from '@/features/clients/types';
import type { SousDossier } from '@/features/dossiers/types';
import { nomComplet } from '@/shared/utils/personne';
import { TEXTES } from '@/shared/textes';

/** Les dossiers directement sous un dossier (ou, sans identifiant, directement sous le dossier du client). */
export const dossiersEnfants = (
  sousDossiers: SousDossier[],
  clientId: string,
  parentId?: string,
): SousDossier[] => sousDossiers.filter((d) => d.clientId === clientId && d.parentId === parentId);

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
