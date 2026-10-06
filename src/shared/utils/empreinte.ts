import * as Crypto from 'expo-crypto';

/** L'empreinte MD5 d'un texte, en hexadécimal : la même que celle que Google Drive garde pour un fichier envoyé. */
export function empreinteTexte(texte: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.MD5, texte, {
    encoding: Crypto.CryptoEncoding.HEX,
  });
}
