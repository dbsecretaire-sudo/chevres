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
  TRI_BOUCLE,
} from '@/shared/constants/stock';
import { loadAllYears } from '@/shared/storage/localStore';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { TEXTES } from '@/shared/textes';
import { todayISO } from '@/shared/utils/dates';
import { generateId } from '@/shared/utils/id';

/** Au plus ce nombre de chiffres dans un numéro de boucle : au-delà, les additions ne sont plus exactes. */
const CHIFFRES_MAX = 15;

/** Vrai pour un article de l'inventaire qui est une boucle d'identification (« boucle:boucles », « boucle:rouges »). */
export const estArticleBoucle = (cle: string | undefined): boolean =>
  !!cle && cle.startsWith(`${GENRE_ARTICLE.BOUCLE}:`);

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
): string | undefined {
  const pris = new Set(
    (archive.boucles ?? []).filter((b) => b.factureId !== factureId && !b.depuisCheptel).map((b) => b.numero),
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
  const pris = numeroDejaEnStock(archive, numeros, achat.id);
  return pris ? T.dejaEnStock(pris) : undefined;
}

/** Un animal enregistré avec son numéro de boucle (ce que l'inventaire des boucles lit du cheptel). */
type AnimalBouclable = Pick<Chevre, 'id' | 'numeroBoucle' | 'dateBouclage' | 'espece'>;

/** Vrai quand les animaux de cette espèce portent des boucles (pas les poules, ni les animaux domestiques). */
const porteDesBoucles = (animal: Pick<Chevre, 'espece'>): boolean =>
  !ESPECES_SANS_BOUCLE.includes(especeDe(animal));

/**
 * L'inventaire avec les poses d'après le cheptel : une boucle est posée quand un animal porte son numéro (à la date de bouclage
 * de l'animal), et redevient à poser quand plus aucun ne le porte. Chaque pose est un retrait de l'article, qui se refait à
 * chaque fois : le niveau d'une boucle est donc le nombre de boucles non posées. Avec `enregistre` (l'animal qu'on vient
 * d'enregistrer), son numéro est ajouté à l'inventaire quand il n'y est pas : c'est une boucle posée, entrée en même temps.
 */
export function avecPoses(
  archive: ArchiveStock,
  animaux: AnimalBouclable[],
  enregistre?: AnimalBouclable,
): ArchiveStock {
  const parNumero = new Map<string, AnimalBouclable>();
  for (const animal of animaux) {
    const numero = animal.numeroBoucle?.trim();
    if (numero && !parNumero.has(numero)) parNumero.set(numero, animal);
  }
  let inventaire = archive.boucles ?? [];
  const numeroEnregistre = enregistre?.numeroBoucle?.trim();
  if (
    enregistre &&
    numeroEnregistre &&
    porteDesBoucles(enregistre) &&
    !inventaire.some((b) => b.numero === numeroEnregistre)
  ) {
    inventaire = [
      ...inventaire,
      {
        id: generateId(),
        article: `${GENRE_ARTICLE.BOUCLE}:${ARTICLE_BOUCLE.BOUCLES}`,
        numero: numeroEnregistre,
        depuisCheptel: true,
      },
    ];
  }
  const boucles = inventaire
    // Une boucle ajoutée depuis une fiche n'existe que tant qu'un animal la porte.
    .filter((b) => !b.depuisCheptel || parNumero.has(b.numero))
    .map((boucle): BoucleStock => {
      const animal = parNumero.get(boucle.numero);
      if (!animal) return { ...boucle, datePose: undefined, chevreId: undefined };
      return {
        ...boucle,
        chevreId: animal.id,
        datePose: animal.dateBouclage ?? boucle.datePose ?? todayISO(),
      };
    });
  const mouvements = boucles.flatMap((b) => {
    if (!b.datePose) return [];
    const pose = {
      id: `pose-${b.id}`,
      article: b.article,
      date: b.datePose,
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
    const aVerifier = !!enregistre?.numeroBoucle?.trim() && porteDesBoucles(enregistre);
    if (!archive.boucles?.length && !aVerifier) return;
    const animaux = await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL);
    const nouvelle = avecPoses(archive, animaux, enregistre);
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
      (etat === ETAT_BOUCLE.TOUT || !!b.datePose === (etat === ETAT_BOUCLE.POSEE)),
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
