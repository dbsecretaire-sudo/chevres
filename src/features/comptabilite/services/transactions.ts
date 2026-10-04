import { LABEL_TYPE_AIDE } from '@/shared/textes/libelles';
import { activiteFacture, activiteVente } from '@/features/comptabilite/utils/activite';
import { libelleCategorieVente } from '@/features/comptabilite/utils/ventes';
import type { ActiviteComptable, Vente } from '@/features/comptabilite/types';
import { montantAlimentationHorsAutre } from '@/features/comptabilite/utils/montants';
import { listFactures } from '@/features/comptabilite/repository/factures';
import { listVentes } from '@/features/comptabilite/repository/ventes';
import {
  SENS_TRANSACTION,
  SOURCE_TRANSACTION,
  CATEGORIES_VENTE_ANIMAUX,
  CATEGORIES_VENTE_VIANDE,
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
  /** Activité (espèce, ou « commun ») de l'écriture. */
  activite: ActiviteComptable;
}

/** Titre d'une vente dans la liste : « Lait — 12 L », « Veaux — 2 têtes », « Charcuterie »… */
function titreVente(v: Vente): string {
  if (v.categorie === CATEGORIE_VENTE.LAIT) return TEXTES.comptabilite.transactions.laitQuantiteL(v.quantite);
  if ((CATEGORIES_VENTE_ANIMAUX as readonly string[]).includes(v.categorie)) {
    return TEXTES.comptabilite.transactions.cabrisQuantiteTeteValeur(
      libelleCategorieVente(v),
      v.quantite,
      v.quantite > 1 ? 's' : '',
    );
  }
  if ((CATEGORIES_VENTE_VIANDE as readonly string[]).includes(v.categorie)) return libelleCategorieVente(v);
  if (v.categorie === CATEGORIE_VENTE.OEUFS) return `${libelleCategorieVente(v)} — ${v.quantite}`;
  return TEXTES.comptabilite.transactions.fromageQuantiteUnite(v.quantite, v.unite);
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
    titre: titreVente(v),
    sousTitre: v.precision
      ? `${TEXTES.comptabilite.transactions.venteDeProduction} · ${v.precision}`
      : TEXTES.comptabilite.transactions.venteDeProduction,
    source: SOURCE_TRANSACTION.VENTE,
    activite: activiteVente(v),
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
    activite: activiteFacture(f),
  }));

  return [...deVentes, ...deFactures].sort((a, b) => b.date.localeCompare(a.date));
}
