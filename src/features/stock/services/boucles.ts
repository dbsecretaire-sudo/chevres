import type { Chevre } from '@/features/cheptel/types';
import { lignesProductionDe } from '@/features/comptabilite/utils/lignesProduction';
import { especeDe } from '@/features/cheptel/utils/espece';
import { activiteFacture } from '@/features/comptabilite/utils/activite';
import { especeCourante, especeParDefaut } from '@/shared/dictionnaire/animaux';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import type { Facture } from '@/features/comptabilite/types';
import { getSettings, synchroBouclesActive } from '@/features/settings/settings';
import { lireArchiveStock, remplacerArchiveStock } from '@/features/stock/repository';
import type { ArchiveStock, BoucleStock } from '@/features/stock/types';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import {
  ARTICLE_BOUCLE,
  BOUCLES_MAX_PAR_ACHAT,
  ESPECES_SANS_BOUCLE,
  ETAT_BOUCLE,
  GENRE_ARTICLE,
  ORIGINE_MOUVEMENT,
  TRI_BOUCLE,
} from '@/shared/constants/stock';
import { loadAllYears } from '@/shared/storage/localStore';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { TEXTES } from '@/shared/textes';
import { todayISO } from '@/shared/utils/dates';
import { generateId } from '@/shared/utils/id';

/** Au plus ce nombre de chiffres dans un numéro de boucle : au-delà, les additions ne sont plus exactes. */
const CHIFFRES_MAX = 15;

/** L'espèce d'une boucle : la sienne, ou l'espèce par défaut de l'établissement pour une ancienne boucle. */
export const especeDeLaBoucle = (b: Pick<BoucleStock, 'espece'>): string => b.espece ?? especeParDefaut();

/** Les boucles de l'espèce active (chaque espèce a les siennes : les boucles des chèvres ne sont pas celles des cochons). */
export const bouclesDeLEspece = (boucles: BoucleStock[] | undefined): BoucleStock[] =>
  (boucles ?? []).filter((b) => especeDeLaBoucle(b) === especeCourante());

/** Vrai pour un article de l'inventaire qui est une boucle d'identification (« boucle:boucles », « boucle:rouges », « boucle:tiptag »). */
export const estArticleBoucle = (cle: string | undefined): boolean =>
  !!cle && cle.startsWith(`${GENRE_ARTICLE.BOUCLE}:`);

/** Vrai pour la boucle rouge : une boucle de remplacement provisoire, sans numéro à elle (elle se compte seulement en quantité). */
export const estArticleBoucleRouge = (cle: string | undefined): boolean =>
  cle === `${GENRE_ARTICLE.BOUCLE}:${ARTICLE_BOUCLE.ROUGES}`;

/** Vrai pour la boucle de rebouclage : elle remplace une boucle perdue ou cassée ; elle s'achète en quantité, sans numéro. */
export const estArticleRebouclage = (cle: string | undefined): boolean =>
  cle === `${GENRE_ARTICLE.BOUCLE}:${ARTICLE_BOUCLE.REBOUCLAGE}`;

/** Vrai pour une boucle de remplacement (rouge ou de rebouclage) : sans numéro à l'achat, avec un numéro de remplacement noté à la pose. */
export const estBoucleDeRemplacement = (cle: string | undefined): boolean =>
  estArticleBoucleRouge(cle) || estArticleRebouclage(cle);

/** Vrai pour une boucle d'identification qui a son numéro à l'achat (la boucle et le tiptag, pas les boucles de remplacement). */
export const estBoucleNumerotee = (cle: string | undefined): boolean =>
  estArticleBoucle(cle) && !estBoucleDeRemplacement(cle);

/** « Boucles », « Boucles rouges » ou « Tiptag » d'après l'article de l'inventaire (« boucle:rouges »). */
export const libelleDeLaSorte = (article: string | undefined): string =>
  TEXTES.stock.boucles.sorte[(article?.split(':')[1] ?? '') as keyof typeof TEXTES.stock.boucles.sorte] ?? '';

/** Un numéro coupé en son début (des lettres, éventuellement) et sa fin (les chiffres, qui se comptent). */
function decouper(numero: string): { tete: string; chiffres: string } | undefined {
  const morceaux = /^(.*?)(\d+)$/.exec(numero.trim());
  return morceaux && morceaux[2].length <= CHIFFRES_MAX
    ? { tete: morceaux[1], chiffres: morceaux[2] }
    : undefined;
}

