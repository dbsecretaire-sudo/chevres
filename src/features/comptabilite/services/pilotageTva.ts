import { listFactures } from '@/features/comptabilite/repository/factures';
import { listVentes } from '@/features/comptabilite/repository/ventes';
import type { Facture, Vente } from '@/features/comptabilite/types';
import { partsDeLaVente, venteADeclarer } from '@/features/comptabilite/utils/ventes';
import { estCategorieVente } from '@/features/comptabilite/utils/recettes';
import { tauxTvaDeLaVente } from '@/shared/dictionnaire/tauxParProduit';
import { tvaDuTtc } from '@/features/comptabilite/utils/tva';
import { CATEGORIE_RECETTE, TYPE_FACTURE } from '@/shared/constants/comptabilite';
import {
  CATEGORIES_DEPENSE_SANS_TVA,
  MOIS_PAR_PERIODE,
  PERIODICITE_TVA,
  REGIME_TVA_PILOTAGE,
  TYPE_CONTROLE_TVA,
} from '@/shared/constants/tva';
import type { ValeurDe } from '@/shared/constants/valeurDe';

// Le pilotage de la TVA : la TVA collectée (ventes à déclarer et factures émises) moins la TVA déductible (factures reçues), par période
// et par taux, d'après les taux saisis sur chaque écriture. Une aide à la déclaration : elle ne remplace pas votre comptable.

export type RegimeTvaPilotage = ValeurDe<typeof REGIME_TVA_PILOTAGE>;
export type PeriodiciteTva = ValeurDe<typeof PERIODICITE_TVA>;
export type TypeControleTva = ValeurDe<typeof TYPE_CONTROLE_TVA>;

/** La TVA d'un taux (en %) : la base hors taxes des recettes, la TVA collectée sur elles et la TVA déductible des achats. */
export interface LigneTauxTvaPilotage {
  taux: number;
  baseHtRecettes: number;
  collectee: number;
  deductible: number;
}

/** Une période de la déclaration : ses mois (de 1 à 12), ses montants et son détail par taux. */
export interface PeriodeTva {
  /** Le premier et le dernier mois (1 à 12) de la période. */
  debut: number;
  fin: number;
  collectee: number;
  deductible: number;
  /** Positif : TVA à payer ; négatif : crédit de TVA. */
  solde: number;
  parTaux: LigneTauxTvaPilotage[];
}

/** Une anomalie repérée sur une vente ou une facture. */
export interface ControleTva {
  type: TypeControleTva;
  source: 'vente' | 'facture';
  id: string;
  date: string;
  /** Le client ou le fournisseur, de quoi reconnaître l'écriture. */
  libelle: string;
  montant: number;
  /** Le taux saisi (absent : aucun) et le taux d'usage de la catégorie (seulement pour un taux inhabituel). */
  taux?: number;
  tauxAttendu?: number;
}

export interface PilotageTva {
  annee: number;
  regime: RegimeTvaPilotage;
  periodicite: PeriodiciteTva;
  periodes: PeriodeTva[];
  /** Les totaux de l'année. */
  collectee: number;
  deductible: number;
  solde: number;
  parTaux: LigneTauxTvaPilotage[];
  /** Au remboursement forfaitaire agricole : la base (recettes hors taxes déclarées), le taux (%) et le remboursement estimé. */
  rfa?: { base: number; taux: number; montant: number };
  controles: ControleTva[];
}

export interface EntreePilotageTva {
  annee: number;
  ventes: Vente[];
  factures: Facture[];
  regime: RegimeTvaPilotage;
  periodicite: PeriodiciteTva;
  /** Le taux (%) du remboursement forfaitaire agricole, au régime RFA. */
  tauxRfa?: number;
}

const moisDe = (date: string): number => Number(date.slice(5, 7));

/** Une recette de la période : sa date, son taux, son montant TTC, et ce qui permet de la retrouver. */
interface RecetteTva {
  date: string;
  ttc: number;
  taux?: number;
}

/** Les recettes de TVA de l'année : les ventes que le client souhaite déclarer et les factures émises (hors aides, dépôts et dons). */
function recettesTva(ventes: Vente[], factures: Facture[]): RecetteTva[] {
  return [
    ...ventes
      .filter(venteADeclarer)
      .flatMap((v) => partsDeLaVente(v).map((p) => ({ date: v.date, ttc: p.ttc, taux: p.taux }))),
    ...factures
      .filter(
        (f) =>
          f.type === TYPE_FACTURE.EMISE &&
          f.categorieRecette !== CATEGORIE_RECETTE.AIDE &&
          f.categorieRecette !== CATEGORIE_RECETTE.DEPOT &&
          f.categorieRecette !== CATEGORIE_RECETTE.DONS,
      )
      .map((f) => ({ date: f.date, ttc: f.montant, taux: f.tauxTva })),
  ];
}

