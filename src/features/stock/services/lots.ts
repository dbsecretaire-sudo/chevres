import type { Vente } from '@/features/comptabilite/types';
import { idsDesFromages } from '@/features/comptabilite/utils/ventes';
import { lireArchiveStock, remplacerArchiveStock } from '@/features/stock/repository';
import { plageDeBoucles } from '@/features/stock/services/boucles';
import {
  articlesDuGenre,
  cleArticle,
  codeFromageDeLaVente,
  estLigneDuCheptel,
  libelleArticle,
  niveauxDeStock,
  type ArticleAffiche,
} from '@/features/stock/services/stock';
import type { ArchiveStock, LotFromage, MouvementStock } from '@/features/stock/types';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import type { EspeceAnimale } from '@/shared/dictionnaire/animaux';
import { CATEGORIE_VENTE } from '@/shared/constants/comptabilite';
import {
  ETAT_LOT,
  GENRE_ARTICLE,
  LETTRE_CATEGORIE_LOT,
  LETTRE_CATEGORIE_LOT_PAR_DEFAUT,
  LETTRE_PRODUIT_LOT,
  LOTS_MAX_PAR_FABRICATION,
  ORIGINE_MOUVEMENT,
  PRODUIT_A_LOTS,
  SEPARATEUR_NUMERO_LOT,
  TRI_LOT,
} from '@/shared/constants/stock';
import { MS_PAR_JOUR } from '@/shared/constants/temps';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { generateId } from '@/shared/utils/id';
import { TEXTES } from '@/shared/textes';

/** Vrai pour un article de l'inventaire qui est un fromage (« fromage:frais »). */
export const estArticleFromage = (cle: string | undefined): boolean =>
  !!cle && cle.startsWith(`${GENRE_ARTICLE.FROMAGE}:`);

/**
 * Vrai pour un article dont les produits sont identifiés un par un (par lot) : les fromages, et la charcuterie (les lignes de viande
 * ajoutées à l'inventaire, pas les animaux du cheptel).
 */
export const estArticleAvecLots = (cle: string | undefined): boolean =>
  estArticleFromage(cle) || (!!cle && cle.startsWith(`${GENRE_ARTICLE.VIANDE}:`) && !estLigneDuCheptel(cle));

/** Les articles de l'inventaire d'un produit suivi par lot : les fromages, ou les lignes de charcuterie (hors cheptel). */
export function articlesDuProduit(
  produit: ValeurDe<typeof PRODUIT_A_LOTS>,
  archive: ArchiveStock,
  espece: EspeceAnimale,
): ArticleAffiche[] {
  return produit === PRODUIT_A_LOTS.FROMAGE
    ? articlesDuGenre(GENRE_ARTICLE.FROMAGE, archive, espece)
    : articlesDuGenre(GENRE_ARTICLE.VIANDE, archive, espece).filter((a) => estArticleAvecLots(a.cle));
}

/** L'état d'un lot : en stock, vendu ou rappelé (un fromage rappelé n'est plus à vendre, même s'il avait été vendu). */
export const etatDuLot = (
  lot: Pick<LotFromage, 'venteId' | 'dateVente' | 'dateRappel'>,
): Exclude<ValeurDe<typeof ETAT_LOT>, typeof ETAT_LOT.TOUT> =>
  lot.dateRappel ? ETAT_LOT.RAPPELE : lot.venteId || lot.dateVente ? ETAT_LOT.VENDU : ETAT_LOT.EN_STOCK;

/** Les lots d'un article (ou de tous) dans l'état voulu. */
export const lotsDeLInventaire = (
  archive: Pick<ArchiveStock, 'lots'>,
  etat: ValeurDe<typeof ETAT_LOT>,
  article?: string,
): LotFromage[] =>
  (archive.lots ?? []).filter(
    (l) => (!article || l.article === article) && (etat === ETAT_LOT.TOUT || etatDuLot(l) === etat),
  );

/** Les lots à rappeler : vendus (pas encore rappelés) dont le contrôle n'est pas ok. */
export const lotsARappeler = (archive: Pick<ArchiveStock, 'lots'>, article?: string): LotFromage[] =>
  lotsDeLInventaire(archive, ETAT_LOT.VENDU, article).filter((l) => !l.controleOk);