/**
 * Les numéros des boucles d'un achat : de la première, à la suite (30011, 30012…), autant que la quantité. Rien quand le
 * premier numéro ne se termine pas par un chiffre ou que la quantité est nulle ou trop grande.
 */
export function plageDeBoucles(debut: string, quantite: number): string[] | undefined {
  const morceaux = decouper(debut);
  const nombre = Math.round(quantite);
  if (!morceaux || !(nombre > 0) || nombre > BOUCLES_MAX_PAR_ACHAT) return undefined;
  const premier = Number(morceaux.chiffres);
  return Array.from(
    { length: nombre },
    (_, i) => `${morceaux.tete}${String(premier + i).padStart(morceaux.chiffres.length, '0')}`,
  );
}

/** Le numéro de la dernière boucle d'un achat (le premier numéro et la quantité suffisent). */
export const derniereBoucle = (debut: string, quantite: number): string | undefined =>
  plageDeBoucles(debut, quantite)?.at(-1);

/** Compare deux numéros comme on les lit : les lettres du début, puis le nombre (2 avant 10). */
function comparerNumeros(a: string, b: string): number {
  const x = decouper(a);
  const y = decouper(b);
  if (!x || !y) return a.localeCompare(b);
  return x.tete === y.tete ? Number(x.chiffres) - Number(y.chiffres) : x.tete < y.tete ? -1 : 1;
}

/** Les boucles d'un achat, d'après sa facture : celles de l'ancien enregistrement gardent leur pose. */
export function bouclesApresAchat(
  boucles: BoucleStock[],
  facture: Pick<
    Facture,
    | 'id'
    | 'date'
    | 'stockArticle'
    | 'stockQuantite'
    | 'bouclesDebut'
    | 'lignesProduction'
    | 'montant'
    | 'activite'
    | 'categorieDepense'
  >,
): BoucleStock[] {
  // Les boucles sont celles de l'espèce de la dépense (celle de l'espèce active pour une dépense commune).
  const activite = activiteFacture(facture);
  const espece = activite === ACTIVITE_COMMUNE ? especeCourante() : activite;
  // Les boucles de chaque fourniture de l'achat qui en est une (une plage à partir de son premier numéro).
  const achetees = lignesProductionDe(facture).flatMap((ligne) => {
    const plage =
      estBoucleNumerotee(ligne.article) && ligne.bouclesDebut
        ? plageDeBoucles(ligne.bouclesDebut, ligne.quantite ?? 0)
        : undefined;
    return (plage ?? []).map((numero) => ({ numero, article: ligne.article }));
  });
  const tousLesNumeros = new Set(achetees.map((x) => x.numero));
  // Celles de l'ancien enregistrement de la facture, et celles que le cheptel avait déjà ajoutées sous ces numéros : l'achat les reprend.
  const reprises = (b: BoucleStock) =>
    b.factureId === facture.id || (!!b.depuisCheptel && tousLesNumeros.has(b.numero));
  const anciennes = new Map(boucles.filter(reprises).map((b) => [`${b.article}|${b.numero}`, b]));
  const autres = boucles.filter((b) => !reprises(b));
  return [
    ...autres,
    ...achetees.map(({ numero, article }): BoucleStock => {
      const ancienne = anciennes.get(`${article}|${numero}`);
      return {
        ...ancienne,
        depuisCheptel: undefined,
        id: ancienne?.id ?? generateId(),
        article,
        espece,
        numero,
        dateAchat: facture.date,
        factureId: facture.id,
      };
    }),
  ];
}

/** Le premier numéro de la plage déjà dans l'inventaire (acheté sur une autre facture), pour refuser un doublon. */
export function numeroDejaEnStock(
  archive: Pick<ArchiveStock, 'boucles'>,
  numeros: string[],
  factureId?: string,
  /** La sorte de boucles de l'achat : un même numéro peut exister en boucle et en boucle rouge. */
  article?: string,
): string | undefined {
  const pris = new Set(
    (archive.boucles ?? [])
      .filter((b) => b.factureId !== factureId && !b.depuisCheptel && (!article || b.article === article))
      .map((b) => b.numero),
  );
  return numeros.find((numero) => pris.has(numero));
}

/**
 * Ce qui empêche d'enregistrer un achat de boucles : le premier numéro manque, la plage est trop grande, ou l'un des numéros
 * est déjà dans l'inventaire (acheté sur une autre facture). Rien pour un achat qui n'est pas un achat de boucles.
 */
