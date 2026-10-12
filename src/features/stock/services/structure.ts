import {
  listComptesPcg,
  retirerComptePourEspece,
  supprimerComptePcg,
} from '@/features/comptes-pcg/repository';
import { lireArchiveStock, remplacerArchiveStock } from '@/features/stock/repository';
import type {
  ArticleStock,
  CategorieInventairePerso,
  ListeInventaire,
  ReglageCategorie,
} from '@/features/stock/types';
import {
  SECTIONS,
  categoriesAvecAjoutees,
  idCategoriePerso,
  infosCategorie,
} from '@/features/stock/utils/categories';
import { COMPTE_PAR_SECTION_INVENTAIRE, type CompteComptable } from '@/shared/constants/planComptable';
import {
  CHIFFRES_CLASSE_CATEGORIE,
  CHIFFRES_COMPTE_PCG,
  CATEGORIE_INVENTAIRE,
  CHIFFRES_MIN_PREFIXE_COMPTE,
  GENRE_ARTICLE,
  SECTION_STOCK,
} from '@/shared/constants/stock';
import { generateId } from '@/shared/utils/id';

/** Vrai si le compte a bien 6 chiffres et commence par l'un des nombres que la catégorie autorise. */
export function compteAutorise(
  categorie: string,
  numero: string,
  ajoutees: CategorieInventairePerso[] = [],
  personnalises: Record<string, ReglageCategorie> = {},
): boolean {
  return (
    new RegExp(`^\\d{${CHIFFRES_COMPTE_PCG}}$`).test(numero) &&
    infosCategorie(categorie, ajoutees, personnalises).prefixes.some((prefixe) => numero.startsWith(prefixe))
  );
}

/** Les comptes du plan comptable de l'utilisateur qu'une liste de cette catégorie peut avoir (triés par numéro). */
export async function comptesAutorises(categorie: string): Promise<CompteComptable[]> {
  const [comptes, archive] = await Promise.all([listComptesPcg(), lireArchiveStock()]);
  return comptes
    .filter((c) => compteAutorise(categorie, c.numero, archive.categories, archive.reglagesCategories))
    .map(({ numero, libelle }) => ({ numero, libelle }));
}

/** Ajoute une liste à une catégorie : le compte doit être de ceux que la catégorie autorise, sinon rien n'est ajouté. */
export async function ajouterListe(
  categorie: string,
  nom: string,
  compte: CompteComptable,
): Promise<boolean> {
  const archive = await lireArchiveStock();
  if (
    !nom.trim() ||
    !compteAutorise(categorie, compte.numero, archive.categories, archive.reglagesCategories)
  )
    return false;
  const liste: ListeInventaire = {
    id: generateId(),
    categorie,
    nom: nom.trim(),
    compte: compte.numero,
    libelleCompte: compte.libelle,
  };
  // Le premier article porte le nom de la liste : elle se compte tout de suite (on en ajoute d'autres, ou on le renomme).
  const article: ArticleStock = {
    id: generateId(),
    genre: GENRE_ARTICLE.PERSONNALISE,
    nom: liste.nom,
    listeId: liste.id,
  };
  await remplacerArchiveStock({
    ...archive,
    listes: [...(archive.listes ?? []), liste],
    articles: [...archive.articles, article],
  });
  return true;
}

/** Les listes de l'inventaire qui ont ce compte (un compte inventorié en a une). */
export const listesDuCompte = (archive: Awaited<ReturnType<typeof lireArchiveStock>>, numero: string) =>
  (archive.listes ?? []).filter((l) => l.compte === numero);

/** Le compte d'un compte inventorié a changé de numéro ou de libellé : ses listes le suivent. */
export async function suivreLeCompte(ancienNumero: string, compte: CompteComptable): Promise<void> {
  const archive = await lireArchiveStock();
  if (listesDuCompte(archive, ancienNumero).length === 0) return;
  await remplacerArchiveStock({
    ...archive,
    listes: (archive.listes ?? []).map((l) =>
      l.compte === ancienNumero ? { ...l, compte: compte.numero, libelleCompte: compte.libelle } : l,
    ),
  });
}

/**
 * Le compte est retiré pour une espèce : ses listes (ajoutées et d'office) sont retirées de l'inventaire de cette espèce, avec ses
 * articles propres (ceux tenus pour elle seule) et leurs mouvements. Les autres espèces gardent leurs listes.
 */
