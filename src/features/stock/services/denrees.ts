import type { ArchiveStock, ArticleStock, ListeInventaire } from '@/features/stock/types';
import { COMPTE_DENREES, COMPTE_MATIERES_SAVON } from '@/shared/constants/planComptable';
import { CATEGORIE_INVENTAIRE, GENRE_ARTICLE } from '@/shared/constants/stock';
import { TEXTES } from '@/shared/textes';

/** L'identifiant de la liste des matières alimentaires consommables : le même partout, pour qu'une sauvegarde ou Google Drive ne la double jamais. */
export const ID_LISTE_DENREES = 'denrees';
/** L'identifiant de la liste des matières premières des savons (huiles, soude, beurres…). */
export const ID_LISTE_MATIERES_SAVON = 'matieres-savon';

interface ListeDOffice {
  id: string;
  nom: string;
  compte: { numero: string; libelle: string };
  /** Les articles proposés au départ (leur identifiant, leur nom) : on en ajoute, on les renomme ou on les retire comme n'importe quel article. */
  articles: readonly { id: string; nom: string }[];
}

const T = TEXTES.stock.denrees;
const TS = TEXTES.stock.matieresSavon;

const DENREES: ListeDOffice = {
  id: ID_LISTE_DENREES,
  nom: `${TEXTES.stock.titresListes.prefixeAchat}${T.liste}`,
  compte: COMPTE_DENREES,
  articles: [
    { id: 'farine', nom: T.farine },
    { id: 'oeufs', nom: T.oeufs },
    { id: 'huile-olive', nom: T.huileOlive },
    { id: 'sucre', nom: T.sucre },
    { id: 'lait-alimentaire', nom: T.laitAlimentaire },
  ],
};

const MATIERES_SAVON: ListeDOffice = {
  id: ID_LISTE_MATIERES_SAVON,
  nom: `${TEXTES.stock.titresListes.prefixeAchat}${TS.liste}`,
  compte: COMPTE_MATIERES_SAVON,
  articles: [
    { id: 'huile-olive', nom: TS.huileOlive },
    { id: 'huile-coco', nom: TS.huileCoco },
    { id: 'beurre-karite', nom: TS.beurreKarite },
    { id: 'soude', nom: TS.soude },
    { id: 'huile-essentielle', nom: TS.huileEssentielle },
  ],
};

function ajouter(archive: ArchiveStock, modele: ListeDOffice): ArchiveStock {
  const liste: ListeInventaire = {
    id: modele.id,
    categorie: CATEGORIE_INVENTAIRE.MATIERES_PREMIERES,
    nom: modele.nom,
    compte: modele.compte.numero,
    libelleCompte: modele.compte.libelle,
  };
  const articles: ArticleStock[] = modele.articles.map((a) => ({
    id: `${modele.id}-${a.id}`,
    genre: GENRE_ARTICLE.PERSONNALISE,
    nom: a.nom,
    listeId: modele.id,
  }));
  return {
    ...archive,
    listes: [...(archive.listes ?? []), liste],
    articles: [...archive.articles, ...articles],
  };
}

/**
 * L'inventaire avec ses listes d'office de matières premières : « Matières alimentaires consommables » (compte 601400 : farine, œufs, huile d'olive…), utile aux
 * repas des formules d'agritourisme et aux plats préparés, et « Matières premières des savons » (compte 601410 : huiles, soude, beurres…). Chacune s'ajoute une seule
 * fois, à la première lecture : un drapeau retient qu'elle l'a été, donc une liste supprimée ensuite ne revient pas. Rien n'est écrit ici : elles s'enregistrent
 * avec la prochaine écriture du stock.
 */
export function avecListesDOffice(archive: ArchiveStock): ArchiveStock {
  let resultat = archive;
  if (!resultat.denreesAjoutees) resultat = { ...ajouter(resultat, DENREES), denreesAjoutees: true };
  if (!resultat.matieresSavonAjoutees) resultat = { ...ajouter(resultat, MATIERES_SAVON), matieresSavonAjoutees: true };
  return resultat;
}