/** Les lots rappelés dont le rappel n'est pas encore validé (fait). */
export const lotsRappelesAValider = (archive: Pick<ArchiveStock, 'lots'>): LotFromage[] =>
  (archive.lots ?? []).filter((l) => l.dateRappel && !l.dateRappelValide);

/** Les lots triés d'après une colonne (le numéro, la date de fabrication ou la date de vente) ; les sans-date à la fin. */
export function trierLots(
  lots: LotFromage[],
  tri: ValeurDe<typeof TRI_LOT>,
  croissant: boolean,
): LotFromage[] {
  const sens = croissant ? 1 : -1;
  const parDate = (a?: string, b?: string) => (!a ? 1 : !b ? -1 : a.localeCompare(b) * sens);
  const parNumero = (a: LotFromage, b: LotFromage) => {
    const x = /^(.*?)(\d+)$/.exec(a.numero);
    const y = /^(.*?)(\d+)$/.exec(b.numero);
    if (!x || !y) return a.numero.localeCompare(b.numero) * sens;
    return (x[1] === y[1] ? Number(x[2]) - Number(y[2]) : x[1] < y[1] ? -1 : 1) * sens;
  };
  return [...lots].sort((a, b) => {
    const dates =
      tri === TRI_LOT.FABRICATION
        ? parDate(a.dateFabrication, b.dateFabrication)
        : tri === TRI_LOT.VENTE
          ? parDate(a.dateVente ?? a.dateRappel, b.dateVente ?? b.dateRappel)
          : 0;
    return dates || parNumero(a, b);
  });
}

/**
 * Le produit identifié (son article de l'inventaire) d'une vente : le fromage d'une vente de fromage (d'après son type et son nom),
 * ou la ligne de charcuterie d'une vente de boucherie / charcuterie (d'après son détail). Rien pour une autre vente.
 */
export function articleDeLaVente(
  vente: Pick<Vente, 'categorie' | 'typeFromage' | 'typeFromageLibre' | 'precision' | 'activite'>,
  archive: ArchiveStock,
): string | undefined {
  if (vente.categorie === CATEGORIE_VENTE.FROMAGE) {
    const code = codeFromageDeLaVente(vente as Vente, archive);
    return code ? cleArticle(GENRE_ARTICLE.FROMAGE, code) : undefined;
  }
  if (vente.categorie === CATEGORIE_VENTE.BOUCHERIE_CHARCUTERIE && vente.precision) {
    const espece =
      vente.activite && vente.activite !== ACTIVITE_COMMUNE ? (vente.activite as EspeceAnimale) : undefined;
    const ligne = articlesDuGenre(GENRE_ARTICLE.VIANDE, archive, espece).find(
      (a) => a.libelle.trim().toLowerCase() === vente.precision!.trim().toLowerCase(),
    );
    return ligne && estArticleAvecLots(ligne.cle) ? ligne.cle : undefined;
  }
  return undefined;
}

/** Les lots qu'une vente de ce fromage peut choisir : ceux en stock, et ceux de la vente elle-même quand on la modifie. */
export const lotsAChoisir = (
  archive: Pick<ArchiveStock, 'lots'>,
  article: string,
  venteId?: string,
): LotFromage[] =>
  (archive.lots ?? []).filter(
    (l) => l.article === article && !l.dateRappel && (!l.venteId || l.venteId === venteId),
  );

/** Vrai quand la vente d'un produit identifié doit désigner ses lots (il en a en stock) et qu'elle n'en désigne aucun. */
export function fromagesRequis(
  archive: ArchiveStock,
  vente: Pick<
    Vente,
    'id' | 'categorie' | 'typeFromage' | 'typeFromageLibre' | 'precision' | 'activite' | 'fromages'
  >,
): boolean {
  if (idsDesFromages(vente).length > 0) return false;
  const article = articleDeLaVente(vente, archive);
  return !!article && lotsAChoisir(archive, article, vente.id).length > 0;
}

/** Le jour de l'année d'une date AAAA-MM-JJ (1 pour le 1er janvier, 365 ou 366 pour le dernier jour). */
export function jourDeLAnnee(date: string): number {
  const [annee, mois, jour] = date.split('-').map(Number);
  return Math.round((Date.UTC(annee, mois - 1, jour) - Date.UTC(annee, 0, 0)) / MS_PAR_JOUR);
}