export async function retirerDeLInventairePourEspece(numero: string, espece: string): Promise<void> {
  const archive = await lireArchiveStock();
  const listes = listesDuCompte(archive, numero);
  const ids = new Set(listes.map((l) => l.id));
  const articlesRetires = new Set(
    archive.articles.filter((a) => a.listeId && ids.has(a.listeId) && a.activite === espece).map((a) => a.id),
  );
  const sections = Object.entries(COMPTE_PAR_SECTION_INVENTAIRE)
    .filter(([, c]) => c.numero === numero)
    .map(([section]) => section);
  const sectionsMasquees = { ...(archive.sectionsMasquees ?? {}) };
  for (const section of sections) {
    sectionsMasquees[section] = [...new Set([...(sectionsMasquees[section] ?? []), espece])];
  }
  await remplacerArchiveStock({
    ...archive,
    listes: (archive.listes ?? []).map((l) =>
      ids.has(l.id) ? { ...l, masquePour: [...new Set([...(l.masquePour ?? []), espece])] } : l,
    ),
    articles: archive.articles.filter((a) => !articlesRetires.has(a.id)),
    mouvements: archive.mouvements.filter((m) => !articlesRetires.has(m.article.split(':')[1])),
    sectionsMasquees,
  });
}

/** Le compte est rétabli pour toutes les espèces : ses listes reviennent dans l'inventaire (les articles retirés ne reviennent pas). */
export async function retablirDansLInventaire(numero: string): Promise<void> {
  const archive = await lireArchiveStock();
  const sections = Object.entries(COMPTE_PAR_SECTION_INVENTAIRE)
    .filter(([, c]) => c.numero === numero)
    .map(([section]) => section);
  await remplacerArchiveStock({
    ...archive,
    listes: (archive.listes ?? []).map((l) => (l.compte === numero ? { ...l, masquePour: undefined } : l)),
    sectionsMasquees: Object.fromEntries(
      Object.entries(archive.sectionsMasquees ?? {}).filter(([section]) => !sections.includes(section)),
    ),
  });
}

/** Vrai quand des mouvements sont enregistrés sur les articles de ces listes (ceux tenus pour l'espèce seule, quand elle est donnée). */
function listesAvecMouvements(
  archive: Awaited<ReturnType<typeof lireArchiveStock>>,
  ids: Set<string>,
  espece?: string,
): boolean {
  const avecMouvement = new Set(archive.mouvements.map((m) => m.article.split(':')[1]));
  return archive.articles.some(
    (a) => a.listeId && ids.has(a.listeId) && (!espece || a.activite === espece) && avecMouvement.has(a.id),
  );
}

/** Vrai quand des mouvements sont enregistrés sur les listes d'office de ce compte (pour l'espèce, ceux de ses articles propres). */
function mouvementsDesListesDOffice(
  archive: Awaited<ReturnType<typeof lireArchiveStock>>,
  numero: string,
  espece?: string,
): boolean {
  return SECTIONS.filter((x) => COMPTE_PAR_SECTION_INVENTAIRE[x.section].numero === numero).some((x) =>
    x.section === SECTION_STOCK.LAIT
      ? !espece && (archive.lait ?? []).length > 0
      : !!x.genre &&
        archive.mouvements.some(
          (m) => m.article.startsWith(`${x.genre}:`) && (!espece || m.article.includes(`:${espece}_`)),
        ),
  );
}

/**
 * Vrai quand l'inventaire de ce compte a des mouvements enregistrés (sur ses listes ajoutées ou d'office) : le compte ne peut alors ni
 * être supprimé ni quitter l'inventaire. Avec une espèce, seuls comptent les articles tenus pour elle.
 */
export async function compteAvecMouvements(numero: string, espece?: string): Promise<boolean> {
  const archive = await lireArchiveStock();
  const ids = new Set(listesDuCompte(archive, numero).map((l) => l.id));
  return listesAvecMouvements(archive, ids, espece) || mouvementsDesListesDOffice(archive, numero, espece);
}

/** Un compte n'est plus inventorié : ses listes sont retirées de l'inventaire, avec leurs articles et leurs mouvements. */
export async function retirerDeLInventaire(numero: string): Promise<boolean> {
  const archive = await lireArchiveStock();
  const ids = new Set(listesDuCompte(archive, numero).map((l) => l.id));
  if (listesAvecMouvements(archive, ids)) return false;
  if (ids.size > 0) await remplacerArchiveStock({ ...archive, ...sansLesListes(archive, ids) });
  return true;
}

/** Renomme une liste. */
export async function renommerListe(id: string, nom: string): Promise<void> {
  if (!nom.trim()) return;
  const archive = await lireArchiveStock();
  await remplacerArchiveStock({
    ...archive,
    listes: (archive.listes ?? []).map((l) => (l.id === id ? { ...l, nom: nom.trim() } : l)),
  });
}

/** Retire des articles et des mouvements ceux des listes données. */
function sansLesListes(archive: Awaited<ReturnType<typeof lireArchiveStock>>, ids: Set<string>) {
  const idsArticles = new Set(
    archive.articles.filter((a) => a.listeId && ids.has(a.listeId)).map((a) => a.id),
  );
  return {
    listes: (archive.listes ?? []).filter((l) => !ids.has(l.id)),
    articles: archive.articles.filter((a) => !(a.listeId && ids.has(a.listeId))),
    mouvements: archive.mouvements.filter((m) => !idsArticles.has(m.article.split(':')[1])),
  };
}

