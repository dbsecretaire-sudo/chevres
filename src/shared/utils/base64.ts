const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Le contenu d'un fichier (octets) en base64, pour l'écrire dans l'appareil ou l'envoyer. */
export function octetsEnBase64(octets: Uint8Array): string {
  const morceaux: string[] = [];
  for (let i = 0; i < octets.length; i += 3) {
    const [a, b, c] = [octets[i], octets[i + 1], octets[i + 2]];
    const bloc = (a << 16) | ((b ?? 0) << 8) | (c ?? 0);
    morceaux.push(
      ALPHABET[(bloc >> 18) & 63] +
        ALPHABET[(bloc >> 12) & 63] +
        (b === undefined ? '=' : ALPHABET[(bloc >> 6) & 63]) +
        (c === undefined ? '=' : ALPHABET[bloc & 63]),
    );
  }
  return morceaux.join('');
}
