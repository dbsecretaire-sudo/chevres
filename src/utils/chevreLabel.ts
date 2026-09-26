import type { Chevre, Sexe, StatutChevre } from '@/types/models';
import { formatDateFR } from './dates';

/** Libellé d'affichage d'une chèvre/cabrit, avec repli propre quand le n° de boucle n'a pas encore été posé. */
export function libelleChevre(c: Pick<Chevre, 'numeroBoucle' | 'nom' | 'sexe' | 'dateNaissance'>): string {
  if (c.numeroBoucle) {
    return c.nom ? `${c.numeroBoucle} — ${c.nom}` : c.numeroBoucle;
  }
  if (c.nom) return `${c.nom} (sans boucle)`;
  const type = c.sexe === 'F' ? 'Chevrette' : 'Chevreau';
  return `${type} sans boucle — né(e) le ${formatDateFR(c.dateNaissance)}`;
}

/** Clé de tri stable : les chèvres bouclées d'abord (par n° de boucle), puis les autres par nom. */
export function cleTriChevre(c: Pick<Chevre, 'numeroBoucle' | 'nom'>): string {
  return c.numeroBoucle ? `0_${c.numeroBoucle}` : `1_${c.nom ?? ''}`;
}

export type CategorieAnimal = 'chevre' | 'bouc' | 'cabrit' | 'vivante' | 'tout';

/** Âge en mois révolus à la date du jour. */
export function ageEnMois(dateNaissance: string): number {
  const naissance = new Date(`${dateNaissance}T00:00:00`);
  const maintenant = new Date();
  let mois = (maintenant.getFullYear() - naissance.getFullYear()) * 12 + (maintenant.getMonth() - naissance.getMonth());
  if (maintenant.getDate() < naissance.getDate()) mois -= 1;
  return mois;
}

/**
 * Catégorie déduite de l'âge et du sexe : moins de 6 mois → cabrit (mâle ou femelle) ;
 * 6 mois et plus → chèvre (femelle) ou bouc (mâle).
 */
export function categorieAnimal(c: Pick<Chevre, 'dateNaissance' | 'sexe'>): CategorieAnimal {
  if (ageEnMois(c.dateNaissance) < 6) return 'cabrit';
  return c.sexe === 'M' ? 'bouc' : 'chevre';
}

export const LABEL_CATEGORIE_ANIMAL: Record<CategorieAnimal, string> = {
  chevre: 'Chèvres',
  bouc: 'Boucs',
  cabrit: 'Cabrits',
  vivante: 'Vivante',
  tout: 'Tout'
};

/** Libellé de statut accordé au genre de l'animal (ex: "Vivant" pour un bouc, "Vivante" pour une chèvre). */
export function statutLabel(statut: StatutChevre, sexe: Sexe): string {
  const m = sexe === 'M';
  const libelles: Record<StatutChevre, [feminin: string, masculin: string]> = {
    vivante: ['Vivante', 'Vivant'],
    morte: ['Morte', 'Mort'],
    abattoir: ['Abattoir', 'Abattoir'],
    vendue: ['Vendue', 'Vendu'],
    autoconsommee: ['Auto-consommée', 'Auto-consommé'],
    mortne: ['Mort-née', 'Mort-né'],
  };
  return libelles[statut][m ? 1 : 0];
}

/** "née"/"né" accordé au sexe, pour les tournures "née le ..." */
export function accordNe(sexe: Sexe): string {
  return sexe === 'F' ? 'née' : 'né';
}

/** Désigne l'animal dans une phrase ("cette chèvre" / "ce bouc" / "ce cabri"), accordé catégorie + genre. */
export function demonstratifAnimal(c: Pick<Chevre, 'dateNaissance' | 'sexe'>): string {
  const cat = categorieAnimal(c);
  if (cat === 'bouc') return 'ce bouc';
  if (cat === 'cabrit') return 'ce cabri';
  return 'cette chèvre';
}