/** Les anomalies de TVA : taux absent ou inhabituel sur une recette, achat sans TVA. Aucune quand l'exploitation ne déclare pas de TVA. */
function controlerTva(ventes: Vente[], factures: Facture[]): ControleTva[] {
  const controles: ControleTva[] = [];
  for (const v of ventes.filter(venteADeclarer)) {
    const attendu = estCategorieVente(v.categorie) ? tauxTvaDeLaVente(v.categorie) : undefined;
    const base = {
      source: 'vente' as const,
      id: v.id,
      date: v.date,
      libelle: v.client ?? '',
      montant: v.prix ?? 0,
    };
    if (v.tauxTva === undefined) {
      controles.push({ ...base, type: TYPE_CONTROLE_TVA.VENTE_SANS_TAUX, tauxAttendu: attendu });
    } else if (attendu !== undefined && v.tauxTva !== attendu) {
      controles.push({
        ...base,
        type: TYPE_CONTROLE_TVA.VENTE_TAUX_INHABITUEL,
        taux: v.tauxTva,
        tauxAttendu: attendu,
      });
    }
  }
  for (const f of factures) {
    const base = { source: 'facture' as const, id: f.id, date: f.date, libelle: f.tiers, montant: f.montant };
    if (f.type === TYPE_FACTURE.EMISE) {
      const horsTva =
        f.categorieRecette === CATEGORIE_RECETTE.AIDE ||
        f.categorieRecette === CATEGORIE_RECETTE.DEPOT ||
        f.categorieRecette === CATEGORIE_RECETTE.DONS;
      if (!horsTva && f.tauxTva === undefined) {
        controles.push({ ...base, type: TYPE_CONTROLE_TVA.RECETTE_SANS_TAUX });
      }
    } else if (
      !(f.categorieDepense && CATEGORIES_DEPENSE_SANS_TVA.includes(f.categorieDepense)) &&
      !f.tauxTva
    ) {
      controles.push({ ...base, type: TYPE_CONTROLE_TVA.ACHAT_SANS_TVA, taux: f.tauxTva });
    }
  }
  return controles.sort((a, b) => b.date.localeCompare(a.date));
}

/** Le pilotage de la TVA d'une année, d'après les ventes et les factures données (calcul pur). */
export function calculerPilotageTva(entree: EntreePilotageTva): PilotageTva {
  const { annee, ventes, factures, regime, periodicite } = entree;
  const sansTva = regime === REGIME_TVA_PILOTAGE.FRANCHISE || regime === REGIME_TVA_PILOTAGE.RFA;
  const pas = MOIS_PAR_PERIODE[periodicite];
  const periodes: PeriodeTva[] = Array.from({ length: 12 / pas }, (_, i) => ({
    debut: i * pas + 1,
    fin: (i + 1) * pas,
    collectee: 0,
    deductible: 0,
    solde: 0,
    parTaux: [],
  }));
  const parTaux = new Map<number, LigneTauxTvaPilotage>();
  const ligne = (liste: Map<number, LigneTauxTvaPilotage>, taux: number) => {
    if (!liste.has(taux)) liste.set(taux, { taux, baseHtRecettes: 0, collectee: 0, deductible: 0 });
    return liste.get(taux) as LigneTauxTvaPilotage;
  };
  const parTauxDePeriode = periodes.map(() => new Map<number, LigneTauxTvaPilotage>());
  const periodeDe = (date: string) => Math.floor((moisDe(date) - 1) / pas);

  if (!sansTva) {
    for (const r of recettesTva(ventes, factures)) {
      const m = moisDe(r.date);
      if (m < 1 || m > 12 || !r.taux) continue;
      const tva = tvaDuTtc(r.ttc, r.taux);
      const p = periodes[periodeDe(r.date)];
      p.collectee += tva;
      for (const liste of [parTaux, parTauxDePeriode[periodeDe(r.date)]]) {
        const l = ligne(liste, r.taux);
        l.collectee += tva;
        l.baseHtRecettes += r.ttc - tva;
      }
    }
    // Une dépense non facturée n'a pas de TVA à déduire.
    for (const f of factures.filter((x) => x.type === TYPE_FACTURE.RECUE && !x.sansFacture)) {
      const m = moisDe(f.date);
      if (m < 1 || m > 12 || !f.tauxTva) continue;
      const tva = tvaDuTtc(f.montant, f.tauxTva);
      periodes[periodeDe(f.date)].deductible += tva;
      ligne(parTaux, f.tauxTva).deductible += tva;
      ligne(parTauxDePeriode[periodeDe(f.date)], f.tauxTva).deductible += tva;
    }
  }
  periodes.forEach((p, i) => {
    p.solde = p.collectee - p.deductible;
    p.parTaux = [...parTauxDePeriode[i].values()].sort((a, b) => a.taux - b.taux);
  });
  const collectee = periodes.reduce((t, p) => t + p.collectee, 0);
  const deductible = periodes.reduce((t, p) => t + p.deductible, 0);

  // Au RFA, l'agriculteur ne déclare pas de TVA : il reçoit un remboursement forfaitaire (un % des recettes hors taxes déclarées).
  let rfa: PilotageTva['rfa'];
  if (regime === REGIME_TVA_PILOTAGE.RFA) {
    const base = recettesTva(ventes, factures).reduce(
      (t, r) => t + (r.taux ? r.ttc - tvaDuTtc(r.ttc, r.taux) : r.ttc),
      0,
    );
    const taux = entree.tauxRfa ?? 0;
    rfa = { base, taux, montant: (base * taux) / 100 };
  }

  return {
    annee,
    regime,
    periodicite,
    periodes,
    collectee,
    deductible,
    solde: collectee - deductible,
    parTaux: [...parTaux.values()].sort((a, b) => a.taux - b.taux),
    rfa,
    controles: sansTva ? [] : controlerTva(ventes, factures),
  };
}

/** Le pilotage de la TVA d'une année, d'après les ventes et factures enregistrées. */
export async function pilotageTva(
  annee: number,
  reglages: { regime: RegimeTvaPilotage; periodicite: PeriodiciteTva; tauxRfa?: number },
): Promise<PilotageTva> {
  const [ventes, factures] = await Promise.all([listVentes(annee), listFactures(annee)]);
  return calculerPilotageTva({ annee, ventes, factures, ...reglages });
}
