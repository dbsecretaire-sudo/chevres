import {
  LABEL_CATEGORIE_DEPENSE,
  LABEL_CATEGORIE_RECETTE,
  LABEL_CATEGORIE_VENTE,
  LABEL_TYPE_AIDE,
  LABEL_TYPE_ALIMENT,
  LABEL_TYPE_CARBURANT,
} from '@/shared/textes/libelles';
import { activiteVente, partsDeFacture } from '@/features/comptabilite/utils/activite';
import { libelleCategorieVente } from '@/features/comptabilite/utils/ventes';
import type { ActiviteComptable, Facture, Vente } from '@/features/comptabilite/types';
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
  RUBRIQUE_COMPTABLE_DE_MARCHANDISE,
  TYPE_AIDE,
  TYPE_ALIMENT,
} from '@/shared/constants/comptabilite';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { TEXTES } from '@/shared/textes';

export interface Transaction {
  id: string;
  date: string;
  /** Montant de l'écriture entière (le total de la facture, même si elle est répartie entre plusieurs cheptels). */
  montant?: number;
  /** Part de `montant` qui revient à l'activité de cette ligne (toutes catégories) : c'est elle qu'on additionne. */
  montantActivite?: number;
  /** Part de `montant` qui compte dans les soldes : tout, aliments de la liste du stock comme le reste. */
  montantComptabilise?: number;
  sens: ValeurDe<typeof SENS_TRANSACTION>;
  titre: string;
  sousTitre: string;
  source: ValeurDe<typeof SOURCE_TRANSACTION>;
  /** Activité (espèce, ou « commun ») de l'écriture. */
  activite: ActiviteComptable;
  /** Catégorie d'une facture (recette ou dépense) : sert à classer l'écriture par rubrique (gîte, bar, activité). */
  categorie?: string;
  /** Pour un achat de marchandises détaillé : les rubriques (gîte, bar, activité) que ses lignes servent. */
  rubriques?: string[];
  /** Le nom de la catégorie de l'écriture (« Alimentation », « Vente de fromage »…), pour la recherche. */
  libelleCategorie?: string;
  /** Ce que la facture détaille (ses aliments, son matériel, ses marchandises, ses carburants), pour la recherche. */
  termes?: string[];
}

/** Les noms des lignes d'une facture : aliments et matériel, marchandises, carburants (de quoi retrouver « Fourmix »). */
function termesDeFacture(f: Facture): string[] {
  return [
    ...(f.lignesAlimentation ?? []).map((l) =>
      l.type === TYPE_ALIMENT.AUTRE && l.typeLibre ? l.typeLibre : LABEL_TYPE_ALIMENT[l.type],
    ),
    ...(f.lignesMarchandises ?? []).map((l) => l.marchandise),
    ...(f.lignesCarburant ?? []).map((l) => LABEL_TYPE_CARBURANT[l.type]),
  ].filter(Boolean);
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
    montantActivite: v.prix,
    montantComptabilise: v.prix,
    sens: SENS_TRANSACTION.ENTREE,
    titre: titreVente(v),
    sousTitre: v.precision
      ? `${TEXTES.comptabilite.transactions.venteDeProduction} · ${v.precision}`
      : TEXTES.comptabilite.transactions.venteDeProduction,
    source: SOURCE_TRANSACTION.VENTE,
    activite: activiteVente(v),
    libelleCategorie: LABEL_CATEGORIE_VENTE[v.categorie],
  }));

  // Une facture d'alimentation répartie entre des cheptels donne une ligne par cheptel : `montant` reste le
  // total de la facture (affiché dans le sous-titre), `montantComptabilise` la part du cheptel.
  const deFactures: Transaction[] = factures.flatMap((f) =>
    partsDeFacture(f).map(({ activite, facture: part }) => ({
      id: f.id,
      date: f.date,
      montant: f.montant,
      montantActivite: part.montant,
      montantComptabilise: part.montant,
      sens: f.type === TYPE_FACTURE.EMISE ? SENS_TRANSACTION.ENTREE : SENS_TRANSACTION.SORTIE,
      titre: f.tiers,
      sousTitre:
        f.categorieRecette === CATEGORIE_RECETTE.AIDE && f.typeAide
          ? f.typeAide === TYPE_AIDE.AUTRE && f.typeAideLibre
            ? f.typeAideLibre
            : LABEL_TYPE_AIDE[f.typeAide]
          : f.description,
      source: SOURCE_TRANSACTION.FACTURE,
      activite,
      categorie: f.categorieRecette ?? f.categorieDepense,
      libelleCategorie: f.categorieRecette
        ? LABEL_CATEGORIE_RECETTE[f.categorieRecette]
        : f.categorieDepense
          ? LABEL_CATEGORIE_DEPENSE[f.categorieDepense]
          : undefined,
      termes: termesDeFacture(f),
      rubriques: f.lignesMarchandises?.length
        ? [...new Set(f.lignesMarchandises.map((l) => RUBRIQUE_COMPTABLE_DE_MARCHANDISE[l.rubrique]))]
        : undefined,
    })),
  );

  return [...deVentes, ...deFactures].sort((a, b) => b.date.localeCompare(a.date));
}
