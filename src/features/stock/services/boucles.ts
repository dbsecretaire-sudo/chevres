import type { Chevre } from '@/features/cheptel/types';
import { especeDe } from '@/features/cheptel/utils/espece';
import type { Facture } from '@/features/comptabilite/types';
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
  PREFIXE_TIPTAG,
  TRI_BOUCLE,
} from '@/shared/constants/stock';
import { loadAllYears } from '@/shared/storage/localStore';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { TEXTES } from '@/shared/textes';
import { todayISO } from '@/shared/utils/dates';
import { generateId } from '@/shared/utils/id';

/** Au plus ce nombre de chiffres dans un numéro de boucle : au-delà, les additions ne sont plus exactes. */
const CHIFFRES_MAX = 15;

/** Vrai pour un article de l'inventaire qui est une boucle d'identification (« boucle:boucles », « boucle:rouges », « boucle:tiptag »). */
export const estArticleBoucle = (cle: string | undefined): boolean =>
  !!cle && cle.startsWith(`${GENRE_ARTICLE.BOUCLE}:`);

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
  facture: Pick<Facture, 'id' | 'date' | 'stockArticle' | 'stockQuantite' | 'bouclesDebut'>,
): BoucleStock[] {
  const numeros =
    estArticleBoucle(facture.stockArticle) && facture.bouclesDebut
      ? plageDeBoucles(facture.bouclesDebut, facture.stockQuantite ?? 0)
      : undefined;
  // Celles de l'ancien enregistrement de la facture, et celles que le cheptel avait déjà ajoutées sous ces numéros : l'achat les reprend.
  const reprises = (b: BoucleStock) =>
    b.factureId === facture.id || (!!b.depuisCheptel && !!numeros?.includes(b.numero));
  const anciennes = new Map(boucles.filter(reprises).map((b) => [b.numero, b]));
  const autres = boucles.filter((b) => !reprises(b));
  if (!numeros) return autres;
  return [
    ...autres,
    ...numeros.map((numero): BoucleStock => ({
      ...anciennes.get(numero),
      depuisCheptel: undefined,
      id: anciennes.get(numero)?.id ?? generateId(),
      article: facture.stockArticle as string,
      numero,
      dateAchat: facture.date,
      factureId: facture.id,
    })),
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
  achat: Pick<Facture, 'stockArticle' | 'stockQuantite' | 'bouclesDebut'> & { id?: string },
): string | undefined {
  if (!estArticleBoucle(achat.stockArticle)) return undefined;
  const T = TEXTES.comptabilite.nouvelleEcriture.stockProduction;
  const quantite = Math.round(achat.stockQuantite ?? 0);
  if (quantite > BOUCLES_MAX_PAR_ACHAT) return T.tropDeBoucles(BOUCLES_MAX_PAR_ACHAT);
  const numeros = plageDeBoucles(achat.bouclesDebut ?? '', quantite);
  if (!numeros) return T.premiereBoucleRequise;
  const pris = numeroDejaEnStock(archive, numeros, achat.id, achat.stockArticle);
  return pris ? T.dejaEnStock(pris) : undefined;
}

/** Un animal enregistré avec son numéro de boucle (ce que l'inventaire des boucles lit du cheptel). */
type AnimalBouclable = Pick<
  Chevre,
  'id' | 'numeroBoucle' | 'dateBouclage' | 'numeroBoucleRouge' | 'dateBoucleRouge' | 'espece'
>;

const ARTICLE_BOUCLES = `${GENRE_ARTICLE.BOUCLE}:${ARTICLE_BOUCLE.BOUCLES}`;
const ARTICLE_ROUGES = `${GENRE_ARTICLE.BOUCLE}:${ARTICLE_BOUCLE.ROUGES}`;
const ARTICLE_TIPTAG = `${GENRE_ARTICLE.BOUCLE}:${ARTICLE_BOUCLE.TIPTAG}`;

/** La sorte d'une boucle d'après son numéro : un numéro qui commence par 00 est un tiptag, les autres sont des boucles normales. */
export const articleDeLaBoucle = (numero: string): string =>
  numero.trim().startsWith(PREFIXE_TIPTAG) ? ARTICLE_TIPTAG : ARTICLE_BOUCLES;

/** Les boucles qu'un animal porte : sa boucle (ou son tiptag) et, quand il en a une, sa boucle rouge (avec leur date de pose). */
const bouclesPortees = (animal: AnimalBouclable): { article: string; numero: string; date?: string }[] =>
  [
    {
      article: articleDeLaBoucle(animal.numeroBoucle ?? ''),
      numero: animal.numeroBoucle?.trim(),
      date: animal.dateBouclage,
    },
    { article: ARTICLE_ROUGES, numero: animal.numeroBoucleRouge?.trim(), date: animal.dateBoucleRouge },
  ].filter((b): b is { article: string; numero: string; date: string | undefined } => !!b.numero);

const cleBoucle = (article: string, numero: string): string => `${article}|${numero}`;

/** Vrai quand les animaux de cette espèce portent des boucles (pas les poules, ni les animaux domestiques). */
const porteDesBoucles = (animal: Pick<Chevre, 'espece'>): boolean =>
  !ESPECES_SANS_BOUCLE.includes(especeDe(animal));

/**
 * L'inventaire avec les poses d'après le cheptel : une boucle est posée quand un animal porte son numéro (à la date de bouclage
 * de l'animal), et redevient à poser quand plus aucun ne le porte. Chaque pose est un retrait de l'article, qui se refait à
 * chaque fois : le niveau d'une boucle est donc le nombre de boucles non posées. Avec `aAjouter` (les animaux qu'on vient
 * d'enregistrer), leur numéro est ajouté à l'inventaire quand il n'y est pas : c'est une boucle posée, entrée en même temps,
 * avec la date de pose seulement si l'animal a une date de bouclage.
 */
export function avecPoses(
  archive: ArchiveStock,
  animaux: AnimalBouclable[],
  aAjouter: AnimalBouclable[] = [],
): ArchiveStock {
  const portees = new Map<string, { animal: AnimalBouclable; date?: string }>();
  for (const animal of animaux) {
    for (const b of bouclesPortees(animal)) {
      if (!portees.has(cleBoucle(b.article, b.numero)))
        portees.set(cleBoucle(b.article, b.numero), { animal, date: b.date });
    }
  }
  let inventaire = archive.boucles ?? [];
  for (const animal of aAjouter) {
    if (!porteDesBoucles(animal)) continue;
    for (const portee of bouclesPortees(animal)) {
      if (inventaire.some((x) => x.article === portee.article && x.numero === portee.numero)) continue;
      inventaire = [
        ...inventaire,
        { id: generateId(), article: portee.article, numero: portee.numero, depuisCheptel: true },
      ];
    }
  }
  const boucles = inventaire
    // Une boucle ajoutée depuis une fiche n'existe que tant qu'un animal la porte.
    .filter((x) => !x.depuisCheptel || portees.has(cleBoucle(x.article, x.numero)))
    .map((boucle): BoucleStock => {
      const portee = portees.get(cleBoucle(boucle.article, boucle.numero));
      if (!portee) return { ...boucle, datePose: undefined, chevreId: undefined };
      return { ...boucle, chevreId: portee.animal.id, datePose: portee.date ?? boucle.datePose };
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
    // Une boucle ajoutée depuis une fiche entre au stock le jour où elle est posée.
    return b.depuisCheptel
      ? [{ ...pose, id: `entree-${b.id}`, delta: 1, origine: ORIGINE_MOUVEMENT.ACHAT }, pose]
      : [pose];
  });
  return {
    ...archive,
    boucles,
    mouvements: [...archive.mouvements.filter((m) => !m.boucleId), ...mouvements],
  };
}

/** Une pose à la fois : plusieurs enregistrements d'animaux d'affilée ne se mélangent pas. */
let file: Promise<unknown> = Promise.resolve();

/**
 * Met l'inventaire des boucles en accord avec le cheptel (à appeler quand un animal est enregistré ou supprimé). Avec l'animal
 * qu'on vient d'enregistrer, son numéro est vérifié dans l'inventaire et ajouté s'il y manque.
 */
export function synchroniserPoseBoucles(enregistre?: AnimalBouclable): Promise<void> {
  const suite = file.then(async () => {
    const archive = await lireArchiveStock();
    const aVerifier = !!enregistre && porteDesBoucles(enregistre) && bouclesPortees(enregistre).length > 0;
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
  (archive.boucles ?? []).filter(
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

/**
 * REPRISE UNIQUE — à retirer une fois faite : les animaux du cheptel qui portent déjà une boucle absente de l'inventaire
 * (saisies avant l'inventaire des boucles) y sont ajoutés, comme des boucles posées. Garde sa trace pour ne plus être proposée.
 */
export async function bouclesDuCheptelAReprendre(): Promise<number> {
  const archive = await lireArchiveStock();
  if (archive.bouclesDuCheptelReprises) return 0;
  const animaux = await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL);
  return (avecPoses(archive, animaux, animaux).boucles ?? []).length - (archive.boucles ?? []).length;
}

/** Fait la reprise unique (voir bouclesDuCheptelAReprendre) et rend le nombre de boucles ajoutées. */
export function reprendreLesBouclesDuCheptel(): Promise<number> {
  const suite = file.then(async () => {
    const archive = await lireArchiveStock();
    const animaux = await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL);
    const nouvelle = avecPoses(archive, animaux, animaux);
    await remplacerArchiveStock({ ...nouvelle, bouclesDuCheptelReprises: true });
    return (nouvelle.boucles ?? []).length - (archive.boucles ?? []).length;
  });
  file = suite.catch(() => undefined);
  return suite;
}
