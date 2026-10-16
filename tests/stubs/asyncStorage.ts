/** Un AsyncStorage en mémoire, pour les tests : mêmes appels que le vrai, rien n'est écrit sur le disque. */
const memoire = new Map<string, string>();

const AsyncStorage = {
  async getItem(cle: string): Promise<string | null> {
    return memoire.get(cle) ?? null;
  },
  async setItem(cle: string, valeur: string): Promise<void> {
    memoire.set(cle, valeur);
  },
  async removeItem(cle: string): Promise<void> {
    memoire.delete(cle);
  },
  async getAllKeys(): Promise<string[]> {
    return [...memoire.keys()];
  },
  async multiGet(cles: readonly string[]): Promise<[string, string | null][]> {
    return cles.map((c) => [c, memoire.get(c) ?? null]);
  },
  async multiSet(paires: readonly [string, string][]): Promise<void> {
    for (const [c, v] of paires) memoire.set(c, v);
  },
  async multiRemove(cles: readonly string[]): Promise<void> {
    for (const c of cles) memoire.delete(c);
  },
  async clear(): Promise<void> {
    memoire.clear();
  },
};

export default AsyncStorage;
