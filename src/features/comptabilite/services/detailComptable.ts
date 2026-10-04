import { listFactures } from '@/features/comptabilite/repository/factures';
import { listVentes } from '@/features/comptabilite/repository/ventes';
import type { CategorieDepense, CategorieRecette, TypeAliment } from '@/features/comptabilite/types';
import { TOUTES_ACTIVITES, type FiltreActivite } from '@/features/comptabilite/services/filtresTransactions';
import { activiteVente, partsDeFacture } from '@/features/comptabilite/utils/activite';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { especesActives, type EspeceAnimale } from '@/shared/dictionnaire/animaux';
import {
  CATEGORIES_RECETTE_COMMUNES,
  CATEGORIES_RECETTE_PAR_ESPECE,
  CATEGORIE_DEPENSE,
  TYPES_ALIMENT,
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
  /** Dépenses d'alimentation, ventilées par type d'aliment. */
  alimentationParType: Record<TypeAliment, number>;
  totalDepenses: number;
  totalRecettes: number;
}

/**
 * Ventile les écritures de l'année par catégorie de dépense/recette, montant réel (sans exclure
 * « Autre », contrairement au solde principal) — sert à l'écran Détail du menu Comptabilité.
 */
/** Les espèces concernées par un filtre : toutes celles de l'établissement, une seule, ou aucune (« commun »). */
export const especesDuFiltre = (filtre: FiltreActivite): EspeceAnimale[] =>
  filtre === TOUTES_ACTIVITES ? especesActives() : filtre === ACTIVITE_COMMUNE ? [] : [filtre];

/** Vrai si l'activité de l'écriture correspond au filtre. */
export const correspondAuFiltre = (filtre: FiltreActivite, activite: string): boolean =>
  filtre === TOUTES_ACTIVITES || activite === filtre;

export async function calculerDetailComptable(
  annee: number,
  /** Activité dont on veut le détail : une espèce, « commun », ou toutes ensemble. */
  filtre: FiltreActivite = TOUTES_ACTIVITES,
): Promise<DetailComptable> {
  const [toutesVentes, toutesFactures] = await Promise.all([listVentes(annee), listFactures(annee)]);
  const ventes = toutesVentes.filter((v) => correspondAuFiltre(filtre, activiteVente(v)));
  // Une facture d'alimentation répartie entre des cheptels compte pour chacun à hauteur de ses lignes.
  const factures = toutesFactures
    .flatMap(partsDeFacture)
    .filter((p) => correspondAuFiltre(filtre, p.activite))
    .map((p) => p.facture);
  const alimentationParType = Object.fromEntries(TYPES_ALIMENT.map((t) => [t, 0])) as Record<
    TypeAliment,
    number
  >;

  const depensesParCategorie = new Map<CategorieDepense, number>();
  const recettesParCategorie = new Map<CategorieRecette, number>();

  for (const v of ventes) {
    recettesParCategorie.set(v.categorie, (recettesParCategorie.get(v.categorie) ?? 0) + (v.prix ?? 0));
  }
  for (const f of factures) {
    if (f.type === TYPE_FACTURE.RECUE && f.categorieDepense === CATEGORIE_DEPENSE.ALIMENTATION) {
      for (const ligne of f.lignesAlimentation ?? []) alimentationParType[ligne.type] += ligne.montant;
    }
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
  // Les recettes que proposent les espèces de l'établissement (pas de lait ni de fromage pour des cochons),
  // plus toute catégorie qui a un montant (anciennes écritures).
  const proposees = new Set<string>(
    filtre === ACTIVITE_COMMUNE
      ? CATEGORIES_RECETTE_COMMUNES
      : especesDuFiltre(filtre).flatMap((e) => CATEGORIES_RECETTE_PAR_ESPECE[e]),
  );
  const recettes = ORDRE_CATEGORIE_RECETTE.filter(
    (categorie) => proposees.has(categorie) || (recettesParCategorie.get(categorie) ?? 0) !== 0,
  ).map((categorie) => ({
    categorie,
    montant: recettesParCategorie.get(categorie) ?? 0,
  }));

  return {
    depenses,
    recettes,
    alimentationParType,
    totalDepenses: depenses.reduce((s, d) => s + d.montant, 0),
    totalRecettes: recettes.reduce((s, r) => s + r.montant, 0),
  };
}
