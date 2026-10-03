import { LABEL_TYPE_AIDE } from '@/shared/textes/libelles';
import { montantAlimentationHorsAutre } from '@/features/comptabilite/utils/montants';
import { listFactures } from '@/features/comptabilite/repository/factures';
import { listVentes } from '@/features/comptabilite/repository/ventes';
import {
  SENS_TRANSACTION,
  SOURCE_TRANSACTION,
  CATEGORIE_VENTE,
  TYPE_FACTURE,
  CATEGORIE_RECETTE,
  TYPE_AIDE,
} from '@/shared/constants/comptabilite';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { TEXTES } from '@/shared/textes';

export interface Transaction {
  id: string;
  date: string;
  montant?: number;
  /** Part de `montant` comptant réellement dans les soldes (hors « Autre ») — voir montantHorsAutre(). */
  montantComptabilise?: number;
  sens: ValeurDe<typeof SENS_TRANSACTION>;
  titre: string;
  sousTitre: string;
  source: ValeurDe<typeof SOURCE_TRANSACTION>;
}

/** Vue unifiée : ventes (lait/fromage/cabris) + factures (reçues/émises), triée par date décroissante. */
export async function listTransactions(annee: number): Promise<Transaction[]> {
  const [ventes, factures] = await Promise.all([listVentes(annee), listFactures(annee)]);

  const deVentes: Transaction[] = ventes.map((v) => ({
    id: v.id,
    date: v.date,
    montant: v.prix,
    montantComptabilise: v.prix,
    sens: SENS_TRANSACTION.ENTREE,
    titre:
      v.categorie === CATEGORIE_VENTE.LAIT
        ? TEXTES.comptabilite.transactions.laitQuantiteL(v.quantite)
        : v.categorie === CATEGORIE_VENTE.CABRIS
          ? TEXTES.comptabilite.transactions.cabrisQuantiteTeteValeur(v.quantite, v.quantite > 1 ? 's' : '')
          : TEXTES.comptabilite.transactions.fromageQuantiteUnite(v.quantite, v.unite),
    sousTitre: TEXTES.comptabilite.transactions.venteDeProduction,
    source: SOURCE_TRANSACTION.VENTE,
  }));

  const deFactures: Transaction[] = factures.map((f) => ({
    id: f.id,
    date: f.date,
    montant: f.montant,
    montantComptabilise: montantAlimentationHorsAutre(f),
    sens: f.type === TYPE_FACTURE.EMISE ? SENS_TRANSACTION.ENTREE : SENS_TRANSACTION.SORTIE,
    titre: f.tiers,
    sousTitre:
      f.categorieRecette === CATEGORIE_RECETTE.AIDE && f.typeAide
        ? f.typeAide === TYPE_AIDE.AUTRE && f.typeAideLibre
          ? f.typeAideLibre
          : LABEL_TYPE_AIDE[f.typeAide]
        : f.description,
    source: SOURCE_TRANSACTION.FACTURE,
  }));

  return [...deVentes, ...deFactures].sort((a, b) => b.date.localeCompare(a.date));
}
