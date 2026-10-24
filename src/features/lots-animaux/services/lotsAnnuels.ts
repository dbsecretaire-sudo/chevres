import type { Chevre } from '@/features/cheptel/types';
import { estTiptag } from '@/features/cheptel/utils/tiptag';
import type { LotAnimaux } from '@/features/settings/settings';
import { bouclesDuLot, nomLibre } from '@/features/lots-animaux/services/lots';
import { SEXE, STATUT_CHEVRE, agePetitMax } from '@/shared/constants/cheptel';
import { CATEGORIE_LOT } from '@/shared/constants/lots';
import { ageAtteint } from '@/shared/utils/age';
import { generateId } from '@/shared/utils/id';
import { TEXTES } from '@/shared/textes';

/**
 * Les lots d'une année : mises à la reproduction, avortements et renouvellement. Un lot par année et par catégorie, créé tout seul ; son
 * nom est celui de son année (qui se change dans le lot) et on y ajoute ou retire des animaux. La fiche d'un animal les ajoute d'un bouton.
 */
export const CATEGORIES_ANNUELLES = [CATEGORIE_LOT.REPRODUCTION, CATEGORIE_LOT.AVORTEMENT, CATEGORIE_LOT.RENOUVELLEMENT] as const;
export type CategorieAnnuelle = (typeof CATEGORIES_ANNUELLES)[number];

export const estCategorieAnnuelle = (categorie: string | undefined): categorie is CategorieAnnuelle =>
  (CATEGORIES_ANNUELLES as readonly (string | undefined)[]).includes(categorie);

/** L'année d'un lot d'une année (mises bas pour la reproduction, de l'avortement, de désignation au renouvellement). */
export function anneeDuLot(lot: LotAnimaux): number | undefined {
  switch (lot.categorie) {
    case CATEGORIE_LOT.REPRODUCTION:
      return lot.reproduction;
    case CATEGORIE_LOT.AVORTEMENT:
      return lot.avortement;
    case CATEGORIE_LOT.RENOUVELLEMENT:
      return lot.renouvellement;
    default:
      return undefined;
  }
}

/** Le nom du lot d'une année : « Avortements 2026 ». */
export function nomDuLotAnnuel(categorie: CategorieAnnuelle, annee: number): string {
  const T = TEXTES.cheptel.lots;
  return categorie === CATEGORIE_LOT.AVORTEMENT
    ? T.avortementAnnee(annee)
    : categorie === CATEGORIE_LOT.RENOUVELLEMENT
      ? T.renouvellementAnnee(annee)
      : T.reproductionAnnee(annee);
}

/** Le lot lui-même avec une autre année : son nom la suit. */
export function avecAnnee(lot: LotAnimaux, annee: number): LotAnimaux {
  const categorie = lot.categorie as CategorieAnnuelle;
  const champ = categorie === CATEGORIE_LOT.AVORTEMENT ? 'avortement' : categorie === CATEGORIE_LOT.RENOUVELLEMENT ? 'renouvellement' : 'reproduction';
  return { ...lot, [champ]: annee, nom: nomDuLotAnnuel(categorie, annee) };
}

/** Les lots de cette catégorie pour cette année. */
export const lotsAnnuels = (lots: LotAnimaux[], categorie: CategorieAnnuelle, annee: number): LotAnimaux[] =>
  lots.filter((l) => l.categorie === categorie && anneeDuLot(l) === annee);

/** Vrai quand un autre lot de la même catégorie a déjà cette année : deux lots n'ont pas la même année. */
export const anneeDeLotPrise = (lots: LotAnimaux[], lot: LotAnimaux, annee: number): boolean =>
  lots.some((l) => l.id !== lot.id && l.categorie === lot.categorie && anneeDuLot(l) === annee);

/**
 * Ajoute une boucle au lot de la catégorie pour l'année (le lot se crée s'il n'existe pas). Rend les lots et le lot concerné.
 */
export function ajouterAuLotAnnuel(
  lots: LotAnimaux[],
  categorie: CategorieAnnuelle,
  annee: number,
  boucle: string,
  nouvelId: () => string = generateId,
): { lots: LotAnimaux[]; lot: LotAnimaux } {
  const existant = lotsAnnuels(lots, categorie, annee)[0];
  if (existant) {
    const boucles = bouclesDuLot(existant);
    if (boucles.includes(boucle)) return { lots, lot: existant };
    const lot = { ...existant, boucles: [...boucles, boucle].sort().join(', ') };
    return { lots: lots.map((l) => (l.id === lot.id ? lot : l)), lot };
  }
  const lot = avecAnnee(
    { id: nouvelId(), nom: nomLibre(nomDuLotAnnuel(categorie, annee), lots), boucles: boucle, categorie },
    annee,
  );
  return { lots: [...lots, lot], lot };
}

/**
 * Signale un avortement d'une femelle pour une année : elle rejoint le lot d'avortements de l'année (créé s'il manque), et chaque signalement de plus
 * dans la même année compte un avortement de plus (« 2 Avortements 2026 »).
 */
