import type { Facture } from '@/features/comptabilite/types';
import type { Sejour } from '@/features/gite/types';
import type { Trade } from '@/features/trading/types';
import { etatDeLaReservation } from '@/features/export/services/lignesEntreprise';
import { tvaDuTtc } from '@/features/entreprise/services/fiscaliteEntreprise';
import { resultatTrade } from '@/features/trading/services/calculs';
import { nuitsDuSejour } from '@/shared/utils/calendrier';
import { TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { LABEL_CATEGORIE_DEPENSE, LABEL_CATEGORIE_RECETTE, LABEL_SENS_TRADE } from '@/shared/textes/libelles';
import { formatDateShortFR, formatMontant } from '@/shared/utils/dates';
import { TEXTES } from '@/shared/textes';

const C = TEXTES.export.colonnes;
const P = TEXTES.export.pdf.entreprise.colonnes;

/** Les factures de l'année en PDF : l'essentiel d'une ligne (la date, le tiers, la catégorie, le montant, la TVA si assujetti). */
export function lignesFacturesPdf(factures: Facture[], avecTva: boolean) {
  return [...factures]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((f) => {
      const recue = f.type === TYPE_FACTURE.RECUE;
      const categorie = recue
        ? f.categorieDepense
          ? LABEL_CATEGORIE_DEPENSE[f.categorieDepense]
          : ''
        : f.categorieRecette
          ? LABEL_CATEGORIE_RECETTE[f.categorieRecette]
          : '';
      return {
        [C.date]: formatDateShortFR(f.date),
        [C.type]: recue ? TEXTES.commun.general.debit : TEXTES.commun.general.credit,
        [C.fournisseurClient]: f.tiers,
        [C.note]: f.description,
        [C.categorie]: categorie,
        [P.montantTtc]: formatMontant(recue ? -f.montant : f.montant),
        ...(avecTva ? { [P.tva]: formatMontant(tvaDuTtc(f.montant, f.tauxTva)) } : {}),
      };
    });
}

/** Les séjours du gîte : les dates, qui, combien de nuits, le total et s'il est payé. */
export function lignesSejoursPdf(sejours: Sejour[]) {
  return sejours.map((s) => ({
    [C.arrivee]: formatDateShortFR(s.arrivee),
    [C.depart]: formatDateShortFR(s.depart),
    [C.nom]: s.nom,
    [C.chambre]: s.chambres.join(', '),
    [C.nuits]: nuitsDuSejour(s.arrivee, s.depart).length,
    [C.totalPaye]: formatMontant(s.prix),
    [C.paye]: s.paye ? C.oui : C.non,
    [C.reservation]: TEXTES.export.entreprise.reservation[etatDeLaReservation(s)],
  }));
}

/** Les trades de l'année : l'entrée, le sens, la quantité, la sortie et le résultat net. */
export function lignesTradesPdf(trades: Trade[]) {
  return trades.map((t) => ({
    [C.dateEntree]: formatDateShortFR(t.dateEntree),
    [C.instrument]: t.instrument,
    [C.sens]: LABEL_SENS_TRADE[t.sens],
    [C.quantite]: t.quantite,
    [C.prixEntree]: t.prixEntree,
    [C.prixSortie]: t.prixSortie ?? '',
    [C.resultatNet]: resultatTrade(t) === undefined ? '' : formatMontant(resultatTrade(t)),
  }));
}
