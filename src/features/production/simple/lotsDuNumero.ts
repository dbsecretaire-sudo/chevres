import type { LotFromage } from '@/features/stock/types';
import { LETTRE_PRODUIT_LOT, SEPARATEUR_NUMERO_LOT } from '@/shared/constants/stock';

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

/** Les lettres du clavier d'un numéro de lot : celles des produits (F, B, P, S) et celles des numéros déjà donnés (la catégorie : F, V, C, B…), dans l'ordre alphabétique. */
export function lettresDesNumeros(numeros: readonly string[]): string[] {
  const lettres = new Set<string>(Object.values(LETTRE_PRODUIT_LOT));
  for (const numero of numeros) for (const c of numero.toUpperCase()) if (/[A-Z]/.test(c)) lettres.add(c);
  return [...lettres].sort();
}

/**
 * Le numéro tapé touche par touche, écrit comme un numéro de lot : le « - » se met tout seul, là où les lots connus l'ont (« FF26297-16 », d'après « FF26297 » puis « 16 »).
 * Sans lot connu qui commence ainsi, il se met après le jour de l'année, soit 7 caractères (2 lettres, l'année, 3 chiffres).
 */
export function formaterNumeroDeLot(saisie: string, numeros: readonly string[]): string {
  const brut = normaliser(saisie);
  const modele = numeros.find((n) => normaliser(n).startsWith(brut) && n.includes(SEPARATEUR_NUMERO_LOT));
  const place = modele ? modele.indexOf(SEPARATEUR_NUMERO_LOT) : /^[A-Z]{2}\d+$/.test(brut) ? 7 : -1;
  if (place < 0 || brut.length <= place) return brut;
  return `${brut.slice(0, place)}${SEPARATEUR_NUMERO_LOT}${brut.slice(place)}`;
}
