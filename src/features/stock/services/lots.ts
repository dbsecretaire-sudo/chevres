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
  lignesDeVenteDeProduits,
  type ArticleAffiche,
} from '@/features/stock/services/stock';
import { lotVendable } from '@/features/stock/services/dossiersSavons';
import type {
  ArchiveStock,
  DossierSavon,
  EtapeReglementaire,
  FabricationDePlats,
  LotFromage,
  MouvementStock,
  RecetteDeFabrication,
} from '@/features/stock/types';
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
import { todayISO } from '@/shared/utils/dates';
import { generateId } from '@/shared/utils/id';
import { TEXTES } from '@/shared/textes';

/** Vrai pour un article de l'inventaire qui est un fromage (« fromage:frais »). */
export const estArticleFromage = (cle: string | undefined): boolean =>
  !!cle && cle.startsWith(`${GENRE_ARTICLE.FROMAGE}:`);

/** Vrai pour un article de l'inventaire qui est un savon (« savon:… »). */
export const estArticleSavon = (cle: string | undefined): boolean =>
  !!cle && cle.startsWith(`${GENRE_ARTICLE.SAVON}:`);

/** Vrai pour un article de l'inventaire qui est un plat préparé (« plat:… »). */
export const estArticlePlat = (cle: string | undefined): boolean =>
  !!cle && cle.startsWith(`${GENRE_ARTICLE.PLAT}:`);

/**
 * Vrai pour un article dont les produits sont identifiés un par un (par lot) : les fromages, les plats préparés, et la charcuterie (les lignes de viande
 * ajoutées à l'inventaire, pas les animaux du cheptel).
 */
export const estArticleAvecLots = (cle: string | undefined): boolean =>
  estArticleFromage(cle) ||
  estArticlePlat(cle) ||
  estArticleSavon(cle) ||
  (!!cle && cle.startsWith(`${GENRE_ARTICLE.VIANDE}:`) && !estLigneDuCheptel(cle));

/** Les articles de l'inventaire d'un produit suivi par lot : les fromages, ou les lignes de charcuterie (hors cheptel). */
export function articlesDuProduit(
  produit: ValeurDe<typeof PRODUIT_A_LOTS>,
  archive: ArchiveStock,
  espece: EspeceAnimale,
): ArticleAffiche[] {
  if (produit === PRODUIT_A_LOTS.PLAT) return articlesDuGenre(GENRE_ARTICLE.PLAT, archive, espece);
  if (produit === PRODUIT_A_LOTS.SAVON) return articlesDuGenre(GENRE_ARTICLE.SAVON, archive, espece);
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

/**
 * Les lots de plats préparés faits avec l'un de ces lots (ingrédients), et ceux faits avec ces plats à leur tour : de quoi rappeler un plat dont un
 * ingrédient n'est pas conforme. Rien pour un lot qui n'a servi à aucun plat.
 */
export function lotsDePlatsUtilisant(
  archive: Pick<ArchiveStock, 'lots' | 'platsFabriques'>,
  ids: Iterable<string>,
): LotFromage[] {
  const sources = new Set(ids);
  const plats = new Map<string, LotFromage>();
  let grandit = true;
  while (grandit) {
    grandit = false;
    for (const [mouvementId, fabrication] of Object.entries(archive.platsFabriques ?? {})) {
      if (!fabrication.ingredients.some((i) => i.lotIds.some((id) => sources.has(id)))) continue;
      for (const lot of archive.lots ?? []) {
        if (lot.mouvementId !== mouvementId || plats.has(lot.id)) continue;
        plats.set(lot.id, lot);
        sources.add(lot.id);
        grandit = true;
      }
    }
  }
  return [...plats.values()];
}

/**
 * Les lots à rappeler : vendus (pas encore rappelés) dont le contrôle n'est pas ok, et les plats préparés faits avec l'un d'eux (ou avec un lot déjà rappelé) : un
 * ingrédient non conforme rappelle le plat, quel que soit le contrôle du plat lui-même.
 */
export function lotsARappeler(
  archive: Pick<ArchiveStock, 'lots' | 'platsFabriques'>,
  article?: string,
): LotFromage[] {
  const nonConformes = lotsDeLInventaire(archive, ETAT_LOT.VENDU).filter((l) => !l.controleOk);
  const rappeles = (archive.lots ?? []).filter((l) => !!l.dateRappel);
  const plats = lotsDePlatsUtilisant(archive, [...nonConformes, ...rappeles].map((l) => l.id)).filter((l) => !l.dateRappel);
  const tous = new Map([...nonConformes, ...plats].map((l) => [l.id, l]));
  return [...tous.values()].filter((l) => !article || l.article === article);
}

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
  if (
    (vente.categorie === CATEGORIE_VENTE.BOUCHERIE_CHARCUTERIE || vente.categorie === CATEGORIE_VENTE.SAVONS) &&
    vente.precision
  ) {
    const espece =
      vente.activite && vente.activite !== ACTIVITE_COMMUNE ? (vente.activite as EspeceAnimale) : undefined;
    const ligne = lignesDeVenteDeProduits(archive, espece).find(
      (a) => a.libelle.trim().toLowerCase() === vente.precision!.trim().toLowerCase(),
    );
    return ligne && estArticleAvecLots(ligne.cle) ? ligne.cle : undefined;
  }
  return undefined;
}