export function erreurAchatBoucles(
  archive: Pick<ArchiveStock, 'boucles'>,
  achat: Pick<Facture, 'stockArticle' | 'stockQuantite' | 'bouclesDebut' | 'lignesProduction' | 'montant'> & {
    id?: string;
  },
): string | undefined {
  const T = TEXTES.comptabilite.nouvelleEcriture.stockProduction;
  for (const ligne of lignesProductionDe(achat)) {
    if (!estBoucleNumerotee(ligne.article)) continue;
    const quantite = Math.round(ligne.quantite ?? 0);
    if (quantite > BOUCLES_MAX_PAR_ACHAT) return T.tropDeBoucles(BOUCLES_MAX_PAR_ACHAT);
    const numeros = plageDeBoucles(ligne.bouclesDebut ?? '', quantite);
    if (!numeros) return T.premiereBoucleRequise;
    const pris = numeroDejaEnStock(archive, numeros, achat.id, ligne.article);
    if (pris) return T.dejaEnStock(pris);
  }
  return undefined;
}

/** Un animal enregistré avec son numéro de boucle (ce que l'inventaire des boucles lit du cheptel). */
type AnimalBouclable = Pick<
  Chevre,
  | 'id'
  | 'numeroBoucle'
  | 'dateBouclage'
  | 'numeroBoucleRouge'
  | 'dateBoucleRouge'
  | 'dateRebouclage'
  | 'espece'
>;

const ARTICLE_BOUCLES = `${GENRE_ARTICLE.BOUCLE}:${ARTICLE_BOUCLE.BOUCLES}`;
const ARTICLE_ROUGES = `${GENRE_ARTICLE.BOUCLE}:${ARTICLE_BOUCLE.ROUGES}`;
const ARTICLE_TIPTAG = `${GENRE_ARTICLE.BOUCLE}:${ARTICLE_BOUCLE.TIPTAG}`;
const ARTICLE_REBOUCLAGE = `${GENRE_ARTICLE.BOUCLE}:${ARTICLE_BOUCLE.REBOUCLAGE}`;

/**
 * La sorte d'un numéro de boucle : celle de l'inventaire quand il l'y trouve (acheté, ou repris d'une synchronisation), sinon un
 * tiptag si l'utilisateur l'a désigné, sinon une boucle normale. Rien ne se devine d'après le numéro.
 */
type SorteDuNumero = (numero: string) => string;

const sorteDesNumeros = (boucles: BoucleStock[], tiptags?: ReadonlySet<string>): SorteDuNumero => {
  const connues = new Map(
    boucles.filter((b) => !estBoucleDeRemplacement(b.article)).map((b) => [b.numero.trim(), b.article]),
  );
  return (numero) => connues.get(numero) ?? (tiptags?.has(numero) ? ARTICLE_TIPTAG : ARTICLE_BOUCLES);
};

/** Les boucles qu'un animal porte : sa boucle (ou son tiptag) et, quand il en a une, sa boucle rouge (avec leur date de pose). */
const bouclesPortees = (
  animal: AnimalBouclable,
  sorteDe: SorteDuNumero,
): { article: string; numero: string; date?: string }[] =>
  [
    {
      article: sorteDe(animal.numeroBoucle?.trim() ?? ''),
      numero: animal.numeroBoucle?.trim(),
      date: animal.dateBouclage,
    },
    {
      article: ARTICLE_ROUGES,
      // La boucle rouge n'a pas de numéro : la liste montre celui de la boucle de l'animal (la boucle cassée remplacée).
      numero:
        animal.numeroBoucleRouge?.trim() ||
        (animal.dateBoucleRouge ? animal.numeroBoucle?.trim() : undefined),
      date: animal.dateBoucleRouge,
    },
    {
      article: ARTICLE_REBOUCLAGE,
      // La boucle de rebouclage n'a pas de numéro : la liste montre celui de la boucle de l'animal (la boucle remplacée).
      numero: animal.dateRebouclage ? animal.numeroBoucle?.trim() : undefined,
      date: animal.dateRebouclage,
    },
  ].filter((b): b is { article: string; numero: string; date: string | undefined } => !!b.numero);

const cleBoucle = (article: string, numero: string): string => `${article}|${numero.trim()}`;

