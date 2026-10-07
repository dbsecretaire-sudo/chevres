import AsyncStorage from '@react-native-async-storage/async-storage';
import { cleStockage } from '@/features/etablissements/repository';
import type {
  ActiviteAnnexe,
  ArchiveAnnexes,
  ArticleAnnexe,
  CategorieAnnexe,
  TicketAnnexe,
} from '@/features/annexes/types';
import { ACTIVITES_ANNEXES_PAR_DEFAUT, ID_ACTIVITE_BAR_FUSIONNEE } from '@/shared/constants/annexes';
import { COMPTE_PAR_RECETTE } from '@/shared/constants/planComptable';
import { CLE_STOCKAGE } from '@/shared/constants/stockage';
import { TEXTES } from '@/shared/textes';
import { generateId } from '@/shared/utils/id';

const cle = () => cleStockage(CLE_STOCKAGE.ANNEXES);

/** Remet une archive lue (ou reçue d'une sauvegarde) dans sa forme : rien ne manque. */
export function normaliserArchiveAnnexes(archive: Partial<ArchiveAnnexes> | undefined): ArchiveAnnexes {
  return {
    initialisee: archive?.initialisee,
    activites: Array.isArray(archive?.activites) ? archive.activites : [],
    categories: Array.isArray(archive?.categories) ? archive.categories : [],
    articles: Array.isArray(archive?.articles) ? archive.articles : [],
    tickets: Array.isArray(archive?.tickets) ? archive.tickets : [],
  };
}

/**
 * Les activités d'office, créées la première fois : le bar et le restaurant, avec leur compte de recette et leur TVA (identifiants
 * fixes, pour que deux lectures simultanées ne les créent pas en double).
 */
function activitesDOffice(): ActiviteAnnexe[] {
  return ACTIVITES_ANNEXES_PAR_DEFAUT.map((a) => ({
    id: a.id,
    nom: TEXTES.annexes.parDefaut[a.cleNom],
    icone: a.icone,
    compte: COMPTE_PAR_RECETTE[a.categorieRecette].numero,
    tauxTva: a.tauxTva,
    repasGite: a.repasGite,
  }));
}

/** Les activités annexes de l'établissement actif ; « Bar et restaurant » s'y trouve d'office la première fois. */
export async function lireArchiveAnnexes(): Promise<ArchiveAnnexes> {
  const raw = await AsyncStorage.getItem(cle());
  let archive = normaliserArchiveAnnexes(undefined);
  try {
    if (raw) archive = normaliserArchiveAnnexes(JSON.parse(raw));
  } catch {
    archive = normaliserArchiveAnnexes(undefined);
  }
  // Le bar et le restaurant n'en font plus qu'une : les catégories, les articles et les tickets du bar passent au restaurant.
  const fusion =
    archive.activites.some((a) => a.id === ID_ACTIVITE_BAR_FUSIONNEE) &&
    archive.activites.some((a) => a.id === ACTIVITES_ANNEXES_PAR_DEFAUT[0].id);
  if (fusion) {
    const vers = ACTIVITES_ANNEXES_PAR_DEFAUT[0].id;
    const deplacer = <T extends { activiteId: string }>(x: T): T =>
      x.activiteId === ID_ACTIVITE_BAR_FUSIONNEE ? { ...x, activiteId: vers } : x;
    archive = {
      ...archive,
      activites: archive.activites
        .filter((a) => a.id !== ID_ACTIVITE_BAR_FUSIONNEE)
        .map((a) =>
          a.id === vers && a.nom === TEXTES.annexes.parDefaut.ancienRestaurant
            ? { ...a, nom: TEXTES.annexes.parDefaut.barRestaurant }
            : a,
        ),
      categories: archive.categories.map(deplacer),
      articles: archive.articles.map(deplacer),
      tickets: archive.tickets.map(deplacer),
    };
    await AsyncStorage.setItem(cle(), JSON.stringify(archive));
  }
  // Les activités d'office créées avant le calendrier des repas (le restaurant) le reçoivent : on le coche ou le décoche ensuite.
  archive = {
    ...archive,
    activites: archive.activites.map((a) => {
      const defaut = ACTIVITES_ANNEXES_PAR_DEFAUT.find((d) => d.id === a.id);
      return defaut && a.repasGite === undefined ? { ...a, repasGite: defaut.repasGite } : a;
    }),
  };
  if (archive.initialisee) return archive;
  // Un établissement qui avait déjà ses propres activités garde les siennes ; les deux d'office s'y ajoutent une seule fois.
  const presentes = new Set(archive.activites.map((a) => a.id));
  archive = {
    ...archive,
    initialisee: true,
    activites: [...activitesDOffice().filter((a) => !presentes.has(a.id)), ...archive.activites],
  };
  await AsyncStorage.setItem(cle(), JSON.stringify(archive));
  return archive;
}