/** La lettre de la catégorie d'un produit dans son numéro de lot : celle d'office (Frais, Vieux, Crottin, Brocciu), sinon l'initiale de son nom. */
export function lettreDeCategorie(article: string, archive: ArchiveStock): string {
  const code = article.split(':')[1];
  const dOffice = LETTRE_CATEGORIE_LOT[code];
  if (dOffice) return dOffice;
  const initiale = libelleArticle(article, archive)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .charAt(0)
    .toUpperCase();
  return /[A-Z]/.test(initiale) ? initiale : LETTRE_CATEGORIE_LOT_PAR_DEFAUT;
}

/** Le début du numéro des lots d'un produit fabriqué un jour : « FF261 » (fromage, frais, 2026, 1er jour). */
export function prefixeDeLot(article: string, date: string, archive: ArchiveStock): string {
  const produit = estArticleFromage(article) ? PRODUIT_A_LOTS.FROMAGE : PRODUIT_A_LOTS.CHARCUTERIE;
  const annee = String(Number(date.slice(0, 4)) % 100).padStart(2, '0');
  return `${LETTRE_PRODUIT_LOT[produit]}${lettreDeCategorie(article, archive)}${annee}${jourDeLAnnee(date)}`;
}

/**
 * Le numéro du premier lot d'une fabrication, « FF261-1 » : le produit (F fromage, B boucherie), sa catégorie (F frais, V vieux,
 * C crottin, B brocciu, l'initiale du nom sinon), l'année, le jour de l'année, puis le n° du produit. Une deuxième fabrication du même
 * jour continue la numérotation de la première.
 */
export function numeroDeLot(archive: ArchiveStock, article: string, date: string): string {
  const prefixe = prefixeDeLot(article, date, archive);
  const debut = `${prefixe}${SEPARATEUR_NUMERO_LOT}`;
  const rangs = (archive.lots ?? [])
    .filter((l) => l.numero.startsWith(debut))
    .map((l) => Number(l.numero.slice(debut.length)) || 0);
  return `${debut}${Math.max(0, ...rangs) + 1}`;
}

/** Le numéro de lot qui suit le plus grand déjà pris pour ce fromage (« 1 » quand il n'y en a pas encore). */
export function numeroSuivant(archive: Pick<ArchiveStock, 'lots'>, article: string): string {
  let meilleur: { tete: string; chiffres: string } | undefined;
  for (const lot of archive.lots ?? []) {
    const morceaux = /^(.*?)(\d+)$/.exec(lot.numero);
    if (lot.article !== article || !morceaux) continue;
    if (!meilleur || Number(morceaux[2]) > Number(meilleur.chiffres)) {
      meilleur = { tete: morceaux[1], chiffres: morceaux[2] };
    }
  }
  if (!meilleur) return '1';
  return `${meilleur.tete}${String(Number(meilleur.chiffres) + 1).padStart(meilleur.chiffres.length, '0')}`;
}

/** Ce qui empêche de fabriquer ces fromages : le premier numéro manque, la plage est trop grande, ou un numéro est déjà pris. */
export function erreurFabrication(
  archive: Pick<ArchiveStock, 'lots'>,
  article: string,
  debut: string,
  quantite: number,
): string | undefined {
  const T = TEXTES.production.fabrication;
  const nombre = Math.round(quantite);
  if (!(nombre > 0)) return T.quantiteRequise;
  if (nombre > LOTS_MAX_PAR_FABRICATION) return T.tropDeLots(LOTS_MAX_PAR_FABRICATION);
  const numeros = plageDeBoucles(debut, nombre);
  if (!numeros) return T.premierRequis;
  const pris = new Set((archive.lots ?? []).filter((l) => l.article === article).map((l) => l.numero));
  const doublon = numeros.find((n) => pris.has(n));
  return doublon ? T.dejaPris(doublon) : undefined;
}

/** Une écriture à la fois dans les lots : une fabrication et une vente d'affilée ne se mélangent pas. */
let file: Promise<unknown> = Promise.resolve();
const enFile = <T>(travail: () => Promise<T>): Promise<T> => {
  const suite = file.then(travail);
  file = suite.catch(() => undefined);
  return suite;
};

/**
 * Fabrique des fromages : un lot par fromage, numérotés à la suite du premier, qui entrent au stock d'un seul mouvement (avec les
 * litres de lait utilisés, quand on les a notés).
 */