/** Une boucle numérotée que ni une facture ni une date d'achat ne rattache à un achat : elle n'a jamais été commandée. */
const neuveSansAchat = (b: BoucleStock): boolean =>
  !b.depuisCheptel && !b.factureId && !b.dateAchat && !estBoucleDeRemplacement(b.article);

/** Une boucle qui n'existe que tant qu'un animal la porte : celle que le cheptel a ajoutée, ou que nulle commande n'a achetée. */
const nExisteQueSiPortee = (b: BoucleStock): boolean => !!b.depuisCheptel || neuveSansAchat(b);

/** Vrai quand les animaux de cette espèce portent des boucles (pas les poules, ni les animaux domestiques). */
const porteDesBoucles = (animal: Pick<Chevre, 'espece'>): boolean =>
  !ESPECES_SANS_BOUCLE.includes(especeDe(animal));

/**
 * L'inventaire avec les poses d'après le cheptel : une boucle est posée quand un animal porte son numéro (à la date de bouclage
 * de l'animal), et redevient à poser quand plus aucun ne le porte. Chaque pose est un retrait de l'article, qui se refait à
 * chaque fois : le niveau d'une boucle est donc le nombre de boucles non posées. Avec `aAjouter` (les animaux qu'on vient
 * d'enregistrer), leur numéro est ajouté à l'inventaire quand il n'y est pas : c'est une boucle posée, entrée en même temps,
 * avec la date de pose seulement si l'animal a une date de bouclage. Les numéros que `tiptags` désigne entrent comme tiptag.
 */
export function avecPoses(
  archive: ArchiveStock,
  animaux: AnimalBouclable[],
  aAjouter: AnimalBouclable[] = [],
  tiptags?: ReadonlySet<string>,
): ArchiveStock {
  const sorteDe = sorteDesNumeros(archive.boucles ?? [], tiptags);
  const portees = new Map<string, { animal: AnimalBouclable; date?: string }>();
  for (const animal of animaux) {
    for (const b of bouclesPortees(animal, sorteDe)) {
      // Un numéro porté par plusieurs animaux (une ancienne fiche, un numéro repris) : celui qui a une date de pose l'emporte.
      const dejaVu = portees.get(cleBoucle(b.article, b.numero));
      if (!dejaVu || (!dejaVu.date && b.date))
        portees.set(cleBoucle(b.article, b.numero), { animal, date: b.date });
    }
  }
  // Une boucle jamais commandée est de celles du cheptel : elle entre au stock quand un animal la porte et en sort avec lui.
  let inventaire = (archive.boucles ?? []).map((b) => (neuveSansAchat(b) ? { ...b, depuisCheptel: true } : b));
  for (const animal of aAjouter) {
    if (!porteDesBoucles(animal)) continue;
    for (const portee of bouclesPortees(animal, sorteDe)) {
      if (inventaire.some((x) => x.article === portee.article && x.numero.trim() === portee.numero)) continue;
      inventaire = [
        ...inventaire,
        {
          id: generateId(),
          article: portee.article,
          numero: portee.numero,
          espece: especeDe(animal),
          depuisCheptel: true,
        },
      ];
    }
  }
  const boucles = inventaire
    // Une boucle ajoutée depuis une fiche n'existe que tant qu'un animal la porte.
    .filter((x) => !x.depuisCheptel || portees.has(cleBoucle(x.article, x.numero)))
    .map((boucle): BoucleStock => {
      const portee = portees.get(cleBoucle(boucle.article, boucle.numero));
      if (!portee) return { ...boucle, datePose: undefined, chevreId: undefined };
      // Posée sur un animal : la boucle est de son espèce.
      return {
        ...boucle,
        espece: boucle.espece ?? especeDe(portee.animal),
        chevreId: portee.animal.id,
        datePose: portee.date ?? boucle.datePose,
      };
    });
  const mouvements = boucles.flatMap((b) => {
    if (!b.chevreId) return [];
    // Sans date de bouclage, la pose se range à la date d'achat (ou, à défaut, à aujourd'hui) dans l'historique.
    const date = b.datePose ?? b.dateAchat ?? todayISO();
    const pose = {
      id: `pose-${b.id}`,
      article: b.article,
      date,
      delta: -1,
      origine: ORIGINE_MOUVEMENT.CONSOMMATION,
      boucleId: b.id,
    };
    // Une boucle ajoutée depuis une fiche entre au stock le jour où elle est posée (pas une boucle rouge : elle s'est achetée en quantité).
    return b.depuisCheptel && !estBoucleDeRemplacement(b.article)
      ? [{ ...pose, id: `entree-${b.id}`, delta: 1, origine: ORIGINE_MOUVEMENT.ACHAT }, pose]
      : [pose];
  });
  return {
    ...archive,
    boucles,
    mouvements: [...archive.mouvements.filter((m) => !m.boucleId), ...mouvements],
  };
}