/** Remplace tout — utilisé par la restauration d'une sauvegarde et le tirage depuis Google Drive. */
export async function remplacerArchiveAnnexes(archive: ArchiveAnnexes): Promise<void> {
  await AsyncStorage.setItem(cle(), JSON.stringify(archive));
}

async function modifier(transformer: (archive: ArchiveAnnexes) => ArchiveAnnexes): Promise<void> {
  await remplacerArchiveAnnexes(transformer(await lireArchiveAnnexes()));
}

// --- Activités

/** Crée une activité (ou modifie celle dont l'identifiant est donné) ; renvoie son identifiant. */
export async function enregistrerActivite(
  activite: Omit<ActiviteAnnexe, 'id'> & { id?: string },
): Promise<string> {
  const id = activite.id ?? generateId();
  const complete: ActiviteAnnexe = { ...activite, id, nom: activite.nom.trim() };
  await modifier((a) => ({
    ...a,
    activites: a.activites.some((x) => x.id === id)
      ? a.activites.map((x) => (x.id === id ? complete : x))
      : [...a.activites, complete],
  }));
  return id;
}

/** Supprime une activité avec ses catégories, ses articles et ses tickets en cours. */
export async function supprimerActivite(id: string): Promise<void> {
  await modifier((a) => ({
    ...a,
    activites: a.activites.filter((x) => x.id !== id),
    categories: a.categories.filter((x) => x.activiteId !== id),
    articles: a.articles.filter((x) => x.activiteId !== id),
    tickets: a.tickets.filter((x) => x.activiteId !== id),
  }));
}

// --- Catégories

export async function enregistrerCategorie(
  categorie: Omit<CategorieAnnexe, 'id'> & { id?: string },
): Promise<void> {
  const id = categorie.id ?? generateId();
  const complete: CategorieAnnexe = { ...categorie, id, nom: categorie.nom.trim() };
  await modifier((a) => ({
    ...a,
    categories: a.categories.some((x) => x.id === id)
      ? a.categories.map((x) => (x.id === id ? complete : x))
      : [...a.categories, complete],
  }));
}

/** Supprime une catégorie : ses articles restent, sans catégorie. */
export async function supprimerCategorie(id: string): Promise<void> {
  await modifier((a) => ({
    ...a,
    categories: a.categories.filter((x) => x.id !== id),
    articles: a.articles.map((x) => (x.categorieId === id ? { ...x, categorieId: undefined } : x)),
  }));
}

// --- Articles

export async function enregistrerArticle(
  article: Omit<ArticleAnnexe, 'id'> & { id?: string },
): Promise<void> {
  const id = article.id ?? generateId();
  const complet: ArticleAnnexe = { ...article, id, nom: article.nom.trim() };
  await modifier((a) => ({
    ...a,
    articles: a.articles.some((x) => x.id === id)
      ? a.articles.map((x) => (x.id === id ? complet : x))
      : [...a.articles, complet],
  }));
}

/** Supprime un article, et le retire des tickets en cours. */
export async function supprimerArticle(id: string): Promise<void> {
  await modifier((a) => ({
    ...a,
    articles: a.articles.filter((x) => x.id !== id),
    tickets: a.tickets.map((t) => ({ ...t, lignes: t.lignes.filter((l) => l.articleId !== id) })),
  }));
}

/** Ajoute (positif) ou retire (négatif) des unités du stock d'un article dont on suit le stock. */
export async function ajusterStockArticle(id: string, delta: number): Promise<void> {
  await modifier((a) => ({
    ...a,
    articles: a.articles.map((x) => (x.id === id && x.suiviStock ? { ...x, stock: x.stock + delta } : x)),
  }));
}

// --- Tickets

/** Remplace les tickets en cours d'une activité (ceux des autres activités ne bougent pas). */
export async function remplacerTicketsActivite(activiteId: string, tickets: TicketAnnexe[]): Promise<void> {
  await modifier((a) => ({
    ...a,
    tickets: [...a.tickets.filter((t) => t.activiteId !== activiteId), ...tickets],
  }));
}
