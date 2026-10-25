import type { LotFromage } from '@/features/stock/types';

/** Un numéro de lot comparé sans majuscules, espaces ni tirets : « ff26297-16 » et « FF26297 16 » sont le même. */
const normaliser = (numero: string): string => numero.toUpperCase().replace(/[^A-Z0-9]/g, '');

/**
 * Les lots que désigne ce qui a été lu ou tapé : le lot dont le numéro est exactement celui-là ; sinon ceux dont le numéro se termine par lui (une photo ne lit souvent que
 * le dernier nombre : « 16 » désigne FF26297-16).
 */
export function lotsDuNumero(lots: readonly LotFromage[], saisie: string): LotFromage[] {
  const cherche = normaliser(saisie);
  if (!cherche) return [];
  const exact = lots.filter((l) => normaliser(l.numero) === cherche);
  if (exact.length > 0) return exact;
  return lots.filter((l) => normaliser(l.numero).endsWith(cherche));
}