export function signalerUnAvortement(
  lots: LotAnimaux[],
  boucle: string,
  annee: number,
  nouvelId: () => string = generateId,
): { lots: LotAnimaux[]; lot: LotAnimaux } {
  const avant = lotsAnnuels(lots, CATEGORIE_LOT.AVORTEMENT, annee)[0];
  const deja = avant && bouclesDuLot(avant).includes(boucle) ? nombreDAvortements(avant, boucle) : 0;
  const ajout = ajouterAuLotAnnuel(lots, CATEGORIE_LOT.AVORTEMENT, annee, boucle, nouvelId);
  const lot: LotAnimaux = { ...ajout.lot, avortements: { ...(ajout.lot.avortements ?? {}), [boucle]: deja + 1 } };
  return { lots: ajout.lots.map((l) => (l.id === lot.id ? lot : l)), lot };
}

/** Combien d'avortements une femelle a eus dans l'année d'un lot : le nombre noté, ou un seul pour une boucle du lot sans chiffre ; rien si elle n'y est pas. */
export const nombreDAvortements = (lot: LotAnimaux, boucle: string): number =>
  bouclesDuLot(lot).includes(boucle) ? Math.max(1, lot.avortements?.[boucle] ?? 1) : 0;

/** Les lots d'une année qui contiennent cette boucle : de quoi les afficher sur la fiche de l'animal (les plus récents d'abord). */
export const lotsAnnuelsDeLAnimal = (lots: LotAnimaux[], boucle: string | undefined): LotAnimaux[] =>
  !boucle
    ? []
    : lots
        .filter((l) => estCategorieAnnuelle(l.categorie) && bouclesDuLot(l).includes(boucle))
        .sort((a, b) => (anneeDuLot(b) ?? 0) - (anneeDuLot(a) ?? 0) || a.nom.localeCompare(b.nom));

/**
 * Vrai quand un animal peut rejoindre le lot de la catégorie : il lui faut une boucle (un lot est fait de boucles) ; pour le renouvellement,
 * tout animal vivant ; pour les mises à la reproduction et les avortements, une femelle vivante qui a atteint sa majorité sexuelle.
 */
export function peutRejoindreLeLot(
  categorie: CategorieAnnuelle,
  animal: Chevre,
  jour: string,
  tiptags: ReadonlySet<string> = new Set(),
): boolean {
  if (!animal.numeroBoucle?.trim() || animal.statut !== STATUT_CHEVRE.VIVANTE) return false;
  // Règle d'or : un tiptag est destiné à l'abattoir, pas au renouvellement.
  if (categorie === CATEGORIE_LOT.RENOUVELLEMENT) return !estTiptag(animal, tiptags);
  return animal.sexe === SEXE.FEMELLE && ageAtteint(animal.dateNaissance, agePetitMax(), jour);
}

/**
 * Vrai quand une femelle peut figurer au lot de mises à la reproduction (ou d'avortements) d'une année : elle a une boucle, et elle était dans
 * le troupeau avec sa majorité sexuelle (6 mois pour les chèvres) assez tôt pour mettre bas dans l'année : la gestation dure 5 mois, la saillie
 * se fait donc au plus tard fin juillet. Une chèvre née en janvier est proposée pour la même année, une née en décembre l'est pour l'année
 * suivante, même morte depuis ; une chèvre sortie avant sa majorité ne l'est pas.
 */
export function peutRejoindreLeLotDeLAnnee(animal: Chevre, annee: number): boolean {
  if (!animal.numeroBoucle?.trim() || animal.sexe !== SEXE.FEMELLE || !animal.dateNaissance) return false;
  if (animal.statut === STATUT_CHEVRE.MORT_NE) return false;
  const debut = `${annee}-01-01`;
  // La dernière saillie qui mène à une mise bas dans l'année : 5 mois de gestation avant le 31 décembre.
  const fin = `${annee}-07-31`;
  const sortie = animal.statut !== STATUT_CHEVRE.VIVANTE ? animal.dateStatut : undefined;
  // Sortie avant l'année : plus là. Sortie dans l'année : on prend ce jour-là, sinon la fin de l'année.
  if (sortie && sortie < debut) return false;
  const dernierJour = sortie && sortie < fin ? sortie : fin;
  return animal.dateNaissance < dernierJour && ageAtteint(animal.dateNaissance, agePetitMax(), dernierJour);
}

/** Le lot d'avortements de l'année courante, créé (vide) quand il manque : on y ajoute les femelles d'un geste. Rend les lots, ou rien. */
export function lotsDAvortementDeLAnnee(lots: LotAnimaux[], anneeCourante: number, nouvelId: () => string = generateId): LotAnimaux[] | null {
  if (lotsAnnuels(lots, CATEGORIE_LOT.AVORTEMENT, anneeCourante).length > 0) return null;
  return [
    ...lots,
    avecAnnee({ id: nouvelId(), nom: nomLibre(nomDuLotAnnuel(CATEGORIE_LOT.AVORTEMENT, anneeCourante), lots), boucles: '', categorie: CATEGORIE_LOT.AVORTEMENT }, anneeCourante),
  ];
}

/** Le nombre de femelles ayant avorté une année : celles de son lot d'avortements ; rien quand l'année n'a pas de lot. */
export function chevresAyantAvorte(lots: LotAnimaux[], annee: number): number | undefined {
  const deLAnnee = lotsAnnuels(lots, CATEGORIE_LOT.AVORTEMENT, annee);
  if (deLAnnee.length === 0) return undefined;
  return new Set(deLAnnee.flatMap((l) => bouclesDuLot(l))).size;
}