/**
 * Les lots qu'une vente de ce produit peut choisir : ceux en stock, et ceux de la vente elle-même quand on la modifie. Un savon encore en cure, ou dont le dossier
 * réglementaire n'est pas en règle, n'est pas proposé (sauf à la vente qui l'a déjà).
 */
export const lotsAChoisir = (
  archive: Pick<ArchiveStock, 'lots' | 'platsFabriques' | 'dossiersSavons'>,
  article: string,
  venteId?: string,
  date: string = todayISO(),
): LotFromage[] =>
  // Les numéros les plus grands d'abord.
  trierLots(
    (archive.lots ?? []).filter(
      (l) =>
        l.article === article &&
        !l.dateRappel &&
        (!l.venteId || l.venteId === venteId) &&
        ((!!venteId && l.venteId === venteId) || lotVendable(l, archive, date)),
    ),
    TRI_LOT.NUMERO,
    false,
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
  const produit = estArticleFromage(article)
    ? PRODUIT_A_LOTS.FROMAGE
    : estArticlePlat(article)
      ? PRODUIT_A_LOTS.PLAT
      : estArticleSavon(article)
        ? PRODUIT_A_LOTS.SAVON
        : PRODUIT_A_LOTS.CHARCUTERIE;
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
  /** Ce qui sort du stock pour cette fabrication (la présure, le sel, les ferments…), et les notes de la recette. */
  ingredients?: readonly { article: string; quantite: number; lotIds: string[] }[];
  notes?: string;
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
    const utilises = (saisie.ingredients ?? []).filter((i) => i.article && i.quantite > 0);
    const sorties: MouvementStock[] = utilises.map((i) => ({
      id: generateId(),
      article: i.article,
      date: saisie.date,
      delta: -i.quantite,
      origine: ORIGINE_MOUVEMENT.CONSOMMATION,
      venteId: mouvementId,
    }));
    const notes = saisie.notes?.trim() || undefined;
    // Les ingrédients et les notes sont gardés une seule fois pour tous les lots, comme pour un plat préparé.
    const platsFabriques =
      utilises.length > 0 || notes
        ? {
            ...(archive.platsFabriques ?? {}),
            [mouvementId]: {
              notes,
              ingredients: utilises.map((i) => ({ article: i.article, quantite: i.quantite, lotIds: i.lotIds })),
            },
          }
        : archive.platsFabriques;
    await remplacerArchiveStock({
      ...archive,
      lots: [...(archive.lots ?? []), ...lots],
      mouvements: [...archive.mouvements, mouvement, ...sorties],
      platsFabriques,
    });
  });
}

