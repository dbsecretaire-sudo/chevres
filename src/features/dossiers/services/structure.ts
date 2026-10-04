import type { Client } from '@/features/clients/types';
import { enregistrerClient } from '@/features/clients/repository';
import { creerSousDossiers } from '@/features/dossiers/repository';
import type { InfosEntreprise } from '@/features/settings/settings';
import { TEXTES } from '@/shared/textes';

/** La structure type des dossiers : celle que l'entreprise a définie, ou celle par défaut. */
export const structureTypeDe = (infos: InfosEntreprise | undefined): string[] =>
  infos?.structureDossiers && infos.structureDossiers.length > 0
    ? infos.structureDossiers
    : [...TEXTES.dossiers.structureParDefaut];

/**
 * Crée dans le dossier d'un client les sous-dossiers de la structure type, une seule fois (à la première ouverture).
 * Un client est le même qu'il vienne de la liste des clients ou de l'explorateur : seul son dossier se crée ici.
 */
export async function assurerStructureClient(client: Client, structure: string[]): Promise<void> {
  if (client.structureInitialisee) return;
  await creerSousDossiers(client.id, structure);
  await enregistrerClient({ ...client, structureInitialisee: true });
}
