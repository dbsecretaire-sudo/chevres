import type { Facture, TypeFromage, UniteVente, Vente } from '@/features/comptabilite/types';
import {
  CATEGORIE_RECETTE,
  CATEGORIE_VENTE,
  SOURCE_TRANSACTION,
  TYPE_FACTURE,
  TYPE_FROMAGE,
  UNITE_VENTE,
} from '@/shared/constants/comptabilite';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { TEXTES } from '@/shared/textes';
import { LABEL_CATEGORIE_VENTE, LABEL_TYPE_FROMAGE, LABEL_UNITE_VENTE_COURT } from '@/shared/textes/libelles';

/** Une vente ou une facture émise rattachée à un client, prête à être listée. */
export interface EcritureClient {
  id: string;
  date: string;
  titre: string;
  montant: number;
  source: ValeurDe<typeof SOURCE_TRANSACTION>;
}

export const libelleUnite = (unite: string) => LABEL_UNITE_VENTE_COURT[unite as UniteVente] ?? unite;

/** Les ventes et factures émises d'un client (rattachées par son nom affiché), de la plus récente à la plus ancienne. */
export function ecrituresDuClient(ventes: Vente[], factures: Facture[]): EcritureClient[] {
  const deVentes: EcritureClient[] = ventes.map((v) => ({
    id: v.id,
    date: v.date,
    titre: `${LABEL_CATEGORIE_VENTE[v.categorie] ?? v.categorie} — ${v.quantite} ${
      v.categorie === CATEGORIE_VENTE.LAIT ? LABEL_UNITE_VENTE_COURT[UNITE_VENTE.LITRES] : v.unite
    }`,
    montant: v.prix ?? 0,
    source: SOURCE_TRANSACTION.VENTE,
  }));
  const deFactures: EcritureClient[] = factures.map((f) => ({
    id: f.id,
    date: f.date,
    titre: f.description || TEXTES.commun.general.facture,
    montant: f.montant,
    source: SOURCE_TRANSACTION.FACTURE,
  }));
  return [...deVentes, ...deFactures].sort((a, b) => b.date.localeCompare(a.date));
}

/** Sélectionne, parmi toutes les ventes et factures, celles de ce client. */
export function filtrerParClient(nomAffiche: string, ventes: Vente[], factures: Facture[]) {
  return {
    ventes: ventes.filter((v) => v.client === nomAffiche),
    factures: factures.filter((f) => f.type === TYPE_FACTURE.EMISE && f.tiers === nomAffiche),
  };
}

export interface DetailFromage {
  type: TypeFromage;
  libelle: string;
  quantite: number;
  unite: string;
}

export interface ResumeClient {
  aLait: boolean;
  totalLitresLait: number;
  aFromage: boolean;
  totalFromage: number;
  uniteFromage: string;
  /** Faux si les ventes de fromage mélangent plusieurs unités (le total n'a alors pas d'unité commune). */
  uniteFromageUniforme: boolean;
  detailFromage: DetailFromage[];
  aCabris: boolean;
  nombreCabris: number;
  kgCabris: number;
  aAide: boolean;
  montantAide: number;
  aAutre: boolean;
  montantAutre: number;
  totalPaye: number;
}

const somme = <T>(liste: T[], valeur: (element: T) => number) =>
  liste.reduce((total, e) => total + valeur(e), 0);

/** Totaux par catégorie (lait, fromage et son détail par type, cabris, aides, autres) et total payé par le client. */
export function calculerResumeClient(
  ventes: Vente[],
  factures: Facture[],
  ecritures: EcritureClient[],
): ResumeClient {
  const ventesLait = ventes.filter((v) => v.categorie === CATEGORIE_VENTE.LAIT);
  const ventesFromage = ventes.filter((v) => v.categorie === CATEGORIE_VENTE.FROMAGE);
  const ventesCabris = ventes.filter((v) => v.categorie === CATEGORIE_VENTE.CABRIS);
  const facturesAide = factures.filter((f) => f.categorieRecette === CATEGORIE_RECETTE.AIDE);
  const facturesAutre = factures.filter((f) => f.categorieRecette === CATEGORIE_RECETTE.AUTRE);

  const uniteFromage = ventesFromage.length > 0 ? ventesFromage[0].unite : UNITE_VENTE.PIECE;

  const detailFromage = (Object.keys(LABEL_TYPE_FROMAGE) as TypeFromage[])
    .map((type) => {
      const lignes = ventesFromage.filter((v) => (v.typeFromage ?? TYPE_FROMAGE.AUTRE) === type);
      const libelleLibre = type === TYPE_FROMAGE.AUTRE ? lignes.find((v) => v.typeFromageLibre) : undefined;
      return {
        type,
        libelle: libelleLibre?.typeFromageLibre ?? LABEL_TYPE_FROMAGE[type],
        quantite: somme(lignes, (v) => v.quantite),
        unite: lignes.length > 0 ? lignes[0].unite : uniteFromage,
      };
    })
    .filter((d) => d.quantite > 0);

  return {
    aLait: ventesLait.length > 0,
    totalLitresLait: somme(ventesLait, (v) => v.quantite),
    aFromage: ventesFromage.length > 0,
    totalFromage: somme(ventesFromage, (v) => v.quantite),
    uniteFromage,
    uniteFromageUniforme: ventesFromage.every((v) => v.unite === uniteFromage),
    detailFromage,
    aCabris: ventesCabris.length > 0,
    nombreCabris: somme(ventesCabris, (v) => v.quantite),
    kgCabris: somme(ventesCabris, (v) => v.poidsKg ?? 0),
    aAide: facturesAide.length > 0,
    montantAide: somme(facturesAide, (f) => f.montant),
    aAutre: facturesAutre.length > 0,
    montantAutre: somme(facturesAutre, (f) => f.montant),
    totalPaye: somme(ecritures, (e) => e.montant),
  };
}