export function fabriquerFromages(saisie: {
  article: string;
  date: string;
  quantite: number;
  debut: string;
  litres?: number;
}): Promise<void> {
  return enFile(async () => {
    const archive = await lireArchiveStock();
    const erreur = erreurFabrication(archive, saisie.article, saisie.debut, saisie.quantite);
    if (erreur) throw new Error(erreur);
    const numeros = plageDeBoucles(saisie.debut, saisie.quantite) as string[];
    const mouvementId = generateId();
    const lots: LotFromage[] = numeros.map((numero) => ({
      id: generateId(),
      article: saisie.article,
      numero,
      dateFabrication: saisie.date,
      mouvementId,
    }));
    const mouvement: MouvementStock = {
      id: mouvementId,
      article: saisie.article,
      date: saisie.date,
      delta: numeros.length,
      origine: ORIGINE_MOUVEMENT.MANUEL,
      litres: saisie.litres && saisie.litres > 0 ? saisie.litres : undefined,
    };
    await remplacerArchiveStock({
      ...archive,
      lots: [...(archive.lots ?? []), ...lots],
      mouvements: [...archive.mouvements, mouvement],
    });
  });
}

/**
 * Change la date de fabrication d'un lot : celle de toute sa fabrication (ses lots sont nés ensemble, d'un seul mouvement de stock),
 * et la date de ce mouvement — le lait utilisé pour les fromages suit. Un lot d'avant ce suivi retrouve son mouvement d'après son
 * article et sa date de fabrication. Rien ne change pour les ventes ni les rappels des lots.
 */
export function modifierDateFabrication(id: string, date: string): Promise<void> {
  return enFile(async () => {
    const archive = await lireArchiveStock();
    const lot = (archive.lots ?? []).find((l) => l.id === id);
    if (!lot || !date || lot.dateFabrication === date) return;
    const groupe = lotsDeLaFabrication(archive.lots ?? [], lot);
    const candidats = archive.mouvements.filter(
      (m) =>
        m.origine === ORIGINE_MOUVEMENT.MANUEL &&
        m.delta > 0 &&
        (lot.mouvementId
          ? m.id === lot.mouvementId
          : m.article === lot.article && m.date === lot.dateFabrication),
    );
    // Plusieurs fabrications le même jour (lots d'avant le suivi) : celle qui a fait entrer autant de fromages.
    const mouvement = candidats.find((m) => m.delta === groupe.length) ?? candidats[0];
    await remplacerArchiveStock({
      ...archive,
      lots: (archive.lots ?? []).map((l) =>
        groupe.some((g) => g.id === l.id)
          ? { ...l, dateFabrication: date, mouvementId: mouvement?.id ?? l.mouvementId }
          : l,
      ),
      mouvements: archive.mouvements.map((m) => (m.id === mouvement?.id ? { ...m, date } : m)),
    });
  });
}

/** Le nombre de lots d'une même fabrication que ce lot (lui compris) : ceux dont la date change avec la sienne. */
export function lotsDeLaFabrication(lots: LotFromage[], lot: LotFromage): LotFromage[] {
  return lots.filter((l) =>
    lot.mouvementId
      ? l.mouvementId === lot.mouvementId
      : !l.mouvementId && l.article === lot.article && l.dateFabrication === lot.dateFabrication,
  );
}

/**
 * Remet à zéro des fromages (ceux de ces articles) : les lots en stock disparaissent et le stock revient à 0 par un mouvement. Les lots
 * déjà vendus ou rappelés restent, pour la traçabilité de leurs ventes.
 */
export function remettreLotsAZero(articles: string[], date: string): Promise<void> {
  return enFile(async () => {
    const archive = await lireArchiveStock();
    const niveaux = niveauxDeStock(archive.mouvements);
    const enStock = new Set(
      (archive.lots ?? [])
        .filter((l) => articles.includes(l.article) && etatDuLot(l) === ETAT_LOT.EN_STOCK)
        .map((l) => l.id),
    );
    const remises: MouvementStock[] = articles.flatMap((article) => {
      const niveau = niveaux.get(article) ?? 0;
      return niveau === 0 ? [] : [{ id: generateId(), article, date, delta: -niveau, origine: ORIGINE_MOUVEMENT.MANUEL }];
    });
    await remplacerArchiveStock({
      ...archive,
      lots: (archive.lots ?? []).filter((l) => !enStock.has(l.id)),
      mouvements: [...archive.mouvements, ...remises],
    });
  });
}

