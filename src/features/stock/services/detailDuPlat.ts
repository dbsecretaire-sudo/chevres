import { libelleArticle } from '@/features/stock/services/stock';
import type { ArchiveStock, LotFromage } from '@/features/stock/types';
import { TEXTES } from '@/shared/textes';
import { formatDateShortFR } from '@/shared/utils/dates';

const T = TEXTES.stock.lots.plat;

/**
 * Ce qu'on sait d'un lot de plat préparé, en deux lignes à montrer sous son numéro : sa stérilisation et sa date de durabilité minimale, puis ses ingrédients
 * (la quantité utilisée de chacun, avec les numéros des lots pris). Rien pour un lot qui n'est pas un plat fabriqué avec ce suivi.
 */
export function detailDuLotDePlat(
  lot: Pick<LotFromage, 'mouvementId'>,
  archive: Pick<ArchiveStock, 'lots' | 'platsFabriques' | 'articles' | 'noms'>,
): string[] {
  const fabrication = lot.mouvementId ? archive.platsFabriques?.[lot.mouvementId] : undefined;
  if (!fabrication) return [];
  const lignes: string[] = [];
  const dates = [
    fabrication.dateSterilisation ? T.sterilise(formatDateShortFR(fabrication.dateSterilisation)) : undefined,
    fabrication.ddm ? T.ddm(formatDateShortFR(fabrication.ddm)) : undefined,
  ].filter(Boolean);
  if (dates.length > 0) lignes.push(dates.join(' · '));
  if (fabrication.ingredients.length > 0) {
    const ingredients = fabrication.ingredients.map((i) => {
      const numeros = (archive.lots ?? []).filter((l) => i.lotIds.includes(l.id)).map((l) => l.numero);
      const nom = libelleArticle(i.article, archive as ArchiveStock);
      const quantite = String(i.quantite).replace('.', ',');
      return numeros.length > 0 ? `${quantite} × ${nom} (${numeros.join(', ')})` : `${quantite} × ${nom}`;
    });
    lignes.push(T.ingredients(ingredients.join(' · ')));
  }
  return lignes;
}
