import type { Rappel } from '@/features/rappels/services/rappels';
import { libelleArticle } from '@/features/stock/services/stock';
import type { ArchiveStock, DossierSavon, LotFromage } from '@/features/stock/types';
import { GENRE_RAPPEL } from '@/shared/constants/rappels';
import { ROUTES } from '@/shared/constants/routes';
import { ETAPES_SAVON_OBLIGATOIRES, GENRE_ARTICLE } from '@/shared/constants/stock';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.savons.dossier;

/** Vrai pour un article de l'inventaire qui est un savon (« savon:… »). */
export const estArticleSavon = (cle: string | undefined): boolean =>
  !!cle && cle.startsWith(`${GENRE_ARTICLE.SAVON}:`);

/** Les étapes obligatoires du dossier réglementaire qui ne sont pas faites (dans l'ordre de la liste). */
export const etapesManquantes = (dossier: DossierSavon | undefined): string[] =>
  ETAPES_SAVON_OBLIGATOIRES.filter((etape) => !dossier?.etapes?.[etape]?.fait);

/** Vrai quand toutes les étapes obligatoires du dossier réglementaire d'un savon sont faites : seul un savon en règle se vend. */
export const dossierEnRegle = (archive: Pick<ArchiveStock, 'dossiersSavons'>, article: string): boolean =>
  etapesManquantes(archive.dossiersSavons?.[article]).length === 0;

/** La fin de la cure d'un lot de savon quand il y est encore à cette date (AAAA-MM-JJ) ; rien sinon, ni pour un autre produit. */
export function finDeCureSiEnCure(
  lot: Pick<LotFromage, 'article' | 'mouvementId'>,
  archive: Pick<ArchiveStock, 'platsFabriques'>,
  date: string,
): string | undefined {
  if (!estArticleSavon(lot.article) || !lot.mouvementId) return undefined;
  const fin = archive.platsFabriques?.[lot.mouvementId]?.finCure;
  return fin && fin > date ? fin : undefined;
}

/**
 * Vrai quand un lot peut être vendu à cette date : tout lot, sauf un savon encore en cure ou dont le dossier réglementaire n'est pas en règle (un savon se
 * fabrique et se garde, mais ne se vend qu'une fois sa cure finie et son produit notifié).
 */
export function lotVendable(
  lot: Pick<LotFromage, 'article' | 'mouvementId'>,
  archive: Pick<ArchiveStock, 'platsFabriques' | 'dossiersSavons'>,
  date: string,
): boolean {
  if (!estArticleSavon(lot.article)) return true;
  return !finDeCureSiEnCure(lot, archive, date) && dossierEnRegle(archive, lot.article);
}

/**
 * Les rappels de dossier réglementaire : un par savon déjà fabriqué dont une étape obligatoire manque, rappelé tant que le dossier n'est pas en règle. Aucune
 * coche : il se valide en faisant l'étape, dans le dossier du savon.
 */
export function rappelsDossiersSavons(
  archive: Pick<ArchiveStock, 'lots' | 'dossiersSavons' | 'articles' | 'noms'>,
  aujourdhui: string,
): Rappel[] {
  const fabriques = new Set((archive.lots ?? []).filter((l) => estArticleSavon(l.article)).map((l) => l.article));
  return [...fabriques].flatMap((article) => {
    const manquantes = etapesManquantes(archive.dossiersSavons?.[article]);
    if (manquantes.length === 0) return [];
    return [
      {
        id: `${GENRE_RAPPEL.DOSSIER_SAVON}:${article}`,
        genre: GENRE_RAPPEL.DOSSIER_SAVON,
        libelle: T.rappel(libelleArticle(article, archive as ArchiveStock)),
        echeance: aujourdhui,
        enRetard: true,
        detail: T.manque(manquantes.map((e) => T.etapes[e as keyof typeof T.etapes].titre).join(', ')),
        cible: ROUTES.productionSavonDossier(article),
      },
    ];
  });
}