/** Supprime tous les lots de ces articles (vendus et rappelés compris) : leur numérotation repart de 1 ; le stock ne change pas. */
export function supprimerLotsDesArticles(articles: string[]): Promise<void> {
  return enFile(async () => {
    const archive = await lireArchiveStock();
    await remplacerArchiveStock({
      ...archive,
      lots: (archive.lots ?? []).filter((l) => !articles.includes(l.article)),
    });
  });
}

/** Coche ou décoche le contrôle de plusieurs fromages d'un coup (« tout sélectionner »). */
export function controlerLots(ids: string[], controleOk: boolean): Promise<void> {
  return enFile(async () => {
    const archive = await lireArchiveStock();
    const choisis = new Set(ids);
    await remplacerArchiveStock({
      ...archive,
      lots: (archive.lots ?? []).map((l) =>
        choisis.has(l.id) ? { ...l, controleOk: controleOk || undefined } : l,
      ),
    });
  });
}

/** Rappelle des fromages (à une date) : ils sortent du stock d'un seul mouvement, par article. */
export function rappelerLots(ids: string[], date: string): Promise<void> {
  return enFile(async () => {
    const archive = await lireArchiveStock();
    const aRappeler = (archive.lots ?? []).filter((l) => ids.includes(l.id) && !l.dateRappel);
    if (aRappeler.length === 0) return;
    // Un fromage vendu puis rappelé n'était déjà plus au stock : seuls ceux qui y étaient en sortent.
    const enStock = aRappeler.filter((l) => etatDuLot(l) === ETAT_LOT.EN_STOCK);
    const parArticle = new Map<string, number>();
    for (const l of enStock) parArticle.set(l.article, (parArticle.get(l.article) ?? 0) + 1);
    const mouvements: MouvementStock[] = [...parArticle.entries()].map(([article, nombre]) => ({
      id: generateId(),
      article,
      date,
      delta: -nombre,
      origine: ORIGINE_MOUVEMENT.RAPPEL,
    }));
    await remplacerArchiveStock({
      ...archive,
      lots: (archive.lots ?? []).map((l) =>
        aRappeler.some((x) => x.id === l.id) ? { ...l, dateRappel: date } : l,
      ),
      mouvements: [...archive.mouvements, ...mouvements],
    });
  });
}

/** Valide le rappel d'un lot (le rappel est fait) à la date donnée. */
export function validerRappelLot(id: string, date: string): Promise<void> {
  return enFile(async () => {
    const archive = await lireArchiveStock();
    await remplacerArchiveStock({
      ...archive,
      lots: (archive.lots ?? []).map((l) =>
        l.id === id && l.dateRappel ? { ...l, dateRappelValide: date } : l,
      ),
    });
  });
}

/** Coche ou décoche le contrôle d'un fromage. */
export function basculerControleLot(id: string): Promise<void> {
  return enFile(async () => {
    const archive = await lireArchiveStock();
    await remplacerArchiveStock({
      ...archive,
      lots: (archive.lots ?? []).map((l) => (l.id === id ? { ...l, controleOk: !l.controleOk } : l)),
    });
  });
}

/**
 * Met les lots d'une vente à jour : ceux qu'elle cite sont vendus à sa date ; ceux qu'elle ne cite plus (sa modification) redeviennent
 * en stock. Le stock lui-même suit la quantité de la vente (voir synchroniserStockVente).
 */
export function synchroniserLotsVente(vente: Pick<Vente, 'id' | 'date' | 'fromages'>): Promise<void> {
  return enFile(async () => {
    const archive = await lireArchiveStock();
    if (!archive.lots?.length) return;
    const ids = idsDesFromages(vente);
    let change = false;
    const lots = archive.lots.map((l) => {
      if (ids.includes(l.id) && !l.dateRappel) {
        if (l.venteId === vente.id && l.dateVente === vente.date) return l;
        change = true;
        return { ...l, venteId: vente.id, dateVente: vente.date };
      }
      if (l.venteId === vente.id && !ids.includes(l.id)) {
        change = true;
        return { ...l, venteId: undefined, dateVente: undefined };
      }
      return l;
    });
    if (change) await remplacerArchiveStock({ ...archive, lots });
  });
}

/** Une vente supprimée rend ses fromages au stock. */
export const libererLotsVente = (venteId: string): Promise<void> =>
  synchroniserLotsVente({ id: venteId, date: '', fromages: undefined });
