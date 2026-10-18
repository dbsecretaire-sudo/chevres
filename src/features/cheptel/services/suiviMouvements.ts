import type { Chevre } from '@/features/cheptel/types';
import { ajouterMois } from '@/features/comptabilite/services/tresorerie';
import type { Vente } from '@/features/comptabilite/types';
import { SEPARATEUR_ANIMAUX } from '@/shared/constants/comptabilite';
import { SEXE, STATUT_CHEVRE } from '@/shared/constants/cheptel';
import {
  CATEGORIE_SUIVI,
  CAUSE_ENTREE,
  CAUSE_SORTIE,
  MOIS_AVANT_CHANGEMENT_CATEGORIE,
  type CategorieSuivi,
} from '@/shared/constants/suiviMouvements';
import { yearOf } from '@/shared/utils/dates';
import { compteAuxDocuments } from '@/features/cheptel/utils/compteAuxDocuments';

/** Un nombre d'animaux par catégorie du formulaire (les jeunes, les femelles éligibles, les mâles). */
export type Effectifs = Record<CategorieSuivi, number>;

export const effectifsNuls = (): Effectifs => ({
  [CATEGORIE_SUIVI.JEUNES]: 0,
  [CATEGORIE_SUIVI.FEMELLES]: 0,
  [CATEGORIE_SUIVI.MALES]: 0,
});

/** Une ligne du formulaire : un lot d'animaux qui entre ou sort le même jour, pour la même cause et vers/depuis la même exploitation. */
export interface LigneMouvement {
  date: string;
  /** La cause d'entrée (N, A, C, P) ou de sortie (M, V, P, C, AU) du lot : « C » est à la fois la sortie d'une catégorie et l'entrée dans l'autre. */
  cause: string;
  entrees: Effectifs;
  sorties: Effectifs;
  /** Le nom de l'acheteur (ou du vendeur) ; vide pour une naissance ou une mort. */
  nom?: string;
}

/** Les mouvements d'une année : l'effectif au 1er janvier, les lignes datées, et l'effectif au 31 décembre. */
export interface SuiviAnnuel {
  annee: number;
  effectifDebut: Effectifs;
  lignes: LigneMouvement[];
  effectifFin: Effectifs;
}

/** Ce que le calcul lit ailleurs que dans les fiches : les libellés écrits quand la vente ne nomme pas d'acheteur. */
export interface LibellesSuivi {
  abattoir: string;
  autoConsommation: string;
}

const ajouter = (a: Effectifs, b: Effectifs, signe = 1): Effectifs => ({
  [CATEGORIE_SUIVI.JEUNES]: a.jeunes + signe * b.jeunes,
  [CATEGORIE_SUIVI.FEMELLES]: a.femelles + signe * b.femelles,
  [CATEGORIE_SUIVI.MALES]: a.males + signe * b.males,
});

/** Les effectifs d'après une liste de lignes, à partir d'un effectif de départ : départ + entrées − sorties. */
export function effectifApres(depart: Effectifs, lignes: LigneMouvement[]): Effectifs {
  return lignes.reduce((total, l) => ajouter(ajouter(total, l.entrees), l.sorties, -1), depart);
}

/** Le total des entrées et des sorties d'une liste de lignes (les « sous totaux » d'une page). */
export function sousTotaux(lignes: LigneMouvement[]): { entrees: Effectifs; sorties: Effectifs } {
  return {
    entrees: lignes.reduce((t, l) => ajouter(t, l.entrees), effectifsNuls()),
    sorties: lignes.reduce((t, l) => ajouter(t, l.sorties), effectifsNuls()),
  };
}

/** Les statuts qui retirent un animal du troupeau (un mort-né n'y est jamais entré). */
const STATUTS_DE_SORTIE: readonly string[] = [
  STATUT_CHEVRE.MORTE,
  STATUT_CHEVRE.ABATTOIR,
  STATUT_CHEVRE.VENDUE,
  STATUT_CHEVRE.AUTOCONSOMMEE,
];

/** La date de sortie d'un animal, quand il est sorti du troupeau et que sa fiche la donne. */
const dateDeSortie = (a: Chevre): string | undefined =>
  STATUTS_DE_SORTIE.includes(a.statut) ? a.dateStatut : undefined;

