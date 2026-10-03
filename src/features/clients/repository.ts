import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/shared/utils/id';
import { cleStockage } from '@/features/etablissements/repository';
import type { Client } from '@/features/clients/types';
import { CLE_STOCKAGE } from '@/shared/constants/stockage';

const cle = () => cleStockage(CLE_STOCKAGE.CLIENTS);

async function lireTous(): Promise<Client[]> {
  const raw = await AsyncStorage.getItem(cle());
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
}

/** Remplace intégralement la liste locale — utilisé lors d'un tirage depuis Google Drive. */
export async function remplacerTousClients(items: Client[]): Promise<void> {
  await ecrireTous(items);
}
