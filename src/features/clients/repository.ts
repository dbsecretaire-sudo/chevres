import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/shared/utils/id';
import { cleStockage, cleStockagePour } from '@/features/etablissements/repository';
import { nomComplet } from '@/shared/utils/personne';
import type { Client } from '@/features/clients/types';
import { supprimerDossiersDuClient } from '@/features/dossiers/repository';
import { CLE_STOCKAGE } from '@/shared/constants/stockage';

const cle = () => cleStockage(CLE_STOCKAGE.CLIENTS);

async function lireTous(cleLecture: string = cle()): Promise<Client[]> {
  const raw = await AsyncStorage.getItem(cleLecture);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Client[];
  } catch {
    return [];
  }
}

async function ecrireTous(items: Client[]): Promise<void> {
  await AsyncStorage.setItem(cle(), JSON.stringify(items));
}

/** Clients triés par nom, pour la liste et les sélecteurs. */
export async function listClients(): Promise<Client[]> {
  const items = await lireTous();
  return items.sort((a, b) => a.nom.localeCompare(b.nom));
}

/** Clients d'un autre établissement (lecture seule), triés par nom — pour les importer dans l'établissement actif. */
export async function listClientsDeEtablissement(etablissementId: string): Promise<Client[]> {
  const items = await lireTous(cleStockagePour(etablissementId, CLE_STOCKAGE.CLIENTS));
  return items.sort((a, b) => a.nom.localeCompare(b.nom));
}

const normaliser = (texte: string | undefined) => (texte ?? '').trim().toLowerCase();

/** Deux fiches sont le même client quand elles ont le même nom complet et le même téléphone. */
const memeClient = (a: Client, b: Client) =>
  normaliser(nomComplet(a)) === normaliser(nomComplet(b)) &&
  normaliser(a.telephone) === normaliser(b.telephone);

/**
 * Copie un client d'un autre établissement dans l'établissement actif (nouvel identifiant).
 * Renvoie undefined, sans rien copier, s'il y existe déjà le même client (même nom complet et même téléphone).
 */
export async function importerClient(source: Client): Promise<Client | undefined> {
  const existants = await lireTous();
  if (existants.some((c) => memeClient(c, source))) return undefined;
  const { id: _id, ...donnees } = source;
  return creerClient(donnees);
}

export async function getClient(id: string): Promise<Client | undefined> {
  const items = await lireTous();
  return items.find((c) => c.id === id);
}

export async function creerClient(input: Omit<Client, 'id'>): Promise<Client> {
  const client: Client = { id: generateId(), ...input };
  const items = await lireTous();
  items.push(client);
  await ecrireTous(items);
  return client;
}

export async function enregistrerClient(client: Client): Promise<void> {
  const items = await lireTous();
  const idx = items.findIndex((c) => c.id === client.id);
  if (idx >= 0) items[idx] = client;
  else items.push(client);
  await ecrireTous(items);
}

export async function supprimerClient(id: string): Promise<void> {
  const items = await lireTous();
  await ecrireTous(items.filter((c) => c.id !== id));
  // Son dossier (sous-dossiers et contenus) disparaît avec lui.
  await supprimerDossiersDuClient(id);
}

/** Remplace intégralement la liste locale — utilisé lors d'un tirage depuis Google Drive. */
export async function remplacerTousClients(items: Client[]): Promise<void> {
  await ecrireTous(items);
}