/**
 * Vrai quand une autre liste de l'inventaire (ajoutée ou d'office) utilise encore ce compte, pour l'espèce donnée (ou pour une espèce
 * quelconque, sans espèce) : il faut alors le garder dans le plan comptable.
 */
function compteEncoreUtilise(
  archive: Awaited<ReturnType<typeof lireArchiveStock>>,
  numero: string,
  sauf: Set<string>,
  espece?: string,
): boolean {
  const pourEspece = (masque?: string[]) => !espece || !(masque ?? []).includes(espece);
  const parUneListe = (archive.listes ?? []).some(
    (l) => l.compte === numero && !sauf.has(l.id) && pourEspece(l.masquePour),
  );
  const parUneListeDOffice = Object.entries(COMPTE_PAR_SECTION_INVENTAIRE).some(
    ([section, c]) => c.numero === numero && pourEspece(archive.sectionsMasquees?.[section]),
  );
  return parUneListe || parUneListeDOffice;
}

/** Le compte du plan comptable d'une liste supprimée : retiré pour l'espèce, ou supprimé, quand plus aucune liste ne l'utilise. */
async function suivreLaSuppressionDuCompte(
  archive: Awaited<ReturnType<typeof lireArchiveStock>>,
  listes: ListeInventaire[],
  espece?: string,
): Promise<void> {
  const comptes = await listComptesPcg();
  const ids = new Set(listes.map((l) => l.id));
  for (const numero of new Set(listes.map((l) => l.compte))) {
    if (compteEncoreUtilise(archive, numero, ids, espece)) continue;
    for (const compte of comptes.filter((c) => c.numero === numero)) {
      if (espece) await retirerComptePourEspece(compte.id, espece);
      else await supprimerComptePcg(compte.id);
    }
  }
}

/**
 * Supprime une liste avec ses articles et leurs mouvements, et le compte du plan comptable qu'elle portait quand plus rien ne l'utilise.
 * Avec une espèce, la liste n'est retirée que pour elle (avec ses articles propres) : les autres espèces la gardent.
 */
export async function supprimerListe(id: string, espece?: string): Promise<boolean> {
  const archive = await lireArchiveStock();
  const liste = (archive.listes ?? []).find((l) => l.id === id);
  if (!liste) return true;
  // Des mouvements sont enregistrés sur ses articles : on ne la supprime pas.
  if (listesAvecMouvements(archive, new Set([id]), espece)) return false;
  if (espece) {
    const articlesRetires = new Set(
      archive.articles.filter((a) => a.listeId === id && a.activite === espece).map((a) => a.id),
    );
    await remplacerArchiveStock({
      ...archive,
      listes: (archive.listes ?? []).map((l) =>
        l.id === id ? { ...l, masquePour: [...new Set([...(l.masquePour ?? []), espece])] } : l,
      ),
      articles: archive.articles.filter((a) => !articlesRetires.has(a.id)),
      mouvements: archive.mouvements.filter((m) => !articlesRetires.has(m.article.split(':')[1])),
    });
  } else {
    await remplacerArchiveStock({ ...archive, ...sansLesListes(archive, new Set([id])) });
  }
  await suivreLaSuppressionDuCompte(archive, [liste], espece);
  return true;
}

/** Les débuts de compte saisis (« 701, 706 ») : de 2 à 6 chiffres, sans doublon ; vide si l'un d'eux n'est pas valable. */
export function analyserPrefixes(texte: string): string[] {
  const morceaux = texte.split(/[\s,;]+/).filter(Boolean);
  const valables = morceaux.every((p) =>
    new RegExp(`^\\d{${CHIFFRES_MIN_PREFIXE_COMPTE},${CHIFFRES_COMPTE_PCG}}$`).test(p),
  );
  return valables ? [...new Set(morceaux)] : [];
}

/** Ce qui ne va pas dans une catégorie à ajouter (ou à modifier), sinon rien. */
export type ErreurCategorie = 'nom' | 'classe' | 'classeUtilisee' | 'comptes';

export interface DonneesCategorie {
  nom: string;
  classe: string;
  /** Les débuts de compte saisis (« 701, 706 »), séparés par des virgules. */
  comptes: string;
}

/** Les numéros de classe des autres catégories (celles d'office, personnalisées ou non, et celles ajoutées). */
function classesDesAutres(
  archive: Awaited<ReturnType<typeof lireArchiveStock>>,
  categorie?: string,
): string[] {
  const base = Object.values(CATEGORIE_INVENTAIRE).map((c) => ({ categorie: c, nom: '' }));
  return categoriesAvecAjoutees(base, archive.categories ?? [], archive.reglagesCategories ?? {})
    .filter((c) => c.categorie !== categorie)
    .map((c) => c.classe);
}