/**
 * Fabrique un produit transformé (un plat préparé, un savon) : un lot par pièce, numérotés à la suite du premier, qui entrent au stock d'un seul mouvement
 * (avec les litres de lait pris dans le stock de lait, pour un savon). Les ingrédients sortent du stock (un mouvement par ingrédient) et leurs lots choisis passent
 * « utilisés » à la date de la fabrication : le lot dit ainsi de quoi il est fait. Ce qu'on sait de la fabrication (stérilisation, saponification, cure, durabilité,
 * ingrédients) est gardé une seule fois pour tous ses lots.
 */
function fabriquerTransforme(
  saisie: {
    article: string;
    date: string;
    quantite: number;
    debut: string;
    ingredients: readonly { article: string; quantite: number; lotIds: string[] }[];
  },
  origine: ValeurDe<typeof ORIGINE_MOUVEMENT>,
  details: Omit<FabricationDePlats, 'ingredients'>,
  litres?: number,
): Promise<void> {
  return enFile(async () => {
    const archive = await lireArchiveStock();
    const erreur = erreurFabrication(archive, saisie.article, saisie.debut, saisie.quantite);
    if (erreur) throw new Error(erreur);
    const numeros = plageDeBoucles(saisie.debut, saisie.quantite) as string[];
    const mouvementId = generateId();
    const utilises = saisie.ingredients.filter((i) => i.article && i.quantite > 0);
    const pris = new Set(utilises.flatMap((i) => i.lotIds));
    const nouveaux: LotFromage[] = numeros.map((numero) => ({
      id: generateId(),
      article: saisie.article,
      numero,
      dateFabrication: saisie.date,
      mouvementId,
    }));
    const entree: MouvementStock = {
      id: mouvementId,
      article: saisie.article,
      date: saisie.date,
      delta: numeros.length,
      origine: ORIGINE_MOUVEMENT.MANUEL,
      litres: litres && litres > 0 ? litres : undefined,
    };
    const sorties: MouvementStock[] = utilises.map((i) => ({
      id: generateId(),
      article: i.article,
      date: saisie.date,
      delta: -i.quantite,
      origine,
      venteId: mouvementId,
    }));
    const lots = (archive.lots ?? []).map((l) =>
      pris.has(l.id) && !l.dateRappel ? { ...l, venteId: mouvementId, dateVente: saisie.date } : l,
    );
    const fabrication: FabricationDePlats = {
      ...details,
      ingredients: utilises.map((i) => ({ article: i.article, quantite: i.quantite, lotIds: i.lotIds })),
    };
    await remplacerArchiveStock({
      ...archive,
      lots: [...lots, ...nouveaux],
      mouvements: [...archive.mouvements, entree, ...sorties],
      platsFabriques: { ...(archive.platsFabriques ?? {}), [mouvementId]: fabrication },
    });
  });
}

/**
 * Fabrique des plats préparés (conserves, bocaux) : un lot par pièce, qui entrent au stock d'un seul mouvement ; les ingrédients sortent du stock. La stérilisation, la
 * date de durabilité minimale et les ingrédients sont gardés une seule fois pour toute la fabrication.
 */
export function fabriquerPlats(saisie: {
  article: string;
  date: string;
  quantite: number;
  debut: string;
  dateSterilisation?: string;
  ddm?: string;
  notes?: string;
  ingredients: readonly { article: string; quantite: number; lotIds: string[] }[];
}): Promise<void> {
  return fabriquerTransforme(saisie, ORIGINE_MOUVEMENT.PLAT, {
    dateSterilisation: saisie.dateSterilisation || undefined,
    ddm: saisie.ddm || undefined,
    notes: saisie.notes?.trim() || undefined,
  });
}

/**
 * Fabrique des savons : un lot par pain, qui entrent au stock d'un seul mouvement avec les litres de lait de chèvre pris dans le stock de lait de l'exploitation ;
 * les autres ingrédients (huiles, soude…) sortent du stock. Le jour de la saponification, la fin de la cure (avant elle, les lots ne se vendent pas), la date de
 * durabilité et les ingrédients sont gardés une seule fois pour toute la fabrication.
 */
