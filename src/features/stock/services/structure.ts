import { listComptesPcg } from '@/features/comptes-pcg/repository';
import { lireArchiveStock, remplacerArchiveStock } from '@/features/stock/repository';
import type { CategorieInventairePerso, ListeInventaire } from '@/features/stock/types';
import { idCategoriePerso, infosCategorie } from '@/features/stock/utils/categories';
import type { CompteComptable } from '@/shared/constants/planComptable';
import {
  CHIFFRES_CLASSE_CATEGORIE,
  CHIFFRES_COMPTE_PCG,
  CHIFFRES_MIN_PREFIXE_COMPTE,
  CLASSE_INVENTAIRE,
} from '@/shared/constants/stock';
import { generateId } from '@/shared/utils/id';

/** Vrai si le compte a bien 6 chiffres et commence par l'un des nombres que la catégorie autorise. */
export function compteAutorise(
  categorie: string,
  numero: string,
  ajoutees: CategorieInventairePerso[] = [],
): boolean {
  return (
    new RegExp(`^\\d{${CHIFFRES_COMPTE_PCG}}$`).test(numero) &&
    infosCategorie(categorie, ajoutees).prefixes.some((prefixe) => numero.startsWith(prefixe))
  );
}

/** Les comptes du plan comptable de l'utilisateur qu'une liste de cette catégorie peut avoir (triés par numéro). */
export async function comptesAutorises(categorie: string): Promise<CompteComptable[]> {
  const [comptes, archive] = await Promise.all([listComptesPcg(), lireArchiveStock()]);
  return comptes
    .filter((c) => compteAutorise(categorie, c.numero, archive.categories))
    .map(({ numero, libelle }) => ({ numero, libelle }));
}

/** Ajoute une liste à une catégorie : le compte doit être de ceux que la catégorie autorise, sinon rien n'est ajouté. */
export async function ajouterListe(
  categorie: string,
  nom: string,
  compte: CompteComptable,
): Promise<boolean> {
  const archive = await lireArchiveStock();
  if (!nom.trim() || !compteAutorise(categorie, compte.numero, archive.categories)) return false;
  const liste: ListeInventaire = {
    id: generateId(),
    categorie,
    nom: nom.trim(),
    compte: compte.numero,
    libelleCompte: compte.libelle,
  };
  await remplacerArchiveStock({ ...archive, listes: [...(archive.listes ?? []), liste] });
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

/** Supprime une liste avec ses articles et leurs mouvements. */
export async function supprimerListe(id: string): Promise<void> {
  const archive = await lireArchiveStock();
  await remplacerArchiveStock({ ...archive, ...sansLesListes(archive, new Set([id])) });
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

/** Contrôle une catégorie : un nom, une classe de 2 chiffres que nulle autre catégorie n'a, au moins un début de compte valable. */
export function controlerCategorie(
  donnees: DonneesCategorie,
  existantes: CategorieInventairePerso[],
  /** La catégorie qu'on modifie (sa classe n'est pas « déjà prise » par elle-même), et si ses comptes sont à contrôler. */
  modifiee?: string,
): ErreurCategorie | null {
  if (!donnees.nom.trim()) return 'nom';
  if (!new RegExp(`^\\d{${CHIFFRES_CLASSE_CATEGORIE}}$`).test(donnees.classe.trim())) return 'classe';
  const classe = donnees.classe.trim();
  const prises = [
    ...Object.values(CLASSE_INVENTAIRE),
    ...existantes.filter((c) => c.id !== modifiee).map((c) => c.classe),
  ];
  if (prises.includes(classe)) return 'classeUtilisee';
  if (!modifiee && analyserPrefixes(donnees.comptes).length === 0) return 'comptes';
  return null;
}

/** Ajoute une catégorie à l'inventaire : rend son identifiant (celui des listes qu'on y met), ou l'erreur à corriger. */
export async function ajouterCategorie(
  donnees: DonneesCategorie,
): Promise<{ categorie: string } | { erreur: ErreurCategorie }> {
  const archive = await lireArchiveStock();
  const erreur = controlerCategorie(donnees, archive.categories ?? []);
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

/** Renomme une catégorie ajoutée et change sa classe (ses comptes autorisés ne changent pas : ses listes les ont déjà). */
export async function modifierCategorie(
  categorie: string,
  donnees: Pick<DonneesCategorie, 'nom' | 'classe'>,
): Promise<ErreurCategorie | null> {
  const archive = await lireArchiveStock();
  const cible = (archive.categories ?? []).find((c) => idCategoriePerso(c) === categorie);
  if (!cible) return null;
  const erreur = controlerCategorie({ ...donnees, comptes: '' }, archive.categories ?? [], cible.id);
  if (erreur) return erreur;
  await remplacerArchiveStock({
    ...archive,
    categories: (archive.categories ?? []).map((c) =>
      c.id === cible.id ? { ...c, nom: donnees.nom.trim(), classe: donnees.classe.trim() } : c,
    ),
  });
  return null;
}

/** Supprime une catégorie ajoutée, avec ses listes, leurs articles et leurs mouvements. */
export async function supprimerCategorie(categorie: string): Promise<void> {
  const archive = await lireArchiveStock();
  const ids = new Set((archive.listes ?? []).filter((l) => l.categorie === categorie).map((l) => l.id));
  await remplacerArchiveStock({
    ...archive,
    ...sansLesListes(archive, ids),
    categories: (archive.categories ?? []).filter((c) => idCategoriePerso(c) !== categorie),
  });
}
