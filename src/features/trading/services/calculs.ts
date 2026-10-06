import type { Trade } from '@/features/trading/types';
import { DECIMALES_MULTIPLE_R, SENS_TRADE } from '@/shared/constants/trading';
import { HEURE_MIDI } from '@/shared/constants/temps';

// Calculs du journal : tout vient des trades saisis, rien n'est estimé ni conseillé. Un résultat est net des frais.

const arrondi = (nombre: number, decimales = 2): number => {
  const facteur = 10 ** decimales;
  return Math.round(nombre * facteur) / facteur;
};

/** Un trade est clos quand sa sortie (date et prix) est renseignée. */
export const estClos = (t: Trade): boolean => t.dateSortie !== undefined && t.prixSortie !== undefined;

/** Résultat net du trade (€) : (sortie − entrée) × quantité dans le sens du trade, moins les frais. Rien tant qu'il est ouvert. */
export function resultatTrade(t: Trade): number | undefined {
  if (!estClos(t)) return undefined;
  const sens = t.sens === SENS_TRADE.ACHAT ? 1 : -1;
  return arrondi((t.prixSortie! - t.prixEntree) * t.quantite * sens - (t.frais ?? 0));
}

/** Le risque pris à l'entrée (€) : l'écart entre l'entrée et le stop, fois la quantité. Rien sans stop. */
export function risqueInitial(t: Trade): number | undefined {
  if (t.stop === undefined) return undefined;
  const risque = Math.abs(t.prixEntree - t.stop) * t.quantite;
  return risque > 0 ? risque : undefined;
}

/** Le résultat en multiples du risque pris (R) : +2 R = deux fois la mise risquée. */
export function multipleR(t: Trade): number | undefined {
  const resultat = resultatTrade(t);
  const risque = risqueInitial(t);
  return resultat === undefined || risque === undefined
    ? undefined
    : arrondi(resultat / risque, DECIMALES_MULTIPLE_R);
}

/** Durée du trade en jours (0 pour un trade ouvert et clos le même jour). */
export function dureeJours(t: Trade): number | undefined {
  if (!t.dateSortie) return undefined;
  const jours =
    (new Date(`${t.dateSortie}${HEURE_MIDI}`).getTime() -
      new Date(`${t.dateEntree}${HEURE_MIDI}`).getTime()) /
    86_400_000;
  return Math.max(0, Math.round(jours));
}

/** Les trades clos, dans l'ordre de leur clôture. */
export const tradesClos = (trades: Trade[]): Trade[] =>
  trades.filter(estClos).sort((a, b) => a.dateSortie!.localeCompare(b.dateSortie!));

/** Les trades d'une année : ceux clos cette année-là, et les ouverts qui y ont commencé. */
export const tradesDeLAnnee = (trades: Trade[], annee: string): Trade[] =>
  trades.filter((t) => (t.dateSortie ?? t.dateEntree).startsWith(annee));

export interface Statistiques {
  nombre: number;
  clos: number;
  ouverts: number;
  gagnants: number;
  perdants: number;
  /** En % des trades clos ; absent sans trade clos. */
  tauxReussite?: number;
  resultatNet: number;
  gainMoyen?: number;
  /** Positive : la perte moyenne d'un trade perdant. */
  perteMoyenne?: number;
  /** Gains totaux ÷ pertes totales ; absent sans perte. */
  profitFactor?: number;
  /** Résultat moyen par trade clos. */
  esperance?: number;
  meilleur?: { trade: Trade; resultat: number };
  pire?: { trade: Trade; resultat: number };
  /** Plus forte baisse (positive) du cumul des résultats depuis son sommet. */
  drawdownMax: number;
  /** Résultat moyen en R, sur les trades qui ont un stop. */
  rMoyen?: number;
}

export function calculerStatistiques(trades: Trade[]): Statistiques {
  const clos = tradesClos(trades);
  const resultats = clos.map((t) => ({ trade: t, resultat: resultatTrade(t)! }));
  const gains = resultats.filter((r) => r.resultat > 0);
  const pertes = resultats.filter((r) => r.resultat < 0);
  const totalGains = gains.reduce((s, r) => s + r.resultat, 0);
  const totalPertes = Math.abs(pertes.reduce((s, r) => s + r.resultat, 0));
  const resultatNet = arrondi(resultats.reduce((s, r) => s + r.resultat, 0));

  let cumul = 0;
  let sommet = 0;
  let drawdownMax = 0;
  for (const { resultat } of resultats) {
    cumul += resultat;
    sommet = Math.max(sommet, cumul);
    drawdownMax = Math.max(drawdownMax, sommet - cumul);
  }

  const multiples = clos.map(multipleR).filter((r): r is number => r !== undefined);
  const parResultat = [...resultats].sort((a, b) => a.resultat - b.resultat);

  return {
    nombre: trades.length,
    clos: clos.length,
    ouverts: trades.length - clos.length,
    gagnants: gains.length,
    perdants: pertes.length,
    tauxReussite: clos.length > 0 ? arrondi((gains.length / clos.length) * 100, 0) : undefined,
    resultatNet,
    gainMoyen: gains.length > 0 ? arrondi(totalGains / gains.length) : undefined,
    perteMoyenne: pertes.length > 0 ? arrondi(totalPertes / pertes.length) : undefined,
    profitFactor: totalPertes > 0 ? arrondi(totalGains / totalPertes) : undefined,
    esperance: clos.length > 0 ? arrondi(resultatNet / clos.length) : undefined,
    meilleur:
      parResultat.length > 0 && parResultat[parResultat.length - 1].resultat > 0
        ? parResultat[parResultat.length - 1]
        : undefined,
    pire: parResultat.length > 0 && parResultat[0].resultat < 0 ? parResultat[0] : undefined,
    drawdownMax: arrondi(drawdownMax),
    rMoyen:
      multiples.length > 0
        ? arrondi(multiples.reduce((s, r) => s + r, 0) / multiples.length, DECIMALES_MULTIPLE_R)
        : undefined,
  };
}

export interface GroupeResultat {
  cle: string;
  libelle: string;
  nombre: number;
  resultat: number;
  moyenne: number;
  /** En % des trades clos du groupe. */
  tauxReussite: number;
}

/** Les résultats des trades clos regroupés (par stratégie, instrument…), le meilleur résultat total en premier. */
export function grouperPar(
  trades: Trade[],
  cle: (t: Trade) => string | undefined,
  libelle: (cle: string) => string = (c) => c,
): GroupeResultat[] {
  const groupes = new Map<string, number[]>();
  for (const t of tradesClos(trades)) {
    const k = cle(t);
    if (!k) continue;
    groupes.set(k, [...(groupes.get(k) ?? []), resultatTrade(t)!]);
  }
  return [...groupes.entries()]
    .map(([k, resultats]) => {
      const total = resultats.reduce((s, r) => s + r, 0);
      return {
        cle: k,
        libelle: libelle(k),
        nombre: resultats.length,
        resultat: arrondi(total),
        moyenne: arrondi(total / resultats.length),
        tauxReussite: arrondi((resultats.filter((r) => r > 0).length / resultats.length) * 100, 0),
      };
    })
    .sort((a, b) => b.resultat - a.resultat);
}

/** Le nombre de pertes consécutives jusqu'au dernier trade clos. */
export function serieDePertesEnCours(trades: Trade[]): number {
  let serie = 0;
  for (const t of tradesClos(trades).reverse()) {
    if (resultatTrade(t)! < 0) serie += 1;
    else break;
  }
  return serie;
}
