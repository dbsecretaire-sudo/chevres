import AsyncStorageNatif from '@react-native-async-storage/async-storage';

/**
 * Le stockage du téléphone, avec toutes les données gardées en mémoire (comme la version Windows, voir src/bureau/asyncStorage.ts) :
 * tout se lit une fois au démarrage, puis chaque lecture est immédiate au lieu de traverser le téléphone (base de données, pont natif).
 * Les écritures partent aussi vers le vrai stockage : rien n'est perdu à la fermeture de l'application.
 *
 * Metro met ce module à la place de @react-native-async-storage/async-storage sur le téléphone (metro.config.js) : les fichiers qui
 * l'importent n'ont pas changé. Ce module-ci importe l'original.
 */
const memoire = new Map<string, string>();
const TAILLE_DU_LOT = 500;

let chargement: Promise<void> | null = null;

async function charger(): Promise<void> {
  const cles = await AsyncStorageNatif.getAllKeys();
  for (let i = 0; i < cles.length; i += TAILLE_DU_LOT) {
    for (const [cle, valeur] of await AsyncStorageNatif.multiGet(cles.slice(i, i + TAILLE_DU_LOT))) {
      if (valeur !== null) memoire.set(cle, valeur);
    }
  }
}

/** Les données sont en mémoire : toute opération l'attend (la lecture démarre dès l'ouverture de l'application). Un échec se réessaie à l'appel suivant. */
function pret(): Promise<void> {
  if (!chargement) {
    chargement = charger().catch((erreur) => {
      memoire.clear();
      chargement = null;
      throw erreur;
    });
  }
  return chargement;
}
pret().catch(() => undefined);

const AsyncStorage = {
  async getItem(cle: string): Promise<string | null> {
    await pret();
    return memoire.get(cle) ?? null;
  },
  async setItem(cle: string, valeur: string): Promise<void> {
    await pret();
    const avant = memoire.get(cle);
    memoire.set(cle, valeur);
    try {
      await AsyncStorageNatif.setItem(cle, valeur);
    } catch (erreur) {
      // Le téléphone a refusé d'écrire : la mémoire redit ce qu'il y a vraiment.
      if (avant === undefined) memoire.delete(cle);
      else memoire.set(cle, avant);
      throw erreur;
    }
  },
  async removeItem(cle: string): Promise<void> {
    await pret();
    const avant = memoire.get(cle);
    memoire.delete(cle);
    try {
      await AsyncStorageNatif.removeItem(cle);
    } catch (erreur) {
      if (avant !== undefined) memoire.set(cle, avant);
      throw erreur;
    }
  },
  async getAllKeys(): Promise<string[]> {
    await pret();
    return [...memoire.keys()];
  },
  async multiGet(cles: readonly string[]): Promise<[string, string | null][]> {
    await pret();
    return cles.map((cle) => [cle, memoire.get(cle) ?? null]);
  },
  async multiSet(paires: readonly (readonly [string, string])[]): Promise<void> {
    for (const [cle, valeur] of paires) await AsyncStorage.setItem(cle, valeur);
  },
  async multiRemove(cles: readonly string[]): Promise<void> {
    for (const cle of cles) await AsyncStorage.removeItem(cle);
  },
  async clear(): Promise<void> {
    await pret();
    const avant = new Map(memoire);
    memoire.clear();
    try {
      await AsyncStorageNatif.clear();
    } catch (erreur) {
      for (const [cle, valeur] of avant) memoire.set(cle, valeur);
      throw erreur;
    }
  },
};

export default AsyncStorage;
