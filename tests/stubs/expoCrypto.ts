import { createHash, randomUUID as uuid } from 'node:crypto';

/** expo-crypto pour les tests : les identifiants et les empreintes viennent du module crypto de Node. */
export const randomUUID = (): string => uuid();
export const CryptoDigestAlgorithm = { SHA256: 'sha256', SHA1: 'sha1', MD5: 'md5' } as const;
export const CryptoEncoding = { HEX: 'hex' } as const;
export async function digestStringAsync(algorithme: string, texte: string): Promise<string> {
  return createHash(algorithme).update(texte).digest('hex');
}
