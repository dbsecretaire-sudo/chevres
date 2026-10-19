import { generateId } from '@/shared/utils/id';
import { todayISO, yearOf } from '@/shared/utils/dates';
import { ageAtteint } from '@/shared/utils/age';
import { cleTriChevre } from '@/features/cheptel/utils/chevreLabel';
import { estTiptag } from '@/features/cheptel/utils/tiptag';
import type { Chevre, Sexe, StatutChevre } from '@/features/cheptel/types';
import { deleteRecord, findRecord, loadAllYears, upsertRecord } from '@/shared/storage/localStore';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { PARAMETRES_ESPECE, SEXE, STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { deEspeceCourante, especeDe } from '@/features/cheptel/utils/espece';
import { especeCourante, type EspeceAnimale } from '@/shared/dictionnaire/animaux';
import { synchroniserPoseBoucles } from '@/features/stock/services/boucles';

/** Animaux vivants de l'espèce courante. */
export async function listChevresVivantes(): Promise<Chevre[]> {
  const all = deEspeceCourante(await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL));
  return all
    .filter((c) => c.statut === STATUT_CHEVRE.VIVANTE)
    .sort((a, b) => cleTriChevre(a).localeCompare(cleTriChevre(b)));
}

/**
 * Les animaux de l'espèce courante présents à une date : nés au plus tard ce jour-là et pas encore sortis (vendus, morts…) — un animal
 * sorti le jour même y était encore. Sert à lister les boucles d'un contrôle ou d'une visite passés.
 */
export async function listChevresPresentesLe(date: string): Promise<Chevre[]> {
  return listAnimauxPresentsLe(especeCourante(), date);
}

/** Les animaux d'une espèce précise présents à une date (voir listChevresPresentesLe) : ceux qu'une facture de cette date peut désigner. */
export async function listAnimauxPresentsLe(espece: EspeceAnimale, date: string): Promise<Chevre[]> {
  const all = (await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL)).filter((c) => especeDe(c) === espece);
  return all
    .filter((c) => {
      // Un animal acheté est présent à partir de son entrée (celle de l'achat), non de sa naissance.
      if ((c.dateEntree ?? c.dateNaissance) && (c.dateEntree ?? c.dateNaissance) > date) return false;
      if (c.statut === STATUT_CHEVRE.VIVANTE || !c.dateStatut) return true;
      return c.dateStatut >= date;
    })
    .sort((a, b) => cleTriChevre(a).localeCompare(cleTriChevre(b)));
}

/** Les animaux vivants d'une espèce : les petits (qui n'ont pas encore l'âge de sevrage) et les autres. */
export interface EffectifVivant {
  petits: number;
  sevres: number;
  /** Les femelles parmi les sevrés : le stock « Chèvre sur pied » et « Chèvre vivante » ne compte qu'elles (les boucs se vendent à part). */
  femelles: number;
  /** Les animaux déjà à l'abattoir qui ne sont pas des petits et dont la viande n'est pas encore facturée : ils vont dans « Chèvre sur pied ». */
  aFacturerAdultes?: number;
}

/** Un animal est un petit tant qu'il n'a pas atteint l'âge de sevrage de son espèce (2 mois pour une chèvre : un cabri). */
export const estPetitLe = (c: Pick<Chevre, 'dateNaissance' | 'espece'>, date: string = todayISO()): boolean =>
  !ageAtteint(c.dateNaissance, PARAMETRES_ESPECE[especeDe(c)].ageSevrage, date);

/**
 * Les effectifs des animaux d'après leurs fiches : les vivants, petits ou sevrés. Avec `facturees` (les animaux que vend une facture du
 * client), les animaux déjà à l'abattoir dont la viande n'est pas encore facturée comptent aussi : les cabris (partis petits) parmi les petits,
 * les autres (les adultes) à part, pour « Chèvre sur pied ».
 */
export function effectifsDesAnimaux(
  all: Chevre[],
  facturees?: ReadonlySet<string>,
  tiptags: ReadonlySet<string> = new Set(),
): Partial<Record<EspeceAnimale, EffectifVivant>> {
  const effectifs: Partial<Record<EspeceAnimale, EffectifVivant>> = {};
  const de = (c: Chevre) => (effectifs[especeDe(c)] ??= { petits: 0, sevres: 0, femelles: 0 });
  for (const c of all) {
    if (c.statut === STATUT_CHEVRE.ABATTOIR && facturees && !facturees.has(c.id)) {
      const effectif = de(c);
      // Un cabri : un tiptag (destiné à l'abattoir) ou parti avant l'âge de petit (6 mois) ; sinon un adulte (« Chèvre sur pied »).
      const cabri =
        estTiptag(c, tiptags) ||
        (!!c.dateStatut && !ageAtteint(c.dateNaissance, PARAMETRES_ESPECE[especeDe(c)].agePetitMax, c.dateStatut));
      if (cabri) effectif.petits += 1;
      else effectif.aFacturerAdultes = (effectif.aFacturerAdultes ?? 0) + 1;
      continue;
    }
    if (c.statut !== STATUT_CHEVRE.VIVANTE) continue;
    const effectif = de(c);
    if (estPetitLe(c)) effectif.petits += 1;
    else {
      effectif.sevres += 1;
      if (c.sexe === SEXE.FEMELLE) effectif.femelles += 1;
    }
  }
  return effectifs;
}