/**
 * La date de pose d'une boucle d'après la fiche de l'animal qui la porte : sa date de bouclage, ou celle de sa boucle rouge ou de
 * son rebouclage selon la sorte de la boucle. Les listes la montrent telle que la fiche la donne, même avant la synchronisation.
 */
export function datePoseSelonLAnimal(
  article: string,
  animal: Pick<Chevre, 'dateBouclage' | 'dateBoucleRouge' | 'dateRebouclage'> | undefined,
): string | undefined {
  if (!animal) return undefined;
  const date =
    article === ARTICLE_ROUGES
      ? animal.dateBoucleRouge
      : article === ARTICLE_REBOUCLAGE
        ? animal.dateRebouclage
        : animal.dateBouclage;
  return date || undefined;
}

/**
 * Les boucles de l'inventaire telles que le cheptel les donne à l'instant : une boucle (ou un tiptag) est posée quand un animal de
 * son espèce porte son numéro (sa date de pose est la date de bouclage de l'animal), et à poser sinon. Une boucle rouge ou de
 * rebouclage garde son animal, avec la date de sa fiche. Les listes s'en servent pour montrer toujours l'état des fiches, même quand
 * l'inventaire n'a pas encore été remis à jour.
 */
export function bouclesSelonLeCheptel(boucles: BoucleStock[], animaux: Chevre[]): BoucleStock[] {
  const parNumero = new Map<string, Chevre>();
  for (const animal of animaux) {
    const numero = animal.numeroBoucle?.trim();
    if (!numero) continue;
    const cle = `${especeDe(animal)}|${numero}`;
    const dejaVu = parNumero.get(cle);
    // Un numéro porté par plusieurs animaux : celui qui a une date de bouclage l'emporte.
    if (!dejaVu || (!dejaVu.dateBouclage && animal.dateBouclage)) parNumero.set(cle, animal);
  }
  const parId = new Map(animaux.map((a) => [a.id, a]));
  return boucles
    .map((b): BoucleStock => {
      if (estBoucleDeRemplacement(b.article)) {
        const animal = b.chevreId ? parId.get(b.chevreId) : undefined;
        // L'animal n'est plus au cheptel : la boucle n'est plus posée.
        if (!animal) return { ...b, chevreId: undefined, datePose: undefined };
        return { ...b, datePose: datePoseSelonLAnimal(b.article, animal) ?? b.datePose };
      }
      const animal = parNumero.get(`${especeDeLaBoucle(b)}|${b.numero.trim()}`);
      return animal
        ? { ...b, chevreId: animal.id, datePose: datePoseSelonLAnimal(b.article, animal) ?? b.datePose }
        : { ...b, chevreId: undefined, datePose: undefined };
    })
    // Une boucle ajoutée depuis le cheptel ou jamais commandée n'existe que tant qu'un animal la porte.
    .filter((b) => !nExisteQueSiPortee(b) || !!b.chevreId);
}

/** Une pose à la fois : plusieurs enregistrements d'animaux d'affilée ne se mélangent pas. */
let file: Promise<unknown> = Promise.resolve();

/**
 * Met l'inventaire des boucles en accord avec le cheptel (à appeler quand un animal est enregistré ou supprimé). Avec l'animal
 * qu'on vient d'enregistrer, son numéro est vérifié dans l'inventaire et ajouté s'il y manque.
 */
export function synchroniserPoseBoucles(enregistre?: AnimalBouclable): Promise<void> {
  const suite = file.then(async () => {
    // Désactivée dans les réglages de la comptabilité : l'inventaire et le cheptel ne se parlent plus.
    if (!synchroBouclesActive((await getSettings()).exploitation)) return;
    const archive = await lireArchiveStock();
    const aVerifier =
      !!enregistre &&
      porteDesBoucles(enregistre) &&
      !!(
        enregistre.numeroBoucle?.trim() ||
        enregistre.numeroBoucleRouge?.trim() ||
        enregistre.dateBoucleRouge ||
        enregistre.dateRebouclage
      );
    if (!archive.boucles?.length && !aVerifier) return;
    const animaux = await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL);
    const nouvelle = avecPoses(archive, animaux, enregistre ? [enregistre] : []);
    const etat = (a: ArchiveStock) => JSON.stringify([a.boucles, a.mouvements.filter((m) => m.boucleId)]);
    if (etat(nouvelle) !== etat(archive)) await remplacerArchiveStock(nouvelle);
  });
  file = suite.catch(() => undefined);
  return suite;
}

