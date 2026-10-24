import type { ValeurDe } from '@/shared/constants/valeurDe';
import {
  CATEGORIE_ANIMAL,
  SEXE,
  STATUT_CHEVRE,
  agePetitMax,
  PREMIER_MOIS_SECOND_SEMESTRE,
} from '@/shared/constants/cheptel';
import type { Chevre, Sexe, StatutChevre } from '@/features/cheptel/types';
import { ageAtteint } from '@/shared/utils/age';
import { currentYear, formatDateFR, yearOf } from '@/shared/utils/dates';
import { LIBELLES_STATUT_CHEVRE, LIBELLE_STATUT_EQUARRISSAGE } from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';

/** Libellé d'affichage d'une chèvre/cabrit, avec repli propre quand le n° de boucle n'a pas encore été posé. */
export function libelleChevre(c: Pick<Chevre, 'numeroBoucle' | 'nom' | 'sexe' | 'dateNaissance'>): string {
  if (c.numeroBoucle) {
    return c.nom ? `${c.numeroBoucle} — ${c.nom}` : c.numeroBoucle;
  }
  if (c.nom) return TEXTES.cheptel.chevreLabel.nomSansBoucle(c.nom);
  // Sans boucle ni nom : le mot du petit (porcelet, poussin…) tant que l'animal a moins que l'âge limite du petit,
  // puis celui de l'adulte (truie, verrat, poule, coq…).
  const petit = categorieAnimal(c) === CATEGORIE_ANIMAL.CABRIT;
  const mots = TEXTES.cheptel.chevreLabel;
  const type =
    c.sexe === SEXE.FEMELLE
      ? petit
        ? mots.chevrette
        : mots.femelleAdulte
      : petit
        ? mots.chevreau
        : mots.maleAdulte;
  return TEXTES.cheptel.chevreLabel.typeSansBoucle(type);
}

/**
 * Le libellé sur une seule ligne (une liste déroulante, où deux animaux sans boucle se distingueraient mal) : comme libelleChevre, mais un
 * animal sans boucle ni nom y garde sa date de naissance (« Bouc sans boucle — né(e) le 05/01/2026 »).
 */
export function libelleChevreAvecDate(c: Pick<Chevre, 'numeroBoucle' | 'nom' | 'sexe' | 'dateNaissance'>): string {
  if (c.numeroBoucle || c.nom) return libelleChevre(c);
  const petit = categorieAnimal(c) === CATEGORIE_ANIMAL.CABRIT;
  const mots = TEXTES.cheptel.chevreLabel;
  const type =
    c.sexe === SEXE.FEMELLE
      ? petit
        ? mots.chevrette
        : mots.femelleAdulte
      : petit
        ? mots.chevreau
        : mots.maleAdulte;
  return mots.typeSansBoucleNeE(type, formatDateFR(c.dateNaissance));
}

/** La ligne du dessous d'un animal : sa naissance, et sa sortie quand il est parti (« Né le 05/01/2026 - Mort le 18/10/2026 »). */
export function detailDeLAnimal(
  c: Pick<Chevre, 'sexe' | 'dateNaissance' | 'statut' | 'dateStatut'>,
): string {
  const ne = accordNe(c.sexe);
  const naissance = `${ne.charAt(0).toUpperCase()}${ne.slice(1)} le ${formatDateFR(c.dateNaissance)}`;
  return c.statut !== 'vivante' && c.dateStatut
    ? `${naissance} - ${statutLabel(c.statut, c.sexe)} le ${formatDateFR(c.dateStatut)}`
    : naissance;
}

/** Clé de tri stable : les chèvres bouclées d'abord (par n° de boucle), puis les autres par nom. */
export function cleTriChevre(c: Pick<Chevre, 'numeroBoucle' | 'nom'>): string {
  return c.numeroBoucle ? `0_${c.numeroBoucle}` : `1_${c.nom ?? ''}`;
}

/** Le tri des animaux par numéro de boucle croissant (00786 avant 00790), ceux sans boucle à la fin. */
export const parBoucleCroissante = (a: Pick<Chevre, 'numeroBoucle' | 'nom'>, b: Pick<Chevre, 'numeroBoucle' | 'nom'>): number =>
  cleTriChevre(a).localeCompare(cleTriChevre(b), 'fr', { numeric: true });

export type CategorieAnimal = ValeurDe<typeof CATEGORIE_ANIMAL>;

/**
 * Catégorie déduite de l'âge et du sexe : moins que l’âge limite du petit (voir agePetitMax) → petit (mâle ou femelle) ;
 * au-delà → femelle ou mâle adulte.
 */
export function categorieAnimal(c: Pick<Chevre, 'dateNaissance' | 'sexe'>): CategorieAnimal {
  if (!ageAtteint(c.dateNaissance, agePetitMax())) return CATEGORIE_ANIMAL.CABRIT;
  return c.sexe === SEXE.MALE ? CATEGORIE_ANIMAL.BOUC : CATEGORIE_ANIMAL.CHEVRE;
}

/** Libellé de statut accordé au genre de l'animal (ex: "Vivant" pour un bouc, "Vivante" pour une chèvre). */
export function statutLabel(statut: StatutChevre, sexe: Sexe, enleveParLEquarrisseur = false): string {
  if (enleveParLEquarrisseur && statut === STATUT_CHEVRE.MORTE) return LIBELLE_STATUT_EQUARRISSAGE;
  const m = sexe === SEXE.MALE;
  return LIBELLES_STATUT_CHEVRE[statut][m ? 1 : 0];
}

/** "née"/"né" accordé au sexe, pour les tournures "née le ..." */
export function accordNe(sexe: Sexe): string {
  return sexe === SEXE.FEMELLE ? TEXTES.cheptel.chevreLabel.nee : TEXTES.cheptel.chevreLabel.ne;
}

/** Désigne l'animal dans une phrase ("cette chèvre" / "ce bouc" / "ce cabri"), accordé catégorie + genre. */
export function demonstratifAnimal(c: Pick<Chevre, 'dateNaissance' | 'sexe'>): string {
  const cat = categorieAnimal(c);
  if (cat === CATEGORIE_ANIMAL.BOUC) return TEXTES.cheptel.chevreLabel.ceBouc;
  if (cat === CATEGORIE_ANIMAL.CABRIT) return TEXTES.cheptel.chevreLabel.ceCabri;
  return TEXTES.cheptel.chevreLabel.cetteChevre;
}

/**
 * Le badge « Renouvellement » n'a de sens que pour les candidates encore jeunes au moment de la
 * sélection : nées cette année (n'importe quel mois), ou nées l'année précédente au second semestre
 * (juillet à décembre) — celles nées au premier semestre de l'année précédente sont déjà des adultes
 * établies au moment où la sélection est faite. La désignation elle-même (renouvellement /
 * renouvellementAnnee) n'est pas modifiée, seul l'affichage du badge est filtré.
 */
export function afficherBadgeRenouvellement(dateNaissance: string): boolean {
  const anneeNaissance = yearOf(dateNaissance);
  const cetteAnnee = currentYear();
  if (anneeNaissance === cetteAnnee) return true;
  if (anneeNaissance === cetteAnnee - 1) {
    const mois = Number(dateNaissance.slice(5, 7));
    return mois >= PREMIER_MOIS_SECOND_SEMESTRE;
  }
  return false;
}
