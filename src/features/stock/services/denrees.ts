import type { ArchiveStock, ArticleStock, ListeInventaire } from '@/features/stock/types';
import { COMPTE_DENREES } from '@/shared/constants/planComptable';
import { CATEGORIE_INVENTAIRE, GENRE_ARTICLE } from '@/shared/constants/stock';
import { TEXTES } from '@/shared/textes';

/** L'identifiant de la liste des matières alimentaires consommables : le même partout, pour qu'une sauvegarde ou Google Drive ne la double jamais. */
export const ID_LISTE_DENREES = 'denrees';

/** Les denrées proposées au départ (leur identifiant, leur nom) : on en ajoute, on les renomme ou on les retire comme n'importe quel article. */
const DENREES_DE_DEPART: readonly { id: string; nom: string }[] = [
  { id: 'farine', nom: TEXTES.stock.denrees.farine },
  { id: 'oeufs', nom: TEXTES.stock.denrees.oeufs },
  { id: 'huile-olive', nom: TEXTES.stock.denrees.huileOlive },
  { id: 'sucre', nom: TEXTES.stock.denrees.sucre },
  { id: 'lait-alimentaire', nom: TEXTES.stock.denrees.laitAlimentaire },
];

/**
 * L'inventaire avec sa liste « Matières alimentaires consommables » (matières premières, compte 601400 : farine, œufs, huile d'olive…), utile aux
 * repas des formules d'agritourisme et aux plats préparés. Elle s'ajoute une seule fois, à la première lecture : `denreesAjoutees` retient qu'elle l'a
 * été, donc une liste supprimée ensuite ne revient pas. Rien n'est écrit ici : elle s'enregistre avec la prochaine écriture du stock.
 */
export function avecListeDenrees(archive: ArchiveStock): ArchiveStock {
  if (archive.denreesAjoutees) return archive;
  const liste: ListeInventaire = {
    id: ID_LISTE_DENREES,
    categorie: CATEGORIE_INVENTAIRE.MATIERES_PREMIERES,
    nom: `${TEXTES.stock.titresListes.prefixeAchat}${TEXTES.stock.denrees.liste}`,
    compte: COMPTE_DENREES.numero,
    libelleCompte: COMPTE_DENREES.libelle,
  };
  const articles: ArticleStock[] = DENREES_DE_DEPART.map((d) => ({
    id: `${ID_LISTE_DENREES}-${d.id}`,
    genre: GENRE_ARTICLE.PERSONNALISE,
    nom: d.nom,
    listeId: ID_LISTE_DENREES,
  }));
  return {
    ...archive,
    denreesAjoutees: true,
    listes: [...(archive.listes ?? []), liste],
    articles: [...archive.articles, ...articles],
  };
}
