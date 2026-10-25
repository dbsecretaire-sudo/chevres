import type { ArchiveStock, LotFromage } from '@/features/stock/types';
import { TYPE_LAIT_FROMAGE } from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { ajouterJours } from '@/shared/utils/calendrier';

export type TypeLait = ValeurDe<typeof TYPE_LAIT_FROMAGE>;

/** Les laits d'un fromage, dans l'ordre où on les propose. */
export const TYPES_DE_LAIT: readonly TypeLait[] = [TYPE_LAIT_FROMAGE.CRU, TYPE_LAIT_FROMAGE.PASTEURISE, TYPE_LAIT_FROMAGE.UHT];

/** Ce qui change la DLC d'un fromage : salé ou non, et le lait (cru, pasteurisé, UHT). */
export interface VarianteDeFromage {
  sale: boolean;
  lait: TypeLait;
}

/** Le suffixe d'une variante (« nonsale|cru ») : il s'ajoute à l'identifiant de l'article pour retrouver sa durée de conservation. */
export const suffixeDeVariante = ({ sale, lait }: VarianteDeFromage): string => `${sale ? 'sale' : 'nonsale'}|${lait}`;

/** Les six variantes d'un fromage (les trois laits, salés ou non). */
export const VARIANTES_DE_FROMAGE: readonly VarianteDeFromage[] = TYPES_DE_LAIT.flatMap((lait) => [
  { sale: false, lait },
  { sale: true, lait },
]);

/** L'identifiant, dans la table des durées, d'un article (« base ») ou d'une de ses variantes. */
export const cleDureeDeVie = (article: string, suffixe?: string): string => (suffixe ? `${article}|${suffixe}` : article);

/** Les durées de conservation d'un article, par suffixe : « » pour sa durée de base, « nonsale|cru » pour une variante de fromage. */
export function dureesDeVieDeLArticle(archive: Pick<ArchiveStock, 'dureeDeVie'>, article: string): Record<string, number> {
  const resultat: Record<string, number> = {};
  for (const [cle, jours] of Object.entries(archive.dureeDeVie ?? {})) {
    if (cle === article) resultat[''] = jours;
    else if (cle.startsWith(`${article}|`)) resultat[cle.slice(article.length + 1)] = jours;
  }
  return resultat;
}

/** La durée de conservation d'un lot, en jours : celle de sa variante (salé ou non, lait) quand le lot la connaît, sinon celle de base du produit. */
export function dureeDeVieDuLot(
  lot: Pick<LotFromage, 'article' | 'sale' | 'lait'>,
  archive: Pick<ArchiveStock, 'dureeDeVie'>,
): number | undefined {
  const table = archive.dureeDeVie ?? {};
  const precise =
    lot.sale !== undefined && lot.lait ? table[cleDureeDeVie(lot.article, suffixeDeVariante({ sale: lot.sale, lait: lot.lait }))] : undefined;
  const jours = precise ?? table[lot.article];
  return jours && jours > 0 ? jours : undefined;
}

/** La DLC d'un lot (AAAA-MM-JJ) : la date de fabrication plus la durée de conservation de son produit ; rien tant que cette durée n'est pas réglée. */
export function dlcDuLot(
  lot: Pick<LotFromage, 'article' | 'dateFabrication' | 'sale' | 'lait'>,
  archive: Pick<ArchiveStock, 'dureeDeVie'>,
): string | undefined {
  const jours = dureeDeVieDuLot(lot, archive);
  return jours && lot.dateFabrication ? ajouterJours(lot.dateFabrication, jours) : undefined;
}
