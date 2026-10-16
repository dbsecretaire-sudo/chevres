import { pont } from '@/bureau/pont';

/**
 * Le stockage de la version Windows : les mêmes fonctions que @react-native-async-storage/async-storage, mais les données tiennent
 * dans un fichier de l'ordinateur (pas de limite de taille d'un navigateur). La page garde tout en mémoire ; seuls les changements
 * partent vers le fichier, qui s'écrit sans attendre.
 */
const memoire = new Map<string, string>(Object.entries(pont().donnees));

/** Les changements qui n'ont pas encore été envoyés au fichier, groupés pour ne faire qu'un envoi par rafale. */
let aEcrire: Record<string, string> = {};
let aRetirer = new Set<string>();
let envoiPlanifie = false;

function planifierEnvoi() {
  if (envoiPlanifie) return;
  envoiPlanifie = true;
  queueMicrotask(() => {
    envoiPlanifie = false;
    const ecrire = aEcrire;
    const retirer = [...aRetirer];
    aEcrire = {};
    aRetirer = new Set();
    pont().ecrireStockage(ecrire, retirer);
  });
}

const AsyncStorage = {
  async getItem(cle: string): Promise<string | null> {
    return memoire.get(cle) ?? null;
  },
  async setItem(cle: string, valeur: string): Promise<void> {
    memoire.set(cle, valeur);
    aEcrire[cle] = valeur;
    aRetirer.delete(cle);
    planifierEnvoi();
  },
  async removeItem(cle: string): Promise<void> {
    memoire.delete(cle);
    delete aEcrire[cle];
    aRetirer.add(cle);
    planifierEnvoi();
  },
  async getAllKeys(): Promise<string[]> {
    return [...memoire.keys()];
  },
  async multiGet(cles: readonly string[]): Promise<[string, string | null][]> {
    return cles.map((cle) => [cle, memoire.get(cle) ?? null]);
  },
  async multiSet(paires: readonly (readonly [string, string])[]): Promise<void> {
    for (const [cle, valeur] of paires) await AsyncStorage.setItem(cle, valeur);
  },
  async multiRemove(cles: readonly string[]): Promise<void> {
    for (const cle of cles) await AsyncStorage.removeItem(cle);
  },
  async clear(): Promise<void> {
    await AsyncStorage.multiRemove([...memoire.keys()]);
  },
};

export default AsyncStorage;
