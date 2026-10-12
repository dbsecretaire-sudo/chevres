import type { ArchiveStock } from '@/features/stock/types';
import { CATEGORIE_INVENTAIRE } from '@/shared/constants/stock';
import { TEXTES } from '@/shared/textes';
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
 * L'inventaire sans les listes ajoutées qui font doublon avec une liste d'office : même compte (dans n'importe quelle catégorie), et
 * nommée comme le compte (« Ventes — Lait » 701100 à côté de « Lait » 701100, ce que donne un compte marqué « Inventaire » ; « Ventes —
 * Animaux » en 35 à côté de « Animaux » en 33). Une liste nommée autrement
 * (« Miel » sur le compte des animaux) reste, comme une liste dont un article a des mouvements : on ne retire que ce qui est vide.
 */
export function sansDoublonsDOffice(archive: ArchiveStock): ArchiveStock {
  const office = new Set(listesDOffice().map((l) => l.compte));
  const articlesAvecMouvements = new Set(archive.mouvements.map((m) => m.article.split(':')[1]));
  const doublons = new Set(
    (archive.listes ?? [])
      .filter(
        (l) =>
          office.has(l.compte) &&
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

/** Vrai pour une liste d'une catégorie de ce qui se vend (produits finis, produits animaux) ; les autres sont des achats. */
const estUneVente = (categorie: string): boolean =>
  categorie === CATEGORIE_INVENTAIRE.PRODUITS_FINIS || categorie === CATEGORIE_INVENTAIRE.PRODUITS_ANIMAUX;

/**
 * Les listes ajoutées à partir d'un compte portent son libellé (« Engrais et amendements ») : elles prennent le préfixe de leur
 * catégorie, « Ventes — » ou « Achat — », comme les listes d'office. Une liste déjà nommée « Ventes… » ou « Achat… » ne change pas.
 */
export function avecNomsHarmonises(archive: ArchiveStock): ArchiveStock {
  const T = TEXTES.stock.titresListes;
  const aRenommer = (archive.listes ?? []).filter(
    (l) => l.nom.trim() === l.libelleCompte?.trim() && !/^(ventes?|achats?)\b/i.test(l.nom.trim()),
  );
  if (aRenommer.length === 0) return archive;
  const ids = new Set(aRenommer.map((l) => l.id));
  return {
    ...archive,
    listes: (archive.listes ?? []).map((l) =>
      ids.has(l.id)
        ? { ...l, nom: `${estUneVente(l.categorie) ? T.prefixeVentes : T.prefixeAchat}${l.nom.trim()}` }
        : l,
    ),
  };
}