/** Le nombre d'animaux vivants de chaque espèce du cheptel, petits et sevrés (les espèces sans animal n'y figurent pas). */
export async function effectifsVivants(
  facturees?: ReadonlySet<string>,
  tiptags?: ReadonlySet<string>,
): Promise<Partial<Record<EspeceAnimale, EffectifVivant>>> {
  return effectifsDesAnimaux(await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL), facturees, tiptags);
}

/** Les animaux vivants d'une espèce précise (pas forcément l'espèce courante) : on choisit celui d'une vente dans cette liste. */
export async function listAnimauxVivantsDe(espece: EspeceAnimale): Promise<Chevre[]> {
  const all = await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL);
  return all
    .filter((c) => c.statut === STATUT_CHEVRE.VIVANTE && especeDe(c) === espece)
    .sort((a, b) => cleTriChevre(a).localeCompare(cleTriChevre(b)));
}

/** Les animaux de l'espèce envoyés à l'abattoir (avec leur jour d'abattage et leur poids) : de quoi facturer la viande. */
export async function listAnimauxAbattusDe(espece: EspeceAnimale): Promise<Chevre[]> {
  const all = await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL);
  return all
    .filter((c) => c.statut === STATUT_CHEVRE.ABATTOIR && especeDe(c) === espece)
    .sort((a, b) => cleTriChevre(a).localeCompare(cleTriChevre(b)));
}

/** Animaux de l'espèce courante morts, abattus ou vendus : conservés mais masqués de la liste principale. */
export async function listChevresHistorique(): Promise<Chevre[]> {
  const all = deEspeceCourante(await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL));
  return all
    .filter((c) => c.statut !== STATUT_CHEVRE.VIVANTE)
    .sort((a, b) => (b.dateStatut ?? '').localeCompare(a.dateStatut ?? ''));
}

/** Pour chaque mère (n° de boucle) de l'espèce courante, la date de sa dernière mise bas connue. */
export async function dernieresMisesBasParMere(): Promise<Record<string, string>> {
  const all = deEspeceCourante(await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL));
  const resultat: Record<string, string> = {};
  for (const c of all) {
    if (!c.mereNumeroBoucle) continue;
    const actuelle = resultat[c.mereNumeroBoucle];
    if (!actuelle || c.dateNaissance > actuelle) resultat[c.mereNumeroBoucle] = c.dateNaissance;
  }
  return resultat;
}

export async function getChevre(id: string): Promise<Chevre | undefined> {
  return findRecord(CATEGORIE_STOCKAGE.CHEPTEL, id);
}

/**
 * mereId est toujours recalculé depuis mereNumeroBoucle : c'est ce lien qui alimente la descendance affichée sur la
 * fiche de la mère. La mère est de la même espèce que son petit (la boucle 1 d'une poule n'est pas celle d'un cochon).
 */
export async function saveChevre(chevre: Chevre): Promise<void> {
  const mereId = chevre.mereNumeroBoucle
    ? (await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL)).find(
        (c) =>
          c.numeroBoucle === chevre.mereNumeroBoucle &&
          c.id !== chevre.id &&
          especeDe(c) === especeDe(chevre),
      )?.id
    : undefined;
  await upsertRecord(CATEGORIE_STOCKAGE.CHEPTEL, yearOf(chevre.dateNaissance), { ...chevre, mereId });
  // Une boucle de l'inventaire est posée dès qu'un animal la porte (et à poser de nouveau quand plus aucun ne la porte) ; le numéro
  // d'un animal qui n'est pas dans l'inventaire y est ajouté.
  await synchroniserPoseBoucles(chevre);
}

