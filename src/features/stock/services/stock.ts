import type { TypeFromage, Vente } from '@/features/comptabilite/types';
import { lireArchiveStock, remplacerArchiveStock } from '@/features/stock/repository';
import type { ArchiveStock, GenreArticle, MouvementStock } from '@/features/stock/types';
import { CATEGORIE_VENTE, TYPE_FROMAGE, UNITE_VENTE } from '@/shared/constants/comptabilite';
import {
  ARTICLE_EMBALLAGE,
  ARTICLE_MATERIEL,
  CONDITIONNEMENT_PAR_DEFAUT,
  GENRE_ARTICLE,
  ORIGINE_MOUVEMENT,
} from '@/shared/constants/stock';
import { LABEL_EMBALLAGE, LABEL_MATERIEL, LABEL_TYPE_FROMAGE } from '@/shared/textes/libelles';
import { generateId } from '@/shared/utils/id';

/** L'identifiant d'un article de stock : son genre puis son code (« fromage:frais », « emballage:sac_plastique »). */
export const cleArticle = (genre: GenreArticle, code: string): string => `${genre}:${code}`;

/** Un article tel qu'on l'affiche : son identifiant, son nom et s'il a été ajouté par l'utilisateur. */
export interface ArticleAffiche {
  cle: string;
  libelle: string;
  /** Présent pour un article ajouté par l'utilisateur (le seul qu'on puisse supprimer). */
  id?: string;
}

/** Les articles d'un genre : ceux d'office, puis ceux que l'utilisateur a ajoutés. */
export function articlesDuGenre(genre: GenreArticle, archive: ArchiveStock): ArticleAffiche[] {
  const parDefaut: ArticleAffiche[] =
    genre === GENRE_ARTICLE.FROMAGE
      ? Object.values(TYPE_FROMAGE).map((code) => ({
          cle: cleArticle(genre, code),
          libelle: archive.noms[cleArticle(genre, code)] ?? LABEL_TYPE_FROMAGE[code],
        }))
      : genre === GENRE_ARTICLE.EMBALLAGE
        ? Object.values(ARTICLE_EMBALLAGE).map((code) => ({
            cle: cleArticle(genre, code),
            libelle: archive.noms[cleArticle(genre, code)] ?? LABEL_EMBALLAGE[code],
          }))
        : Object.values(ARTICLE_MATERIEL).map((code) => ({
            cle: cleArticle(genre, code),
            libelle: archive.noms[cleArticle(genre, code)] ?? LABEL_MATERIEL[code],
          }));
  const ajoutes = archive.articles
    .filter((a) => a.genre === genre)
    .map((a) => ({ cle: cleArticle(genre, a.id), libelle: a.nom, id: a.id }));
  const tous = [...parDefaut, ...ajoutes];
  // L'ordre choisi d'abord ; les articles qu'il ne cite pas suivent, dans l'ordre d'office.
  const ordre = archive.ordres[genre] ?? [];
  const rang = (a: ArticleAffiche) => {
    const i = ordre.indexOf(a.cle);
    return i >= 0 ? i : ordre.length + tous.indexOf(a);
  };
  return [...tous].sort((a, b) => rang(a) - rang(b));
}

/** Le nom d'un article d'après son identifiant (« fromage:frais » → « Frais »). */
export function libelleArticle(cle: string, archive: ArchiveStock): string {
  const [genre, code] = cle.split(':') as [GenreArticle, string];
  return articlesDuGenre(genre, archive).find((a) => a.cle === cle)?.libelle ?? code;
}

/** Le niveau de chaque article : la somme de ses mouvements (négatif si on a vendu plus qu'on n'avait noté). */
export function niveauxDeStock(mouvements: MouvementStock[]): Map<string, number> {
  const niveaux = new Map<string, number>();
  for (const m of mouvements) niveaux.set(m.article, (niveaux.get(m.article) ?? 0) + m.delta);
  return niveaux;
}

/**
 * Les emballages consommés par fromage vendu : ceux choisis, sinon ceux d'office pour ce type de fromage (aucun pour un
 * fromage ajouté). `code` est le code d'un type de fromage ou l'identifiant d'un fromage ajouté.
 */
export function conditionnementDe(code: string, archive: ArchiveStock): string[] {
  return archive.conditionnements[code] ?? [...(CONDITIONNEMENT_PAR_DEFAUT[code as TypeFromage] ?? [])];
}

