import type { ArchiveStock } from '@/features/stock/types';
import { SECTIONS, SECTIONS_GITE, etablissementGite } from '@/features/stock/utils/categories';
import {
  COMPTE_PAR_SECTION_INVENTAIRE,
  COMPTE_PAR_SECTION_INVENTAIRE_GITE,
} from '@/shared/constants/planComptable';

/** Les listes d'office de l'inventaire avec leur catégorie et leur compte (celles d'un gîte, ou celles d'une exploitation agricole). */
export const listesDOffice = (): { categorie: string; compte: string }[] =>
  etablissementGite()
    ? SECTIONS_GITE.map((x) => ({
        categorie: x.categorie,
        compte: COMPTE_PAR_SECTION_INVENTAIRE_GITE[x.section].numero,
      }))
    : SECTIONS.map((x) => ({
        categorie: x.categorie,
        compte: COMPTE_PAR_SECTION_INVENTAIRE[x.section].numero,
      }));

/**
 * L'inventaire sans les listes ajoutées qui font doublon avec une liste d'office : même catégorie, même compte, et nommée comme le
 * compte (« Ventes — Lait » 701100 à côté de « Lait » 701100, ce que donne un compte marqué « Inventaire »). Une liste nommée autrement
 * (« Miel » sur le compte des animaux) reste, comme une liste dont un article a des mouvements : on ne retire que ce qui est vide.
 */
export function sansDoublonsDOffice(archive: ArchiveStock): ArchiveStock {
  const office = new Set(listesDOffice().map((l) => `${l.categorie}|${l.compte}`));
  const articlesAvecMouvements = new Set(archive.mouvements.map((m) => m.article.split(':')[1]));
  const doublons = new Set(
    (archive.listes ?? [])
      .filter(
        (l) =>
          office.has(`${l.categorie}|${l.compte}`) &&
          l.nom.trim().toLowerCase() === l.libelleCompte?.trim().toLowerCase() &&
          !archive.articles.some((a) => a.listeId === l.id && articlesAvecMouvements.has(a.id)),
      )
      .map((l) => l.id),
  );
  if (doublons.size === 0) return archive;
  return {
    ...archive,
    listes: (archive.listes ?? []).filter((l) => !doublons.has(l.id)),
    articles: archive.articles.filter((a) => !(a.listeId && doublons.has(a.listeId))),
  };
}