export async function creerChevre(input: {
  /** Espèce de l'animal ; l'espèce courante par défaut. */
  espece?: EspeceAnimale;
  numeroBoucle?: string;
  dateBouclage?: string;
  nom?: string;
  sexe: Sexe;
  dateNaissance: string;
  /** Un animal acheté : sa date d'entrée dans l'exploitation et son vendeur. */
  dateEntree?: string;
  vendeur?: string;
  mereId?: string;
  mereNumeroBoucle?: string;
  notes?: string;
  /** Permet de créer directement un cabrit mort-né (statut !== 'vivante' dès la naissance). */
  statut?: StatutChevre;
  renouvellement?: boolean;
  renouvellementAnnee?: number;
}): Promise<Chevre> {
  const statut = input.statut ?? STATUT_CHEVRE.VIVANTE;
  const chevre: Chevre = {
    id: generateId(),
    espece: input.espece ?? especeCourante(),
    numeroBoucle: input.numeroBoucle,
    dateBouclage: input.dateBouclage,
    nom: input.nom,
    dateEntree: input.dateEntree,
    vendeur: input.vendeur,
    sexe: input.sexe,
    dateNaissance: input.dateNaissance,
    mereId: input.mereId,
    mereNumeroBoucle: input.mereNumeroBoucle,
    statut,
    dateStatut: statut !== STATUT_CHEVRE.VIVANTE ? input.dateNaissance : undefined,
    renouvellement: input.renouvellement,
    renouvellementAnnee: input.renouvellement ? input.renouvellementAnnee : undefined,
    notes: input.notes,
  };
  await saveChevre(chevre);
  return chevre;
}

/**
 * Supprime définitivement la fiche (contrairement à déclarer morte/abattoir/vendue,
 * qui garde l'enregistrement). Les fiches de sa descendance gardent son n° de boucle
 * en texte pour l'affichage, mais ne pourront plus être reliées à sa fiche.
 */
export async function supprimerChevre(id: string): Promise<void> {
  await deleteRecord(CATEGORIE_STOCKAGE.CHEPTEL, id);
  await synchroniserPoseBoucles();
}

export async function declarerStatutChevre(
  id: string,
  statut: StatutChevre,
  dateStatut: string,
  /** Le poids donné à la sortie (abattoir…) : il remplace celui de la fiche ; absent, celui de la fiche reste. */
  poidsKg?: number,
): Promise<void> {
  const chevre = await getChevre(id);
  if (!chevre) return;
  // Un animal déjà envoyé à l'abattoir le reste : la facture de sa viande ne le fait pas passer en « mort » ou « vendu ».
  if (chevre.statut === STATUT_CHEVRE.ABATTOIR && statut !== STATUT_CHEVRE.ABATTOIR) return;
  await saveChevre({ ...chevre, statut, dateStatut, poidsKg: poidsKg ?? chevre.poidsKg });
}

/** Change la date de sortie (mort, abattoir, vente) d'un animal sorti : son statut reste ; le recensement et les bordereaux suivent. */
export async function modifierDateDeSortie(id: string, dateStatut: string): Promise<void> {
  const chevre = await getChevre(id);
  if (!chevre || chevre.statut === STATUT_CHEVRE.VIVANTE) return;
  await saveChevre({ ...chevre, dateStatut });
}

export async function reactiverChevre(id: string): Promise<void> {
  const chevre = await getChevre(id);
  if (!chevre) return;
  await saveChevre({ ...chevre, statut: STATUT_CHEVRE.VIVANTE, dateStatut: undefined });
}

/**
 * Le n° de boucle doit être unique parmi les animaux de la même espèce (toutes années, tous statuts confondus) :
 * la boucle 1 d'un cochon et la boucle 1 d'une poule peuvent coexister. L'espèce courante par défaut.
 */
export async function numeroBoucleExiste(
  numeroBoucle: string,
  excludeId?: string,
  espece: EspeceAnimale = especeCourante(),
): Promise<boolean> {
  const all = await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL);
  return all.some((c) => c.numeroBoucle === numeroBoucle && c.id !== excludeId && especeDe(c) === espece);
}

/** Les petits d'un animal : ceux dont il est la mère, ou le père (par son n° de boucle). */
export async function listDescendance(chevreId: string): Promise<Chevre[]> {
  const all = await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL);
  const parent = all.find((c) => c.id === chevreId);
  const boucle = parent?.numeroBoucle?.trim();
  return all
    .filter(
      (c) =>
        c.mereId === chevreId ||
        (!!boucle && c.pereNumeroBoucle === boucle && !!parent && especeDe(c) === especeDe(parent)),
    )
    .sort((a, b) => b.dateNaissance.localeCompare(a.dateNaissance));
}

/** L'animal portant ce n° de boucle dans l'espèce donnée (l'espèce courante par défaut). */
export async function resolveChevreIdParBoucle(
  numeroBoucle?: string,
  espece: EspeceAnimale = especeCourante(),
): Promise<string | undefined> {
  if (!numeroBoucle?.trim()) return undefined;
  const all = await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL);
  return all.find((c) => c.numeroBoucle === numeroBoucle.trim() && especeDe(c) === espece)?.id;
}

/** Tous les animaux de l'espèce courante, quel que soit leur statut (vivants, morts, vendus…) : de quoi reconstituer le troupeau d'une date passée. */
export async function listTousLesAnimauxDeLEspece(): Promise<Chevre[]> {
  return deEspeceCourante(await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL));
}