/**
 * Le fromage d'une vente dans le stock : son type, ou, pour « autre », le fromage ajouté dont le nom est celui noté dans
 * la vente (sinon « autre »).
 */
export function codeFromageDeLaVente(vente: Vente, archive: ArchiveStock): string | undefined {
  if (!vente.typeFromage) return undefined;
  if (vente.typeFromage !== TYPE_FROMAGE.AUTRE || !vente.typeFromageLibre) return vente.typeFromage;
  const nom = vente.typeFromageLibre.trim().toLowerCase();
  const ajoute = archive.articles.find(
    (a) => a.genre === GENRE_ARTICLE.FROMAGE && a.nom.trim().toLowerCase() === nom,
  );
  return ajoute?.id ?? vente.typeFromage;
}

/** Le nombre de fromages d'une vente : sa quantité (les fromages se vendent à la pièce ; au poids, rien n'est décompté). */
export function fromagesVendus(vente: Vente): number {
  return vente.unite === UNITE_VENTE.PIECE ? Math.round(vente.quantite) : 0;
}

/**
 * Ce que la vente d'un fromage consomme : le fromage lui-même, les emballages de son conditionnement et les sacs en
 * plastique indiqués dans la vente. Rien pour une autre vente.
 */
export function consommationDeLaVente(
  vente: Vente,
  archive: ArchiveStock,
): { article: string; quantite: number }[] {
  const fromage = codeFromageDeLaVente(vente, archive);
  if (vente.categorie !== CATEGORIE_VENTE.FROMAGE || !fromage) return [];
  const nombre = fromagesVendus(vente);
  if (nombre <= 0) return [];

  const lignes = [{ article: cleArticle(GENRE_ARTICLE.FROMAGE, fromage), quantite: nombre }];
  for (const code of conditionnementDe(fromage, archive)) {
    lignes.push({ article: cleArticle(GENRE_ARTICLE.EMBALLAGE, code), quantite: nombre });
  }
  if ((vente.sacs ?? 0) > 0) {
    lignes.push({
      article: cleArticle(GENRE_ARTICLE.EMBALLAGE, ARTICLE_EMBALLAGE.SAC_PLASTIQUE),
      quantite: vente.sacs!,
    });
  }
  return lignes;
}

/** Met le stock à jour pour une vente créée ou modifiée : ses anciens mouvements sont remplacés par les nouveaux. */
export async function synchroniserStockVente(vente: Vente): Promise<void> {
  const archive = await lireArchiveStock();
  const autres = archive.mouvements.filter((m) => m.venteId !== vente.id);
  const nouveaux: MouvementStock[] = consommationDeLaVente(vente, archive).map(({ article, quantite }) => ({
    id: generateId(),
    article,
    date: vente.date,
    delta: -quantite,
    origine: ORIGINE_MOUVEMENT.VENTE,
    venteId: vente.id,
  }));
  if (nouveaux.length === 0 && autres.length === archive.mouvements.length) return;
  await remplacerArchiveStock({ ...archive, mouvements: [...autres, ...nouveaux] });
}

/** Rend au stock ce qu'une vente supprimée avait consommé. */
export async function retirerStockVente(venteId: string): Promise<void> {
  const archive = await lireArchiveStock();
  const restants = archive.mouvements.filter((m) => m.venteId !== venteId);
  if (restants.length !== archive.mouvements.length) {
    await remplacerArchiveStock({ ...archive, mouvements: restants });
  }
}

/**
 * Ajoute (quantité positive) ou retire (négative) des unités d'un article, à la main : production, achat, casse…
 * Pour des fromages fabriqués, on peut noter les litres de lait qu'il a fallu.
 */
export async function ajouterMouvementManuel(
  article: string,
  delta: number,
  date: string,
  litres?: number,
): Promise<void> {
  const archive = await lireArchiveStock();
  await remplacerArchiveStock({
    ...archive,
    mouvements: [
      ...archive.mouvements,
      { id: generateId(), article, date, delta, origine: ORIGINE_MOUVEMENT.MANUEL, litres },
    ],
  });
}

/** Ajoute un article (fromage, emballage ou matériel) avec le nom choisi. */
export async function ajouterArticle(genre: GenreArticle, nom: string): Promise<void> {
  const archive = await lireArchiveStock();
  await remplacerArchiveStock({
    ...archive,
    articles: [...archive.articles, { id: generateId(), genre, nom: nom.trim() }],
  });
}

