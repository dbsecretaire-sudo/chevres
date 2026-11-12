import type { ArchiveStock, LotFromage } from '@/features/stock/types';
import { TYPE_FROMAGE } from '@/shared/constants/comptabilite';
import { GENRE_ARTICLE, TYPE_LAIT_FROMAGE } from '@/shared/constants/stock';
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

/**
 * Un fromage affiné (le vieux, le brocciu affiné, le crottin affiné…) : reconnu à son type, ou à son nom quand c'est un fromage ajouté au stock.
 */
export function estFromageAffine(article: string, libelle = ''): boolean {
  return article === `${GENRE_ARTICLE.FROMAGE}:${TYPE_FROMAGE.AFFINE}` || /affin/i.test(libelle);
}

/**
 * Ce qu'un fromage est toujours, sans qu'on le demande : un affiné n'est jamais salé ; le brocciu est toujours salé et pasteurisé. Rien d'imposé pour les autres :
 * on demande alors s'il est salé et de quel lait.
 */
export function variantesImposees(article: string, libelle = ''): { sale?: boolean; lait?: TypeLait } {
  if (estFromageAffine(article, libelle)) return { sale: false };
  if (article === `${GENRE_ARTICLE.FROMAGE}:${TYPE_FROMAGE.BROCCIU}`) return { sale: true, lait: TYPE_LAIT_FROMAGE.PASTEURISE };
  return {};
}

/**
 * Les laits qu'un fromage peut prendre, dans l'ordre où on les propose. Un affiné n'a aucun choix de lait : vide, on ne le demande pas.
 */
export function laitsPermis(article: string, libelle = ''): TypeLait[] {
  return estFromageAffine(article, libelle) ? [] : [...TYPES_DE_LAIT];
}

/** Les variantes possibles d'un fromage : toutes, moins celles que son type exclut (un affiné : jamais salé, pas de lait à choisir). */
export function variantesPossibles(article: string, libelle = ''): VarianteDeFromage[] {
  const imposee = variantesImposees(article, libelle);
  const laits = laitsPermis(article, libelle);
  return VARIANTES_DE_FROMAGE.filter(
    (v) => (imposee.sale === undefined || v.sale === imposee.sale) && (!imposee.lait || v.lait === imposee.lait) && laits.includes(v.lait),
  );
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

/**
 * Les durées de conservation par défaut (jours) d'un fromage dont la durée n'est pas réglée : le frais, le brocciu, le crottin, et l'affiné (le vieux, et les
 * affinés ajoutés au stock d'après leur nom). Repères à ajuster d'après la fiche de chaque produit.
 */
const DUREES_PAR_DEFAUT = { frais: 21, brocciu: 7, brocciuAffine: 30, crottin: 21, crottinAffine: 28, affine: 90 } as const;

/** La durée par défaut d'un fromage, d'après son article (son type) et son nom ; rien pour un autre produit. */
export function dureeParDefaut(article: string, libelle = ''): number | undefined {
  if (!article.startsWith(`${GENRE_ARTICLE.FROMAGE}:`)) return undefined;
  const nom = libelle.toLowerCase();
  const affine = estFromageAffine(article, libelle);
  if (nom.includes('brocciu') || article.endsWith(':brocciu')) return affine ? DUREES_PAR_DEFAUT.brocciuAffine : DUREES_PAR_DEFAUT.brocciu;
  if (nom.includes('crottin') || article.endsWith(':crottin')) return affine ? DUREES_PAR_DEFAUT.crottinAffine : DUREES_PAR_DEFAUT.crottin;
  if (affine) return DUREES_PAR_DEFAUT.affine;
  return DUREES_PAR_DEFAUT.frais;
}

/**
 * La durée de conservation d'un lot, en jours : celle de sa variante (salé ou non, lait) quand le lot la connaît, sinon celle de base du produit, sinon
 * la durée par défaut de son fromage.
 */
export function dureeDeVieDuLot(
  lot: Pick<LotFromage, 'article' | 'sale' | 'lait'>,
  archive: Pick<ArchiveStock, 'dureeDeVie'> & Partial<Pick<ArchiveStock, 'noms'>>,
): number | undefined {
  const table = archive.dureeDeVie ?? {};
  const precise =
    lot.sale !== undefined && lot.lait ? table[cleDureeDeVie(lot.article, suffixeDeVariante({ sale: lot.sale, lait: lot.lait }))] : undefined;
  const jours = precise ?? table[lot.article] ?? dureeParDefaut(lot.article, archive.noms?.[lot.article] ?? lot.article.split(':')[1]);
  return jours && jours > 0 ? jours : undefined;
}

/** La DLC d'un lot (AAAA-MM-JJ) : la date de fabrication plus la durée de conservation de son produit (ou sa durée par défaut). */
export function dlcDuLot(
  lot: Pick<LotFromage, 'article' | 'dateFabrication' | 'sale' | 'lait'>,
  archive: Pick<ArchiveStock, 'dureeDeVie'> & Partial<Pick<ArchiveStock, 'noms'>>,
): string | undefined {
  const jours = dureeDeVieDuLot(lot, archive);
  return jours && lot.dateFabrication ? ajouterJours(lot.dateFabrication, jours) : undefined;
}
