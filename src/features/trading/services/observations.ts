import type { Trade } from '@/features/trading/types';
import {
  calculerStatistiques,
  grouperPar,
  serieDePertesEnCours,
  resultatTrade,
  risqueInitial,
  tradesClos,
} from '@/features/trading/services/calculs';
import { LOCALE } from '@/shared/constants/format';
import { HEURE_MIDI } from '@/shared/constants/temps';
import {
  MAX_OBSERVATIONS,
  MIN_TRADES_GROUPE,
  MIN_TRADES_OBSERVATIONS,
  SERIE_PERTES_SIGNALEE,
  SEUIL_TRADES_SANS_STOP,
} from '@/shared/constants/trading';
import { LABEL_ETAT_ESPRIT } from '@/shared/textes/libelles';
import { formatMontant } from '@/shared/utils/dates';
import { TEXTES } from '@/shared/textes';

/** Le jour de la semaine d'une date, en toutes lettres (« lundi »). */
export const jourDeLaSemaine = (iso: string): string =>
  new Date(`${iso}${HEURE_MIDI}`).toLocaleDateString(LOCALE, { weekday: 'long' });

/**
 * Ce que les trades clos montrent, en constats chiffrés tirés de vos propres saisies : l'espérance, la série de pertes en
 * cours, le plan, les stratégies, l'état d'esprit, le jour de la semaine, les stops. Ce sont des constats sur le passé,
 * pas des conseils. Sans assez de trades clos, aucune observation n'est donnée.
 */
export function observationsDuJournal(trades: Trade[]): string[] {
  const T = TEXTES.trading.observations;
  const clos = tradesClos(trades);
  if (clos.length < MIN_TRADES_OBSERVATIONS) return [];

  const stats = calculerStatistiques(trades);
  const constats: string[] = [];

  const serie = serieDePertesEnCours(trades);
  if (serie >= SERIE_PERTES_SIGNALEE) constats.push(T.seriePertes(serie));

  if (stats.esperance !== undefined) {
    constats.push(
      stats.esperance >= 0
        ? T.esperancePositive(formatMontant(stats.esperance))
        : T.esperanceNegative(formatMontant(Math.abs(stats.esperance))),
    );
  }

  if (
    stats.tauxReussite !== undefined &&
    stats.tauxReussite >= 50 &&
    stats.gainMoyen !== undefined &&
    stats.perteMoyenne !== undefined &&
    stats.perteMoyenne > stats.gainMoyen
  ) {
    constats.push(
      T.gainsPetitsPertesGrosses(
        stats.tauxReussite,
        formatMontant(stats.gainMoyen),
        formatMontant(stats.perteMoyenne),
      ),
    );
  }

  // Le plan : les trades hors plan font-ils moins bien que ceux qui le respectent ?
  const parPlan = grouperPar(trades, (t) =>
    t.planRespecte === undefined ? undefined : t.planRespecte ? 'oui' : 'non',
  );
  const dansPlan = parPlan.find((g) => g.cle === 'oui');
  const horsPlan = parPlan.find((g) => g.cle === 'non');
  if (
    dansPlan &&
    horsPlan &&
    dansPlan.nombre >= MIN_TRADES_GROUPE &&
    horsPlan.nombre >= MIN_TRADES_GROUPE &&
    horsPlan.moyenne < dansPlan.moyenne
  ) {
    constats.push(
      T.horsPlan(
        formatMontant(horsPlan.moyenne),
        horsPlan.nombre,
        formatMontant(dansPlan.moyenne),
        dansPlan.nombre,
      ),
    );
  }

  // Stratégies : la meilleure et la plus coûteuse, quand elles diffèrent.
  const strategies = grouperPar(trades, (t) => t.strategie?.trim() || undefined).filter(
    (g) => g.nombre >= MIN_TRADES_GROUPE,
  );
  if (strategies.length >= 2) {
    const meilleure = strategies[0];
    const pire = strategies[strategies.length - 1];
    if (meilleure.resultat > 0) {
      constats.push(
        T.meilleureStrategie(
          meilleure.libelle,
          formatMontant(meilleure.resultat),
          meilleure.nombre,
          meilleure.tauxReussite,
        ),
      );
    }
    if (pire.resultat < 0) {
      constats.push(
        T.strategieCouteuse(pire.libelle, formatMontant(pire.resultat), pire.nombre, pire.tauxReussite),
      );
    }
  }

  // État d'esprit : celui qui coûte le plus par trade.
  const etats = grouperPar(
    trades,
    (t) => t.etatEsprit,
    (c) => LABEL_ETAT_ESPRIT[c as keyof typeof LABEL_ETAT_ESPRIT] ?? c,
  )
    .filter((g) => g.nombre >= MIN_TRADES_GROUPE)
    .sort((a, b) => a.moyenne - b.moyenne);
  if (etats.length >= 2 && etats[0].moyenne < 0) {
    constats.push(
      T.etatEsprit(etats[0].libelle.toLowerCase(), formatMontant(etats[0].moyenne), etats[0].nombre),
    );
  }

  // Jour de la semaine : le plus faible par trade.
  const jours = grouperPar(trades, (t) => jourDeLaSemaine(t.dateEntree))
    .filter((g) => g.nombre >= MIN_TRADES_GROUPE)
    .sort((a, b) => a.moyenne - b.moyenne);
  if (jours.length >= 2 && jours[0].moyenne < 0) {
    constats.push(T.jourFaible(jours[0].libelle, formatMontant(jours[0].moyenne), jours[0].nombre));
  }

  // Stops : une part élevée de trades sans stop empêche de mesurer le risque pris.
  const sansStop = clos.filter((t) => risqueInitial(t) === undefined).length;
  const partSansStop = Math.round((sansStop / clos.length) * 100);
  if (partSansStop >= SEUIL_TRADES_SANS_STOP) constats.push(T.sansStop(partSansStop));

  // Un trade perdant qui a coûté plus que trois fois la perte moyenne : à relire.
  if (
    stats.perteMoyenne !== undefined &&
    stats.pire &&
    Math.abs(stats.pire.resultat) > 3 * stats.perteMoyenne
  ) {
    constats.push(
      T.perteExceptionnelle(
        stats.pire.trade.instrument,
        formatMontant(stats.pire.resultat),
        formatMontant(stats.perteMoyenne),
      ),
    );
  }

  return constats.slice(0, MAX_OBSERVATIONS);
}

/** Pour l'aperçu d'un trade : son résultat en texte signé (« +120,00 € »). */
export function resultatSigne(trade: Trade): string | undefined {
  const resultat = resultatTrade(trade);
  if (resultat === undefined) return undefined;
  return `${resultat > 0 ? '+' : ''}${formatMontant(resultat)}`;
}
