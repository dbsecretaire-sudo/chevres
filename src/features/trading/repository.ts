import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/shared/utils/id';
import { cleStockage } from '@/features/etablissements/repository';
import type { ArchiveTrading, Trade } from '@/features/trading/types';
import { CLE_STOCKAGE } from '@/shared/constants/stockage';

const cle = () => cleStockage(CLE_STOCKAGE.TRADING);

/** Les trades de l'établissement actif (aucun s'il n'y en a pas encore). */
export async function lireArchiveTrading(): Promise<ArchiveTrading> {
  const raw = await AsyncStorage.getItem(cle());
  if (!raw) return { trades: [] };
  try {
    const archive = JSON.parse(raw) as Partial<ArchiveTrading>;
    return { trades: Array.isArray(archive.trades) ? archive.trades : [] };
  } catch {
    return { trades: [] };
  }
}

/** Remplace tout — utilisé par la restauration d'une sauvegarde et le tirage depuis Google Drive. */
export async function remplacerArchiveTrading(archive: ArchiveTrading): Promise<void> {
  await AsyncStorage.setItem(cle(), JSON.stringify(archive));
}

/** Tous les trades, du plus récent au plus ancien (par date d'entrée). */
export async function listTrades(): Promise<Trade[]> {
  const { trades } = await lireArchiveTrading();
  return [...trades].sort((a, b) => b.dateEntree.localeCompare(a.dateEntree));
}

export async function getTrade(id: string): Promise<Trade | undefined> {
  return (await lireArchiveTrading()).trades.find((t) => t.id === id);
}

/** Crée le trade (sans identifiant) ou met à jour celui qui en a un. */
export async function enregistrerTrade(trade: Omit<Trade, 'id'> & { id?: string }): Promise<Trade> {
  const archive = await lireArchiveTrading();
  const complet: Trade = { ...trade, id: trade.id ?? generateId() };
  const i = archive.trades.findIndex((t) => t.id === complet.id);
  if (i >= 0) archive.trades[i] = complet;
  else archive.trades.push(complet);
  await remplacerArchiveTrading(archive);
  return complet;
}

export async function supprimerTrade(id: string): Promise<void> {
  const archive = await lireArchiveTrading();
  await remplacerArchiveTrading({ trades: archive.trades.filter((t) => t.id !== id) });
}