/** Les boucles d'un article (ou de tous), posées ou non. */
export const bouclesDeLInventaire = (
  archive: Pick<ArchiveStock, 'boucles'>,
  etat: ValeurDe<typeof ETAT_BOUCLE>,
  article?: string,
): BoucleStock[] =>
  bouclesDeLEspece(archive.boucles).filter(
    (b) =>
      (!article || b.article === article) &&
      (etat === ETAT_BOUCLE.TOUT || !!b.chevreId === (etat === ETAT_BOUCLE.POSEE)),
  );

/** Les boucles triées d'après une colonne (le numéro, la date de pose ou la date d'achat) ; les sans-date à la fin. */
export function trierBoucles(
  boucles: BoucleStock[],
  tri: ValeurDe<typeof TRI_BOUCLE>,
  croissant: boolean,
): BoucleStock[] {
  const sens = croissant ? 1 : -1;
  const parDate = (a?: string, b?: string) => (!a ? 1 : !b ? -1 : a.localeCompare(b) * sens);
  return [...boucles].sort((a, b) => {
    const dates =
      tri === TRI_BOUCLE.POSE
        ? parDate(a.datePose, b.datePose)
        : tri === TRI_BOUCLE.ACHAT
          ? parDate(a.dateAchat, b.dateAchat)
          : 0;
    return dates || comparerNumeros(a.numero, b.numero) * sens;
  });
}

/** Un numéro de boucle porté par un animal, à ranger parmi les tiptag ou les boucles normales lors de la synchronisation. */
export interface BouclePossible {
  numero: string;
  /** Vrai quand l'inventaire le tient déjà pour un tiptag (d'une synchronisation précédente). */
  tiptag: boolean;
}

/**
 * Les numéros de boucle (hors boucles rouges) que portent les animaux du cheptel, sans ceux que l'inventaire a achetés : ce sont
 * ceux dont l'utilisateur dit, à la synchronisation, lesquels sont des tiptag. Triés comme on les lit.
 */
export async function bouclesPossiblesDuCheptel(): Promise<BouclePossible[]> {
  const [archive, animaux] = await Promise.all([
    lireArchiveStock(),
    loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL),
  ]);
  const inventaire = archive.boucles ?? [];
  const achetees = new Set(
    inventaire.filter((b) => !b.depuisCheptel && !estBoucleDeRemplacement(b.article)).map((b) => b.numero),
  );
  const tiptags = new Set(
    inventaire.filter((b) => b.depuisCheptel && b.article === ARTICLE_TIPTAG).map((b) => b.numero),
  );
  const numeros = new Set<string>();
  for (const animal of animaux.filter(porteDesBoucles)) {
    const numero = animal.numeroBoucle?.trim();
    if (numero && !achetees.has(numero)) numeros.add(numero);
  }
  return [...numeros].sort(comparerNumeros).map((numero) => ({ numero, tiptag: tiptags.has(numero) }));
}

/**
 * La synchronisation de l'inventaire avec le cheptel : les boucles déjà reprises du cheptel sont supprimées de l'inventaire, puis
 * reprises d'après les animaux — les numéros de `tiptags` entrent comme tiptag, les autres comme boucles normales (les boucles
 * rouges suivent leur fiche). Les boucles achetées par une dépense ne changent pas. Rend le nombre de boucles reprises.
 */
export function synchroniserBouclesDuCheptel(tiptags: string[]): Promise<number> {
  const suite = file.then(async () => {
    const archive = await lireArchiveStock();
    const animaux = await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL);
    const sansReprises = { ...archive, boucles: (archive.boucles ?? []).filter((b) => !b.depuisCheptel) };
    const nouvelle = avecPoses(sansReprises, animaux, animaux, new Set(tiptags));
    await remplacerArchiveStock(nouvelle);
    return (nouvelle.boucles ?? []).filter((b) => b.depuisCheptel).length;
  });
  file = suite.catch(() => undefined);
  return suite;
}