/** Contrôle une catégorie : un nom, une classe de 2 chiffres que nulle autre catégorie n'a, et (si demandé) un début de compte valable. */
export function controlerCategorie(
  donnees: DonneesCategorie,
  /** Les classes des autres catégories. */
  classesPrises: string[],
  avecComptes: boolean,
): ErreurCategorie | null {
  if (!donnees.nom.trim()) return 'nom';
  if (!new RegExp(`^\\d{${CHIFFRES_CLASSE_CATEGORIE}}$`).test(donnees.classe.trim())) return 'classe';
  if (classesPrises.includes(donnees.classe.trim())) return 'classeUtilisee';
  if (avecComptes && analyserPrefixes(donnees.comptes).length === 0) return 'comptes';
  return null;
}

/** Ajoute une catégorie à l'inventaire : rend son identifiant (celui des listes qu'on y met), ou l'erreur à corriger. */
export async function ajouterCategorie(
  donnees: DonneesCategorie,
): Promise<{ categorie: string } | { erreur: ErreurCategorie }> {
  const archive = await lireArchiveStock();
  const erreur = controlerCategorie(donnees, classesDesAutres(archive), true);
  if (erreur) return { erreur };
  const categorie: CategorieInventairePerso = {
    id: generateId(),
    nom: donnees.nom.trim(),
    classe: donnees.classe.trim(),
    prefixes: analyserPrefixes(donnees.comptes),
  };
  await remplacerArchiveStock({ ...archive, categories: [...(archive.categories ?? []), categorie] });
  return { categorie: idCategoriePerso(categorie) };
}

/**
 * Change le nom, le numéro de classe et les débuts de compte d'une catégorie, d'office ou ajoutée (les listes déjà faites ne
 * bougent pas). Pour une catégorie d'office, seul ce qui diffère de l'origine est gardé : tout remettre à l'origine efface le
 * réglage.
 */
export async function modifierCategorie(
  categorie: string,
  donnees: Pick<DonneesCategorie, 'nom' | 'classe'> & { comptes?: string },
): Promise<ErreurCategorie | null> {
  const archive = await lireArchiveStock();
  const erreur = controlerCategorie(
    { ...donnees, comptes: donnees.comptes ?? '' },
    classesDesAutres(archive, categorie),
    false,
  );
  if (erreur) return erreur;
  const actuelle = infosCategorie(categorie, archive.categories, archive.reglagesCategories);
  // Sans débuts de compte donnés, ceux de la catégorie ne changent pas.
  const prefixes = donnees.comptes === undefined ? [...actuelle.prefixes] : analyserPrefixes(donnees.comptes);
  if (prefixes.length === 0) return 'comptes';
  const nom = donnees.nom.trim();
  const classe = donnees.classe.trim();

  const perso = (archive.categories ?? []).find((c) => idCategoriePerso(c) === categorie);
  if (perso) {
    await remplacerArchiveStock({
      ...archive,
      categories: (archive.categories ?? []).map((c) =>
        c.id === perso.id ? { ...c, nom, classe, prefixes } : c,
      ),
    });
    return null;
  }
  const origine = infosCategorie(categorie);
  const reglage: ReglageCategorie = {};
  if (nom !== origine.nom) reglage.nom = nom;
  if (classe !== origine.classe) reglage.classe = classe;
  if (prefixes.length !== origine.prefixes.length || !prefixes.every((p) => origine.prefixes.includes(p))) {
    reglage.prefixes = prefixes;
  }
  const reglages = { ...(archive.reglagesCategories ?? {}) };
  if (Object.keys(reglage).length === 0) delete reglages[categorie];
  else reglages[categorie] = reglage;
  await remplacerArchiveStock({ ...archive, reglagesCategories: reglages });
  return null;
}

/** Supprime une catégorie ajoutée, avec ses listes, leurs articles et leurs mouvements. */
export async function supprimerCategorie(categorie: string): Promise<boolean> {
  const archive = await lireArchiveStock();
  const listes = (archive.listes ?? []).filter((l) => l.categorie === categorie);
  const ids = new Set(listes.map((l) => l.id));
  // Des mouvements sont enregistrés sur les articles de ses listes : on ne la supprime pas.
  if (listesAvecMouvements(archive, ids)) return false;
  await remplacerArchiveStock({
    ...archive,
    ...sansLesListes(archive, ids),
    categories: (archive.categories ?? []).filter((c) => idCategoriePerso(c) !== categorie),
  });
  // Les comptes de ses listes, quand plus aucune liste ne les utilise, quittent aussi le plan comptable.
  await suivreLaSuppressionDuCompte(archive, listes);
  return true;
}