/** La cause de sortie du formulaire d'après le statut de l'animal. */
const causeDeSortie = (statut: string): string =>
  statut === STATUT_CHEVRE.MORTE
    ? CAUSE_SORTIE.MORT
    : statut === STATUT_CHEVRE.AUTOCONSOMMEE
      ? CAUSE_SORTIE.AUTRE
      : CAUSE_SORTIE.VENTE;

/**
 * La date où un animal change de catégorie : à un an pour un mâle, et à un an ou à sa première mise bas (la première des deux)
 * pour une femelle. Avant, c'est un jeune.
 */
function dateDeChangement(animal: Chevre, premiereMiseBas: string | undefined): string {
  const anniversaire = ajouterMois(animal.dateNaissance, MOIS_AVANT_CHANGEMENT_CATEGORIE);
  return animal.sexe === SEXE.FEMELLE && premiereMiseBas && premiereMiseBas < anniversaire
    ? premiereMiseBas
    : anniversaire;
}

/**
 * Le suivi des mouvements d'une année pour les animaux d'une espèce (les brebis ou les chèvres) : les naissances, les
 * changements de catégorie, les ventes (avec l'acheteur que la vente donne), les morts et les autres sorties, rangés par date et par
 * cause, avec l'effectif au 1er janvier et en fin d'année. Les mort-nés n'entrent pas au troupeau, ni les animaux sans boucle (cabris
 * vendus sans boucle) ; un animal acheté (fiche créée par une dépense « Animaux vivants ») entre à la date de l'achat, avec sa cause « achat »
 * et le nom de son vendeur, et non à sa naissance.
 */
