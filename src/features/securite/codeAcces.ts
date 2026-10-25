import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Le code d'accès de l'application : demandé à chaque ouverture. Seule une empreinte est gardée sur l'appareil (PBKDF2-SHA256, avec un sel aléatoire),
 * jamais le code lui-même. Cette clé n'est jamais synchronisée (voir estSynchronisable) : le serveur ne la voit pas.
 */
export const CLE_CODE = 'troupeau:v1:securite-code';

/** Le nombre de tours de l'empreinte : il rend chaque essai hors ligne lent. */
const ITERATIONS = 310000;

/** Le code doit faire au moins ce nombre de caractères. */
export const LONGUEUR_MIN_CODE = 6;

interface EmpreinteCode {
  sel: string;
  empreinte: string;
  iterations: number;
}

/** Ce qui est déverrouillé pour cette ouverture de l'application seulement : une nouvelle ouverture redemande le code. */
let deverrouille = false;

export const estDeverrouille = (): boolean => deverrouille;
export const deverrouiller = (): void => {
  deverrouille = true;
};

const enOctets = (texte: string): Uint8Array => new TextEncoder().encode(texte);
const versBase64 = (octets: Uint8Array): string => btoa(String.fromCharCode(...octets));
const deBase64 = (texte: string): Uint8Array => Uint8Array.from(atob(texte), (c) => c.charCodeAt(0));
/** Une copie exacte des octets, dans le format attendu par l'API de cryptographie du navigateur. */
const tampon = (octets: Uint8Array): ArrayBuffer => octets.buffer.slice(octets.byteOffset, octets.byteOffset + octets.byteLength) as ArrayBuffer;

async function derive(code: string, sel: Uint8Array, iterations: number): Promise<Uint8Array> {
  const cle = await crypto.subtle.importKey('raw', tampon(enOctets(code)), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: tampon(sel), iterations, hash: 'SHA-256' }, cle, 256);
  return new Uint8Array(bits);
}

/** Un code est-il défini sur cet appareil ? */
export async function codeDefini(): Promise<boolean> {
  return (await AsyncStorage.getItem(CLE_CODE)) !== null;
}

/** Définit le code (ou le remplace : il faut alors vérifier l'ancien avant, voir changerCode). */
export async function definirCode(code: string): Promise<void> {
  const sel = crypto.getRandomValues(new Uint8Array(16));
  const empreinte = await derive(code, sel, ITERATIONS);
  const enregistre: EmpreinteCode = { sel: versBase64(sel), empreinte: versBase64(empreinte), iterations: ITERATIONS };
  await AsyncStorage.setItem(CLE_CODE, JSON.stringify(enregistre));
}

/** Le code donné est-il le bon ? Sans code défini, la réponse est non. */
export async function verifierCode(code: string): Promise<boolean> {
  const brut = await AsyncStorage.getItem(CLE_CODE);
  if (!brut) return false;
  const enregistre = JSON.parse(brut) as EmpreinteCode;
  const essai = await derive(code, deBase64(enregistre.sel), enregistre.iterations);
  const attendu = deBase64(enregistre.empreinte);
  // Comparaison qui ne s'arrête pas au premier octet différent.
  let difference = essai.length ^ attendu.length;
  for (let i = 0; i < essai.length && i < attendu.length; i++) difference |= essai[i] ^ attendu[i];
  return difference === 0;
}

/** Retire le code (après vérification de l'actuel). Rend false si le code actuel est faux. */
export async function supprimerCode(codeActuel: string): Promise<boolean> {
  if (!(await verifierCode(codeActuel))) return false;
  await AsyncStorage.removeItem(CLE_CODE);
  return true;
}

/** Change le code : l'actuel doit être bon. Rend false si l'actuel est faux. */
export async function changerCode(codeActuel: string, nouveau: string): Promise<boolean> {
  if (!(await verifierCode(codeActuel))) return false;
  await definirCode(nouveau);
  return true;
}
