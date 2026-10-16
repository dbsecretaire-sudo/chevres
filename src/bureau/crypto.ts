/**
 * expo-crypto dans la version Windows. Le navigateur ne sait pas calculer une empreinte MD5 (ses fonctions de chiffrement
 * l'écartent), or Google Drive garde celle de chaque fichier et l'application s'en sert pour savoir ce qui a changé : l'empreinte
 * est calculée ici, sur le texte en UTF-8, comme le fait le téléphone.
 */
export const CryptoDigestAlgorithm = { MD5: 'MD5' } as const;
export const CryptoEncoding = { HEX: 'hex', BASE64: 'base64' } as const;

/** Les décalages et les constantes de MD5 (RFC 1321). */
const DECALAGES = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9,
  14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15,
  21, 6, 10, 15, 21,
];
const CONSTANTES = Array.from(
  { length: 64 },
  (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0,
);

const tourner = (x: number, n: number): number => (x << n) | (x >>> (32 - n));

/** L'empreinte MD5 d'octets, en octets. */
function md5(octets: Uint8Array): Uint8Array {
  const longueur = octets.length;
  // Le message est complété d'un 1, de zéros, puis de sa longueur en bits (sur 8 octets), pour faire des blocs de 64 octets.
  const total = (((longueur + 8) >> 6) + 1) << 6;
  const message = new Uint8Array(total);
  message.set(octets);
  message[longueur] = 0x80;
  const vue = new DataView(message.buffer);
  vue.setUint32(total - 8, (longueur << 3) >>> 0, true);
  vue.setUint32(total - 4, Math.floor(longueur / 0x20000000), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;
  for (let bloc = 0; bloc < total; bloc += 64) {
    const m = Array.from({ length: 16 }, (_, i) => vue.getUint32(bloc + i * 4, true));
    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;
    for (let i = 0; i < 64; i++) {
      let f: number;
      let g: number;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }
      const suite = (f + a + CONSTANTES[i] + m[g]) | 0;
      a = d;
      d = c;
      c = b;
      b = (b + tourner(suite, DECALAGES[i])) | 0;
    }
    a0 = (a0 + a) | 0;
    b0 = (b0 + b) | 0;
    c0 = (c0 + c) | 0;
    d0 = (d0 + d) | 0;
  }
  const resultat = new Uint8Array(16);
  const sortie = new DataView(resultat.buffer);
  [a0, b0, c0, d0].forEach((mot, i) => sortie.setUint32(i * 4, mot >>> 0, true));
  return resultat;
}

/** digestStringAsync de expo-crypto : l'empreinte MD5 d'un texte, en hexadécimal (ou en base64). */
export async function digestStringAsync(
  _algorithme: string,
  texte: string,
  options?: { encoding?: 'hex' | 'base64' },
): Promise<string> {
  const empreinte = md5(new TextEncoder().encode(texte));
  if (options?.encoding === 'base64') return btoa(String.fromCharCode(...empreinte));
  return Array.from(empreinte, (o) => o.toString(16).padStart(2, '0')).join('');
}

export const randomUUID = (): string => globalThis.crypto.randomUUID();