export function fabriquerSavons(saisie: {
  article: string;
  date: string;
  quantite: number;
  debut: string;
  litresLait?: number;
  dateSaponification?: string;
  finCure?: string;
  ddm?: string;
  notes?: string;
  ingredients: readonly { article: string; quantite: number; lotIds: string[] }[];
}): Promise<void> {
  const litres = saisie.litresLait && saisie.litresLait > 0 ? saisie.litresLait : undefined;
  return fabriquerTransforme(
    saisie,
    ORIGINE_MOUVEMENT.SAVON,
    {
      dateSaponification: saisie.dateSaponification || saisie.date,
      finCure: saisie.finCure || undefined,
      ddm: saisie.ddm || undefined,
      litresLait: litres,
      notes: saisie.notes?.trim() || undefined,
    },
    litres,
  );
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

/** Réserve des lots pour un client (sans réservation : ils sont libérés). */
export function reserverLots(ids: string[], reservation?: LotFromage['reservation']): Promise<void> {
  return enFile(async () => {
    const archive = await lireArchiveStock();
    const choisis = new Set(ids);
    await remplacerArchiveStock({
      ...archive,
      lots: (archive.lots ?? []).map((l) => {
        if (!choisis.has(l.id)) return l;
        const { reservation: _ancienne, ...reste } = l;
        return reservation ? { ...reste, reservation } : reste;
      }),
    });
  });
}

/** Coche ou décoche le contrôle de plusieurs fromages d'un coup (« tout sélectionner ») : un lot rappelé n'est plus à contrôler, il n'est pas touché. */
export function controlerLots(ids: string[], controleOk: boolean): Promise<void> {
  return enFile(async () => {
    const archive = await lireArchiveStock();
    const choisis = new Set(ids);
    await remplacerArchiveStock({
      ...archive,
      lots: (archive.lots ?? []).map((l) =>
        choisis.has(l.id) && !l.dateRappel ? { ...l, controleOk: controleOk || undefined } : l,
      ),
    });
  });
}

/** Rappelle des fromages (à une date) : ils sortent du stock d'un seul mouvement, par article. */
export function rappelerLots(ids: string[], date: string): Promise<void> {
  return enFile(async () => {
    const archive = await lireArchiveStock();
    const demandes = (archive.lots ?? []).filter((l) => ids.includes(l.id) && !l.dateRappel);
    // Les plats préparés faits avec ces lots sont rappelés avec eux.
    const aRappeler = [
      ...demandes,
      ...lotsDePlatsUtilisant(archive, demandes.map((l) => l.id)).filter(
        (p) => !p.dateRappel && !demandes.some((d) => d.id === p.id),
      ),
    ];
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

/** Coche ou décoche le contrôle d'un fromage (un lot rappelé ne se coche plus). */
export function basculerControleLot(id: string): Promise<void> {
  return enFile(async () => {
    const archive = await lireArchiveStock();
    await remplacerArchiveStock({
      ...archive,
      lots: (archive.lots ?? []).map((l) => (l.id === id && !l.dateRappel ? { ...l, controleOk: !l.controleOk } : l)),
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

/**
 * Sort du stock ce qu'une visite de la ferme utilise : un mouvement par produit, et les lots choisis passent « vendus » à la date de la visite
 * (la visite est la clé : elle les rend au stock si elle est défaite, voir rendreStockDeVisite). Les produits sans lot choisi sortent sans numéro.
 */
export function utiliserStockPourVisite(
  visiteId: string,
  date: string,
  utilise: readonly { article: string; quantite: number; lotIds: string[] }[],
): Promise<void> {
  return enFile(async () => {
    const archive = await lireArchiveStock();
    const ids = new Set(utilise.flatMap((u) => u.lotIds));
    const mouvements: MouvementStock[] = [
      ...archive.mouvements.filter((m) => m.venteId !== visiteId),
      ...utilise
        .filter((u) => u.quantite > 0)
        .map((u) => ({
          id: generateId(),
          article: u.article,
          date,
          delta: -u.quantite,
          origine: ORIGINE_MOUVEMENT.VISITE,
          venteId: visiteId,
        })),
    ];
    const lots = (archive.lots ?? []).map((l) => {
      if (ids.has(l.id) && !l.dateRappel) return { ...l, venteId: visiteId, dateVente: date };
      return l.venteId === visiteId ? { ...l, venteId: undefined, dateVente: undefined } : l;
    });
    await remplacerArchiveStock({ ...archive, mouvements, lots });
  });
}

/** Rend au stock ce qu'une visite défaite (ou supprimée) avait utilisé : ses mouvements disparaissent, ses lots redeviennent en stock. */
export const rendreStockDeVisite = (visiteId: string): Promise<void> =>
  utiliserStockPourVisite(visiteId, '', []);

/** Une vente supprimée rend ses fromages au stock. */
export const libererLotsVente = (venteId: string): Promise<void> =>
  synchroniserLotsVente({ id: venteId, date: '', fromages: undefined });

/** Note qu'un échantillon de cette fabrication de plats est parti à un laboratoire ce jour-là : l'analyse suivante se compte à partir d'elle. */
export function enregistrerAnalyseDePlats(mouvementId: string, date: string): Promise<void> {
  return enFile(async () => {
    const archive = await lireArchiveStock();
    const fabrication: FabricationDePlats = archive.platsFabriques?.[mouvementId] ?? { ingredients: [] };
    if (fabrication.analyses?.includes(date)) return;
    await remplacerArchiveStock({
      ...archive,
      platsFabriques: {
        ...archive.platsFabriques,
        [mouvementId]: { ...fabrication, analyses: [...(fabrication.analyses ?? []), date].sort() },
      },
    });
  });
}

/** Note ou corrige une étape du dossier réglementaire d'un savon (faite ou non, sa date, sa référence, ses pièces) : le reste du dossier ne bouge pas. */
export function enregistrerEtapeSavon(article: string, etape: string, modification: Partial<EtapeReglementaire>): Promise<void> {
  return enFile(async () => {
    const archive = await lireArchiveStock();
    const dossier: DossierSavon = archive.dossiersSavons?.[article] ?? { etapes: {} };
    await remplacerArchiveStock({
      ...archive,
      dossiersSavons: {
        ...archive.dossiersSavons,
        [article]: { ...dossier, etapes: { ...dossier.etapes, [etape]: { ...dossier.etapes[etape], ...modification } } },
      },
    });
  });
}

/** Note la liste INCI d'un savon (celle de son étiquette) ; vide, elle est retirée. */
export function enregistrerInciSavon(article: string, inci: string): Promise<void> {
  return enFile(async () => {
    const archive = await lireArchiveStock();
    const dossier: DossierSavon = archive.dossiersSavons?.[article] ?? { etapes: {} };
    await remplacerArchiveStock({
      ...archive,
      dossiersSavons: { ...archive.dossiersSavons, [article]: { ...dossier, inci: inci.trim() || undefined } },
    });
  });
}

/** Les recettes de la bibliothèque d'un produit, par ordre alphabétique : avec un article, celles qui lui sont propres et celles du produit entier. */
export const recettesDuProduit = (
  archive: Pick<ArchiveStock, 'recettes'>,
  produit: string,
  article?: string,
): RecetteDeFabrication[] =>
  (archive.recettes ?? [])
    .filter((r) => r.produit === produit && (!article || !r.article || r.article === article))
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

/** Garde une recette (nouvelle, ou celle qui porte déjà son identifiant : elle est remplacée). */
export function enregistrerRecette(recette: RecetteDeFabrication): Promise<void> {
  return enFile(async () => {
    const archive = await lireArchiveStock();
    const autres = (archive.recettes ?? []).filter((r) => r.id !== recette.id);
    await remplacerArchiveStock({ ...archive, recettes: [...autres, recette] });
  });
}

/** Retire une recette de la bibliothèque. */
export function supprimerRecette(id: string): Promise<void> {
  return enFile(async () => {
    const archive = await lireArchiveStock();
    await remplacerArchiveStock({ ...archive, recettes: (archive.recettes ?? []).filter((r) => r.id !== id) });
  });
}
