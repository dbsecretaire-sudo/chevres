import type { ValeurDe } from '@/shared/constants/valeurDe';
import {
  CATEGORIE_ANIMAL,
  SEXE,
  ageMaxPetitMois,
  PREMIER_MOIS_SECOND_SEMESTRE,
} from '@/shared/constants/cheptel';
import type { Chevre, Sexe, StatutChevre } from '@/features/cheptel/types';
import { currentYear, formatDateFR, yearOf } from '@/shared/utils/dates';
import { HEURE_MINUIT, MOIS_PAR_AN } from '@/shared/constants/temps';
import { LIBELLES_STATUT_CHEVRE } from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';

/** Libellé d'affichage d'une chèvre/cabrit, avec repli propre quand le n° de boucle n'a pas encore été posé. */
export function libelleChevre(c: Pick<Chevre, 'numeroBoucle' | 'nom' | 'sexe' | 'dateNaissance'>): string {
  if (c.numeroBoucle) {
    return c.nom ? `${c.numeroBoucle} — ${c.nom}` : c.numeroBoucle;
  }
  if (c.nom) return TEXTES.cheptel.chevreLabel.nomSansBoucle(c.nom);
  const type =
    c.sexe === SEXE.FEMELLE ? TEXTES.cheptel.chevreLabel.chevrette : TEXTES.cheptel.chevreLabel.chevreau;
  return TEXTES.cheptel.chevreLabel.typeSansBoucleNeE(type, formatDateFR(c.dateNaissance));
}

/** Clé de tri stable : les chèvres bouclées d'abord (par n° de boucle), puis les autres par nom. */
export function cleTriChevre(c: Pick<Chevre, 'numeroBoucle' | 'nom'>): string {
  return c.numeroBoucle ? `0_${c.numeroBoucle}` : `1_${c.nom ?? ''}`;
}

export type CategorieAnimal = ValeurDe<typeof CATEGORIE_ANIMAL>;

/** Âge en mois révolus à la date du jour. */
export function ageEnMois(dateNaissance: string): number {
  const naissance = new Date(`${dateNaissance}${HEURE_MINUIT}`);
  const maintenant = new Date();
  let mois =
    (maintenant.getFullYear() - naissance.getFullYear()) * MOIS_PAR_AN +
    (maintenant.getMonth() - naissance.getMonth());
  if (maintenant.getDate() < naissance.getDate()) mois -= 1;
  return mois;
}

/**
 * Catégorie déduite de l'âge et du sexe : moins que l’âge limite du petit (voir ageMaxPetitMois) → petit (mâle ou femelle) ;
 * au-delà → femelle ou mâle adulte.
 */
export function categorieAnimal(c: Pick<Chevre, 'dateNaissance' | 'sexe'>): CategorieAnimal {
  if (ageEnMois(c.dateNaissance) < ageMaxPetitMois()) return CATEGORIE_ANIMAL.CABRIT;
  return c.sexe === SEXE.MALE ? CATEGORIE_ANIMAL.BOUC : CATEGORIE_ANIMAL.CHEVRE;
}

/** Libellé de statut accordé au genre de l'animal (ex: "Vivant" pour un bouc, "Vivante" pour une chèvre). */
export function statutLabel(statut: StatutChevre, sexe: Sexe): string {
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