export function suiviMouvements(
  animaux: Chevre[],
  ventes: Vente[],
  annee: number,
  libelles: LibellesSuivi,
): SuiviAnnuel {
  const debut = `${annee}-01-01`;
  const fin = `${annee}-12-31`;
  // Les animaux sans boucle (les cabris qui n'en ont pas encore, vendus avant) ne figurent pas dans le document : ni leur naissance, ni
  // leur vente, ni l'effectif ; sauf les auto-consommés.
  const presents = animaux.filter((a) => a.statut !== STATUT_CHEVRE.MORT_NE && !!a.dateNaissance && compteAuxDocuments(a));

  // La première mise bas de chaque femelle : la plus ancienne naissance de ses petits (mort-nés compris).
  const premiereMiseBas = new Map<string, string>();
  for (const petit of animaux) {
    if (!petit.mereId || !petit.dateNaissance) continue;
    const deja = premiereMiseBas.get(petit.mereId);
    if (!deja || petit.dateNaissance < deja) premiereMiseBas.set(petit.mereId, petit.dateNaissance);
  }

  // L'acheteur de chaque animal vendu : le client de la vente qui le désigne.
  const acheteurs = new Map<string, string>();
  for (const vente of ventes) {
    if (!vente.animaux || !vente.client?.trim()) continue;
    for (const id of vente.animaux.split(SEPARATEUR_ANIMAUX).filter(Boolean))
      acheteurs.set(id, vente.client.trim());
  }

  /** La catégorie d'un animal à une date : changée seulement si le changement date d'avant (un changement du jour se compte à part). */
  const categorieAvant = (animal: Chevre, date: string): CategorieSuivi => {
    const changement = dateDeChangement(animal, premiereMiseBas.get(animal.id));
    if (changement >= date) return CATEGORIE_SUIVI.JEUNES;
    return animal.sexe === SEXE.FEMELLE ? CATEGORIE_SUIVI.FEMELLES : CATEGORIE_SUIVI.MALES;
  };

  const effectifDebut = effectifsNuls();
  for (const animal of presents) {
    if ((animal.dateEntree ?? animal.dateNaissance) >= debut) continue;
    const sortie = dateDeSortie(animal);
    if (sortie && sortie < debut) continue;
    effectifDebut[categorieAvant(animal, debut)] += 1;
  }

  const lignes = new Map<string, LigneMouvement>();
  const ligne = (date: string, cause: string, nom?: string): LigneMouvement => {
    const cle = [date, cause, nom ?? ''].join('|');
    let existante = lignes.get(cle);
    if (!existante) {
      existante = { date, cause, entrees: effectifsNuls(), sorties: effectifsNuls(), nom };
      lignes.set(cle, existante);
    }
    return existante;
  };

  for (const animal of presents) {
    const sortie = dateDeSortie(animal);
    const entree = animal.dateEntree ?? animal.dateNaissance;
    if (animal.dateEntree) {
      // L'achat : une entrée, dans la catégorie où l'animal était ce jour-là, depuis son vendeur.
      if (entree >= debut && entree <= fin)
        ligne(entree, CAUSE_ENTREE.ACHAT, animal.vendeur?.trim() || undefined).entrees[categorieAvant(animal, entree)] += 1;
    } else if (animal.dateNaissance >= debut && animal.dateNaissance <= fin) {
      // La naissance : une entrée de jeune.
      ligne(animal.dateNaissance, CAUSE_ENTREE.NAISSANCE).entrees[CATEGORIE_SUIVI.JEUNES] += 1;
    }

    // Le changement de catégorie : le jeune sort de sa catégorie et entre dans celle des adultes.
    const changement = dateDeChangement(animal, premiereMiseBas.get(animal.id));
    if (changement >= debut && changement <= fin && changement > entree && (!sortie || changement < sortie)) {
      const l = ligne(changement, CAUSE_ENTREE.CHANGEMENT_CATEGORIE);
      l.sorties[CATEGORIE_SUIVI.JEUNES] += 1;
      l.entrees[animal.sexe === SEXE.FEMELLE ? CATEGORIE_SUIVI.FEMELLES : CATEGORIE_SUIVI.MALES] += 1;
    }

    // La sortie du troupeau : de la catégorie où l'animal était ce jour-là.
    if (sortie && sortie >= debut && sortie <= fin) {
      const nom =
        acheteurs.get(animal.id) ??
        (animal.statut === STATUT_CHEVRE.ABATTOIR
          ? libelles.abattoir
          : animal.statut === STATUT_CHEVRE.AUTOCONSOMMEE
            ? libelles.autoConsommation
            : undefined);
      ligne(sortie, causeDeSortie(animal.statut), nom).sorties[categorieAvant(animal, sortie)] += 1;
    }
  }

  // Le jour même : les naissances, puis les changements de catégorie, puis les sorties.
  const ordreCause = (cause: string) =>
    cause === CAUSE_ENTREE.NAISSANCE || cause === CAUSE_ENTREE.ACHAT ? 0 : cause === CAUSE_ENTREE.CHANGEMENT_CATEGORIE ? 1 : 2;
  const triees = [...lignes.values()].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      ordreCause(a.cause) - ordreCause(b.cause) ||
      a.cause.localeCompare(b.cause) ||
      (a.nom ?? '').localeCompare(b.nom ?? ''),
  );

  return { annee, effectifDebut, lignes: triees, effectifFin: effectifApres(effectifDebut, triees) };
}

/** Une perte à déclarer : la date où des animaux de l'effectif engagé sont morts, et combien. */
export interface PerteDuJour {
  date: string;
  nombre: number;
}

/**
 * Les pertes de l'année, jour par jour : tous les animaux morts ce jour-là, petits et boucs compris (ils se perdent plus facilement, ou
 * deviennent sauvages). Ils sont morts en transhumance : tous comptent comme perdus. Un mort-né n'est jamais entré au troupeau.
 */
export function pertesDeLAnnee(animaux: Chevre[], annee: number): PerteDuJour[] {
  const parJour = new Map<string, number>();
  for (const a of animaux) {
    if (a.statut !== STATUT_CHEVRE.MORTE || !a.dateStatut || yearOf(a.dateStatut) !== annee) continue;
    parJour.set(a.dateStatut, (parJour.get(a.dateStatut) ?? 0) + 1);
  }
  return [...parJour.entries()]
    .map(([date, nombre]) => ({ date, nombre }))
    .sort((x, y) => x.date.localeCompare(y.date));
}

/** Les années où le troupeau a un mouvement ou un effectif : de la plus ancienne naissance à l'année en cours. */
export function anneesDuSuivi(animaux: Chevre[], anneeCourante: number): number[] {
  const naissances = animaux.filter((a) => !!a.dateNaissance).map((a) => yearOf(a.dateNaissance));
  if (naissances.length === 0) return [];
  const premiere = Math.min(...naissances);
  return Array.from({ length: anneeCourante - premiere + 1 }, (_, i) => premiere + i);
}
