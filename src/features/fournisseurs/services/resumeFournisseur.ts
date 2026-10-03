import type { Facture } from '@/features/comptabilite/types';
import type { Fournisseur } from '@/features/fournisseurs/types';
import { CATEGORIE_DEPENSE, TYPE_ALIMENT, TYPE_FACTURE } from '@/shared/constants/comptabilite';

/** Les factures reçues d'un fournisseur (rattachées par le nom de son entreprise). */
export const facturesDuFournisseur = (fournisseur: Fournisseur, factures: Facture[]) =>
  factures.filter((f) => f.type === TYPE_FACTURE.RECUE && f.tiers === fournisseur.nomEntreprise);

export interface ResumeFournisseur {
  /** Faux si aucune facture n'est de catégorie alimentation (pas de distinction « hors autre »). */
  aAlimentation: boolean;
  /** Total des lignes d'alimentation hors type « autre ». */
  totalHorsAutre: number;
  totalComplet: number;
}

export function calculerResumeFournisseur(factures: Facture[]): ResumeFournisseur {
  const totalHorsAutre = factures.reduce((total, facture) => {
    if (facture.categorieDepense !== CATEGORIE_DEPENSE.ALIMENTATION) return total;
    const lignes = facture.lignesAlimentation ?? [];
    return (
      total +
      lignes.filter((ligne) => ligne.type !== TYPE_ALIMENT.AUTRE).reduce((s, ligne) => s + ligne.montant, 0)
    );
  }, 0);

  return {
    aAlimentation: factures.some((f) => f.categorieDepense === CATEGORIE_DEPENSE.ALIMENTATION),
    totalHorsAutre,
    totalComplet: factures.reduce((total, facture) => total + facture.montant, 0),
  };
}

/** Valide et nettoie la fiche ; renvoie le message d'erreur ou le fournisseur nettoyé. */
export function nettoyerFournisseur(
  form: Fournisseur,
  messages: { nom: string; entreprise: string; siret: string; adresse: string },
): { erreur: string } | { fournisseur: Fournisseur } {
  if (!form.nom.trim()) return { erreur: messages.nom };
  if (!form.nomEntreprise.trim()) return { erreur: messages.entreprise };
  if (!form.siret.trim()) return { erreur: messages.siret };
  if (!form.adressePostale.trim()) return { erreur: messages.adresse };

  return {
    fournisseur: {
      ...form,
      nom: form.nom.trim(),
      prenom: form.prenom?.trim() || undefined,
      nomEntreprise: form.nomEntreprise.trim(),
      siret: form.siret.trim(),
      tva: form.tva?.trim() || undefined,
      rib: form.rib?.trim() || undefined,
      adressePostale: form.adressePostale.trim(),
    },
  };
}
