import { estArticleSavon } from '@/features/stock/services/dossiersSavons';
import { dlcDuLot } from '@/features/stock/services/dlc';
import type { TypeLait } from '@/features/stock/services/dlc';
import { libelleArticle } from '@/features/stock/services/stock';
import type { ArchiveStock, LotFromage } from '@/features/stock/types';

/** Ce qu'une étiquette de lot porte, tiré de la fabrication et du dossier du savon : rien n'est à ressaisir. */
export interface EtiquetteDeLot {
  produit: string;
  numero: string;
  dateFabrication: string;
  /** Vrai pour un savon (un cosmétique : liste INCI, « à utiliser de préférence avant »). */
  savon: boolean;
  /** La date de durabilité minimale (AAAA-MM-JJ), quand la fabrication en a une. */
  ddm?: string;
  /** La DLC (AAAA-MM-JJ) d'un fromage ou d'un produit de charcuterie : sa fabrication plus la durée de conservation réglée dans l'inventaire. */
  dlc?: string;
  /** Un fromage : salé ou non, et son lait (la mention de l'étiquette). */
  sale?: boolean;
  lait?: TypeLait;
  /** La fin de cure d'un savon (AAAA-MM-JJ). */
  finCure?: string;
  /** La liste INCI d'un savon (sa liste d'ingrédients, du dossier), ou les noms des ingrédients d'un plat dans l'ordre de leur quantité. */
  composition?: string;
}

/** L'étiquette d'un lot de plat préparé ou de savon. */
export function etiquetteDuLot(
  lot: Pick<LotFromage, 'article' | 'numero' | 'dateFabrication' | 'mouvementId' | 'sale' | 'lait'>,
  archive: Pick<ArchiveStock, 'platsFabriques' | 'dossiersSavons' | 'articles' | 'noms' | 'dureeDeVie'>,
): EtiquetteDeLot {
  const savon = estArticleSavon(lot.article);
  const fabrication = lot.mouvementId ? archive.platsFabriques?.[lot.mouvementId] : undefined;
  const noms = [...(fabrication?.ingredients ?? [])]
    .sort((a, b) => b.quantite - a.quantite)
    .map((i) => libelleArticle(i.article, archive as ArchiveStock));
  const inci = savon ? archive.dossiersSavons?.[lot.article]?.inci?.trim() : undefined;
  return {
    produit: libelleArticle(lot.article, archive as ArchiveStock),
    numero: lot.numero,
    dateFabrication: lot.dateFabrication,
    savon,
    ddm: fabrication?.ddm,
    dlc: fabrication?.ddm ? undefined : dlcDuLot(lot, archive),
    sale: lot.sale,
    lait: lot.lait,
    finCure: savon ? fabrication?.finCure : undefined,
    composition: inci || (noms.length > 0 ? noms.join(', ') : undefined),
  };
}
