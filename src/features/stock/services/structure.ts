import { listComptesPcg } from '@/features/comptes-pcg/repository';
import { lireArchiveStock, remplacerArchiveStock } from '@/features/stock/repository';
import type { ListeInventaire } from '@/features/stock/types';
import type { CompteComptable } from '@/shared/constants/planComptable';
import {
  CHIFFRES_COMPTE_PCG,
  PREFIXES_COMPTE_PAR_CATEGORIE,
  type CATEGORIE_INVENTAIRE,
} from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { generateId } from '@/shared/utils/id';

type Categorie = ValeurDe<typeof CATEGORIE_INVENTAIRE>;

/** Vrai si le compte a bien 6 chiffres et commence par l'un des nombres que la catégorie autorise. */
export function compteAutorise(categorie: Categorie, numero: string): boolean {
  return (
    new RegExp(`^\\d{${CHIFFRES_COMPTE_PCG}}$`).test(numero) &&
    PREFIXES_COMPTE_PAR_CATEGORIE[categorie].some((prefixe) => numero.startsWith(prefixe))
  );
}

/** Les comptes du plan comptable de l'utilisateur qu'une liste de cette catégorie peut avoir (triés par numéro). */
export async function comptesAutorises(categorie: Categorie): Promise<CompteComptable[]> {
  const comptes = await listComptesPcg();
  return comptes
    .filter((c) => compteAutorise(categorie, c.numero))
    .map(({ numero, libelle }) => ({ numero, libelle }));
}

/** Ajoute une liste à une catégorie : le compte doit être de ceux que la catégorie autorise, sinon rien n'est ajouté. */
export async function ajouterListe(
  categorie: Categorie,
  nom: string,
  compte: CompteComptable,
): Promise<boolean> {
  if (!nom.trim() || !compteAutorise(categorie, compte.numero)) return false;
  const archive = await lireArchiveStock();
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

/** Supprime une liste avec ses articles et leurs mouvements. */
export async function supprimerListe(id: string): Promise<void> {
  const archive = await lireArchiveStock();
  const idsArticles = new Set(archive.articles.filter((a) => a.listeId === id).map((a) => a.id));
  await remplacerArchiveStock({
    ...archive,
    listes: (archive.listes ?? []).filter((l) => l.id !== id),
    articles: archive.articles.filter((a) => a.listeId !== id),
    mouvements: archive.mouvements.filter((m) => !idsArticles.has(m.article.split(':')[1])),
  });
}
