import { listFactures } from '@/features/comptabilite/repository/factures';
import { listVentes } from '@/features/comptabilite/repository/ventes';
import type { CategorieDepense, CategorieRecette } from '@/features/comptabilite/types';
import {
  TYPE_FACTURE,
  ORDRE_CATEGORIE_DEPENSE,
  ORDRE_CATEGORIE_RECETTE,
} from '@/shared/constants/comptabilite';

export interface DetailCategorie<C extends string> {
  categorie: C;
  montant: number;
}

export interface DetailComptable {
  depenses: DetailCategorie<CategorieDepense>[];
  recettes: DetailCategorie<CategorieRecette>[];
  totalDepenses: number;
  totalRecettes: number;
}

/**
 * Ventile les écritures de l'année par catégorie de dépense/recette, montant réel (sans exclure
 * « Autre », contrairement au solde principal) — sert à l'écran Détail du menu Comptabilité.
 */
export async function calculerDetailComptable(annee: number): Promise<DetailComptable> {
  const [ventes, factures] = await Promise.all([listVentes(annee), listFactures(annee)]);

  const depensesParCategorie = new Map<CategorieDepense, number>();
  const recettesParCategorie = new Map<CategorieRecette, number>();

  for (const v of ventes) {
    recettesParCategorie.set(v.categorie, (recettesParCategorie.get(v.categorie) ?? 0) + (v.prix ?? 0));
  }
  for (const f of factures) {
    if (f.type === TYPE_FACTURE.RECUE && f.categorieDepense) {
      depensesParCategorie.set(
        f.categorieDepense,
        (depensesParCategorie.get(f.categorieDepense) ?? 0) + f.montant,
      );
    } else if (f.type === TYPE_FACTURE.EMISE && f.categorieRecette) {
      recettesParCategorie.set(
        f.categorieRecette,
        (recettesParCategorie.get(f.categorieRecette) ?? 0) + f.montant,
      );
    }
  }

  const depenses = ORDRE_CATEGORIE_DEPENSE.map((categorie) => ({
    categorie,
    montant: depensesParCategorie.get(categorie) ?? 0,
  }));
  const recettes = ORDRE_CATEGORIE_RECETTE.map((categorie) => ({
    categorie,
    montant: recettesParCategorie.get(categorie) ?? 0,
  }));

  return {
    depenses,
    recettes,
    totalDepenses: depenses.reduce((s, d) => s + d.montant, 0),
    totalRecettes: recettes.reduce((s, r) => s + r.montant, 0),
  };
}
