import type { Facture, LigneChambre } from '@/features/comptabilite/types';
import { TEXTES } from '@/shared/textes';
import { generateId } from '@/shared/utils/id';
import { parseDecimal } from '@/shared/utils/nombres';

/** Une ligne d'une facture de la Chambre d'agriculture en cours de saisie : le nom de l'article et son montant, en texte. */
export interface LigneChambreForm {
  key: string;
  libelle: string;
  montant: string;
  /** L'équarrisseur (sa fiche fournisseur) d'une ligne d'équarrissage ; vide : aucun choix. */
  equarrisseurId: string;
}

export const ligneChambreVide = (libelle = ''): LigneChambreForm => ({
  key: generateId(),
  libelle,
  montant: '',
  equarrisseurId: '',
});

/** Les articles que la Chambre d'agriculture facture d'ordinaire (forfait d'identification, équarrissage ATM, conseils et analyses). */
export const lignesChambreParDefaut = (): LigneChambreForm[] =>
  TEXTES.fournisseurs.chambre.articles.map((libelle) => ligneChambreVide(libelle));

/** Les lignes d'une facture déjà enregistrée, prêtes à être modifiées. */
export const versLignesChambreForm = (facture: Pick<Facture, 'lignesChambre'>): LigneChambreForm[] =>
  (facture.lignesChambre ?? []).map((l) => ({
    key: generateId(),
    libelle: l.libelle,
    montant: String(l.montant).replace('.', ','),
    equarrisseurId: l.equarrisseurId ?? '',
  }));

/** Les lignes à enregistrer : celles qui ont un montant (un article sans montant n'est pas facturé). */
export const lignesChambreFinales = (lignes: LigneChambreForm[]): LigneChambre[] =>
  lignes
    .map((l) => ({
      libelle: l.libelle.trim(),
      montant: parseDecimal(l.montant),
      equarrisseurId: l.equarrisseurId || undefined,
    }))
    .filter((l) => l.montant > 0);