/** Supprime un article ajouté par l'utilisateur, ses mouvements, et son nom dans les conditionnements. */
export async function supprimerArticle(id: string): Promise<void> {
  const archive = await lireArchiveStock();
  const conditionnements: ArchiveStock['conditionnements'] = {};
  for (const [code, emballages] of Object.entries(archive.conditionnements)) {
    if (code !== id) conditionnements[code] = emballages.filter((e) => e !== id);
  }
  const ordres: ArchiveStock['ordres'] = {};
  for (const [genre, cles] of Object.entries(archive.ordres)) {
    ordres[genre as GenreArticle] = (cles ?? []).filter((cle) => cle.split(':')[1] !== id);
  }
  await remplacerArchiveStock({
    mouvements: archive.mouvements.filter((m) => m.article.split(':')[1] !== id),
    articles: archive.articles.filter((a) => a.id !== id),
    conditionnements,
    ordres,
    noms: archive.noms,
  });
}

/** Change le nom d'un article : celui d'un article ajouté, ou le nom affiché d'un article d'office. */
export async function renommerArticle(cle: string, nom: string): Promise<void> {
  const archive = await lireArchiveStock();
  const id = cle.split(':')[1];
  if (archive.articles.some((a) => a.id === id)) {
    await remplacerArchiveStock({
      ...archive,
      articles: archive.articles.map((a) => (a.id === id ? { ...a, nom: nom.trim() } : a)),
    });
  } else {
    await remplacerArchiveStock({ ...archive, noms: { ...archive.noms, [cle]: nom.trim() } });
  }
}

/** Choisit les emballages consommés par fromage vendu pour un fromage (son code, ou l'identifiant d'un fromage ajouté). */
export async function definirConditionnement(code: string, emballages: string[]): Promise<void> {
  const archive = await lireArchiveStock();
  await remplacerArchiveStock({
    ...archive,
    conditionnements: { ...archive.conditionnements, [code]: emballages },
  });
}

/** Place un article à un index précis de la liste de son genre (après l'avoir glissé à cet endroit). */
export async function positionnerArticle(
  genre: GenreArticle,
  cle: string,
  nouvelIndex: number,
): Promise<void> {
  const archive = await lireArchiveStock();
  const cles = articlesDuGenre(genre, archive).map((a) => a.cle);
  const index = cles.indexOf(cle);
  if (index < 0 || nouvelIndex < 0 || nouvelIndex >= cles.length) return;
  cles.splice(nouvelIndex, 0, ...cles.splice(index, 1));
  await remplacerArchiveStock({ ...archive, ordres: { ...archive.ordres, [genre]: cles } });
}

/** Le lait utilisé pour les fabrications d'un fromage sur une année : par fromage, et mois par mois. */
export interface StatistiqueLait {
  /** Litres de lait par fromage sur l'année. */
  litresParFromage: number;
  litres: number;
  fromages: number;
  /** Litres par fromage pour chaque mois (janvier = index 0) ; absent quand rien n'a été fabriqué ce mois-là. */
  parMois: (number | undefined)[];
}

/**
 * Le lait qu'il a fallu par fromage, d'après les fabrications notées dans le stock avec leurs litres (un ajout de fromages
 * et les litres de lait utilisés). Pour le brocciu, les litres sont ceux versés dans le lactosérum. Absent sans donnée.
 */
export function statistiqueLait(
  mouvements: MouvementStock[],
  cle: string,
  annee: number,
): StatistiqueLait | undefined {
  const fabrications = mouvements.filter(
    (m) =>
      m.article === cle &&
      m.origine === ORIGINE_MOUVEMENT.MANUEL &&
      m.delta > 0 &&
      (m.litres ?? 0) > 0 &&
      m.date.startsWith(String(annee)),
  );
  const somme = (liste: MouvementStock[], champ: 'litres' | 'delta') =>
    liste.reduce((total, m) => total + (m[champ] ?? 0), 0);
  const litres = somme(fabrications, 'litres');
  const fromages = somme(fabrications, 'delta');
  if (fromages <= 0) return undefined;
  const arrondi = (nombre: number) => Math.round(nombre * 100) / 100;
  return {
    litres,
    fromages,
    litresParFromage: arrondi(litres / fromages),
    parMois: Array.from({ length: 12 }, (_, mois) => {
      const duMois = fabrications.filter((m) => Number(m.date.slice(5, 7)) === mois + 1);
      const fromagesDuMois = somme(duMois, 'delta');
      return fromagesDuMois > 0 ? arrondi(somme(duMois, 'litres') / fromagesDuMois) : undefined;
    }),
  };
}
