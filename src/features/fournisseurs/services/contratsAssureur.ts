import type { ContratAssureur, Fournisseur } from '@/features/fournisseurs/types';
import { CATEGORIE_FOURNISSEUR } from '@/shared/constants/fournisseurs';
import { categorieFournisseurDe } from '@/shared/dictionnaire/categoriesFournisseur';
import { generateId } from '@/shared/utils/id';

/** Vrai pour un fournisseur de catégorie « Assureur » : c'est lui qui a des contrats. */
export const estUnAssureur = (f: Pick<Fournisseur, 'categorie'> | undefined): boolean =>
  !!f && categorieFournisseurDe(f.categorie).id === CATEGORIE_FOURNISSEUR.ASSUREUR;

/** Les contrats de l'assureur, par ordre alphabétique de leur dénomination. */
export const contratsDe = (f: Pick<Fournisseur, 'contrats'> | undefined): ContratAssureur[] =>
  [...(f?.contrats ?? [])].sort((a, b) => a.denomination.localeCompare(b.denomination, 'fr'));

/** Ce que le choix d'un contrat inscrit dans le numéro de la facture : son numéro de contrat (à défaut, sa dénomination). */
export const numeroDuContrat = (c: Pick<ContratAssureur, 'numero' | 'denomination'>): string => c.numero.trim() || c.denomination.trim();

/** Le contrat que porte une facture : celui dont le numéro est celui qu'elle affiche. */
export const contratDuNumero = (f: Pick<Fournisseur, 'contrats'> | undefined, numero: string | undefined): ContratAssureur | undefined => {
  const cherche = (numero ?? '').trim().toLowerCase();
  return cherche ? (f?.contrats ?? []).find((c) => numeroDuContrat(c).toLowerCase() === cherche) : undefined;
};

/** L'assureur avec ce contrat ajouté (sans identifiant) ou remplacé (avec le sien). */
export function avecContrat(f: Fournisseur, contrat: Omit<ContratAssureur, 'id'> & { id?: string }): Fournisseur {
  const complet: ContratAssureur = { ...contrat, id: contrat.id ?? generateId() };
  const contrats = f.contrats ?? [];
  return {
    ...f,
    contrats: contrats.some((c) => c.id === complet.id)
      ? contrats.map((c) => (c.id === complet.id ? complet : c))
      : [...contrats, complet],
  };
}

/** L'assureur sans ce contrat (ses écritures gardent le numéro qu'elles affichent). */
export const sansContrat = (f: Fournisseur, id: string): Fournisseur => ({
  ...f,
  contrats: (f.contrats ?? []).filter((c) => c.id !== id),
});
