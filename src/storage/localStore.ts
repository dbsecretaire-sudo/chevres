import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Categorie, RecordMap } from '@/types/models';

const KEY_PREFIX = 'troupeau:v1:';

/**
 * Sérialise les lectures-modifications-écritures par catégorie. Sans ça, deux
 * upsertRecord() concurrents sur la même catégorie (ex: les cabrits d'une même
 * portée créés en parallèle via Promise.all) lisent le même instantané avant
 * d'écrire chacun leur version, et le second écrase silencieusement le premier.
 */
const locks = new Map<Categorie, Promise<unknown>>();

function withLock<T>(categorie: Categorie, fn: () => Promise<T>): Promise<T> {
  const previous = locks.get(categorie) ?? Promise.resolve();
  const next = previous.then(fn, fn);
  locks.set(
    categorie,
    next.catch(() => undefined),
  );
  return next;
}

function dataKey(categorie: Categorie, annee: number): string {
  return `${KEY_PREFIX}data:${categorie}:${annee}`;
}

function yearsKey(categorie: Categorie): string {
  return `${KEY_PREFIX}years:${categorie}`;
}

export async function getYears(categorie: Categorie): Promise<number[]> {
  const raw = await AsyncStorage.getItem(yearsKey(categorie));
  if (!raw) return [];
  try {
    const years = JSON.parse(raw) as number[];
    return years.sort((a, b) => b - a);
  } catch {
    return [];
  }
}

async function ensureYearRegistered(categorie: Categorie, annee: number): Promise<void> {
  const years = await getYears(categorie);
  if (!years.includes(annee)) {
    years.push(annee);
    await AsyncStorage.setItem(yearsKey(categorie), JSON.stringify(years));
  }
}

export async function loadYear<C extends Categorie>(
  categorie: C,
  annee: number,
): Promise<RecordMap[C][]> {
  const raw = await AsyncStorage.getItem(dataKey(categorie, annee));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as RecordMap[C][];
  } catch {
    return [];
  }
}

export async function saveYear<C extends Categorie>(
  categorie: C,
  annee: number,
  items: RecordMap[C][],
): Promise<void> {
  await AsyncStorage.setItem(dataKey(categorie, annee), JSON.stringify(items));
  await ensureYearRegistered(categorie, annee);
}

/** Charge et fusionne toutes les années connues d'une catégorie. */
export async function loadAllYears<C extends Categorie>(categorie: C): Promise<RecordMap[C][]> {
  const years = await getYears(categorie);
  const chunks = await Promise.all(years.map((y) => loadYear(categorie, y)));
  return chunks.flat();
}

// --- Index id -> année, pour retrouver/mettre à jour un enregistrement sans tout charger ---

function indexKey(categorie: Categorie): string {
  return `${KEY_PREFIX}index:${categorie}`;
}

async function getIdIndex(categorie: Categorie): Promise<Record<string, number>> {
  const raw = await AsyncStorage.getItem(indexKey(categorie));
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

async function setIdIndex(categorie: Categorie, index: Record<string, number>): Promise<void> {
  await AsyncStorage.setItem(indexKey(categorie), JSON.stringify(index));
}

export async function upsertRecord<C extends Categorie>(
  categorie: C,
  annee: number,
  record: RecordMap[C] & { id: string },
): Promise<void> {
  return withLock(categorie, async () => {
    const index = await getIdIndex(categorie);
    const previousYear = index[record.id];

    if (previousYear !== undefined && previousYear !== annee) {
      const previousItems = await loadYear(categorie, previousYear);
      await saveYear(categorie, previousYear, previousItems.filter((i: any) => i.id !== record.id));
    }

    const items = await loadYear(categorie, annee);
    const idx = items.findIndex((i: any) => i.id === record.id);
    if (idx >= 0) items[idx] = record;
    else items.push(record);
    await saveYear(categorie, annee, items);

    index[record.id] = annee;
    await setIdIndex(categorie, index);
  });
}

export async function findRecord<C extends Categorie>(
  categorie: C,
  id: string,
): Promise<RecordMap[C] | undefined> {
  const index = await getIdIndex(categorie);
  const annee = index[id];
  if (annee === undefined) return undefined;
  const items = await loadYear(categorie, annee);
  return (items as any[]).find((i) => i.id === id);
}

export async function deleteRecord(categorie: Categorie, id: string): Promise<void> {
  return withLock(categorie, async () => {
    const index = await getIdIndex(categorie);
    const annee = index[id];
    if (annee === undefined) return;
    const items = await loadYear(categorie, annee);
    await saveYear(categorie, annee, (items as any[]).filter((i) => i.id !== id));
    delete index[id];
    await setIdIndex(categorie, index);
  });
}
