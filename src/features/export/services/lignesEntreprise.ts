import type { Client } from '@/features/clients/types';
import type { Facture } from '@/features/comptabilite/types';
import type { Element, SousDossier } from '@/features/dossiers/types';
import type { FiscaliteEntreprise } from '@/features/entreprise/services/fiscaliteEntreprise';
import { tvaDuTtc } from '@/features/entreprise/services/fiscaliteEntreprise';
import type { Sejour } from '@/features/gite/types';
import type { Trade } from '@/features/trading/types';
import { dureeJours, multipleR, resultatTrade } from '@/features/trading/services/calculs';
import { statutEffectif } from '@/features/dossiers/services/avancement';
import { cheminDuDossier } from '@/features/dossiers/services/arborescence';
import { factureRow } from '@/features/export/services/lignesExport';
import { nuitsDuSejour } from '@/shared/utils/calendrier';
import { LOCALE } from '@/shared/constants/format';
import {
  LABEL_ETAT_ESPRIT,
  LABEL_SENS_TRADE,
  LABEL_STATUT_ELEMENT,
  LABEL_TYPE_INSTRUMENT,
} from '@/shared/textes/libelles';
import { formatDateShortFR } from '@/shared/utils/dates';
import { nomComplet } from '@/shared/utils/personne';
import { TEXTES } from '@/shared/textes';

const C = TEXTES.export.colonnes;

/** Arrondi à deux décimales, pour des montants lisibles dans un tableau. */
const arrondi = (montant: number): number => Math.round(montant * 100) / 100;

/** Le chiffre d'affaires mois par mois puis le total de l'année ; les colonnes de TVA seulement si l'entreprise y est assujettie. */
export function lignesSynthese(fiscalite: FiscaliteEntreprise, avecTva: boolean) {
  const ligne = (
    libelle: string,
    caHt: number,
    caTtc: number,
    tvaCollectee: number,
    tvaDeductible: number,
  ): Record<string, unknown> => ({
    [C.mois]: libelle,
    [C.caHt]: arrondi(caHt),
    ...(avecTva
      ? {
          [C.caTtc]: arrondi(caTtc),
          [C.tvaCollectee]: arrondi(tvaCollectee),
          [C.tvaDeductible]: arrondi(tvaDeductible),
        }
      : {}),
  });

  const mois = fiscalite.mois.map((m) =>
    ligne(
      new Date(fiscalite.annee, m.mois - 1, 1).toLocaleDateString(LOCALE, { month: 'long' }),
      m.caHt,
      m.caTtc,
      m.tvaCollectee,
      m.tvaDeductible,
    ),
  );
  const total = ligne(
    TEXTES.export.entreprise.ligneTotal,
    fiscalite.caHt,
    fiscalite.caTtc,
    fiscalite.tvaCollectee,
    fiscalite.tvaDeductible,
  );
  const aides =
    fiscalite.aides > 0
      ? [{ [C.mois]: TEXTES.export.entreprise.ligneAides, [C.caHt]: arrondi(fiscalite.aides) }]
      : [];
  return [...mois, total, ...aides];
}

/** Une facture, avec sa TVA et son montant hors taxes quand l'entreprise est assujettie. */
export function factureEntrepriseRow(f: Facture, avecTva: boolean) {
  if (!avecTva) return factureRow(f);
  const tva = tvaDuTtc(f.montant, f.tauxTva);
  return {
    ...factureRow(f),
    [C.dontTva]: arrondi(tva),
    [C.montantHt]: arrondi(f.montant - tva),
  };
}

export function clientRow(c: Client) {
  return {
    [C.nom]: nomComplet(c),
    [C.telephone]: c.telephone ?? '',
    [C.email]: c.email ?? '',
    [C.adresse]: c.adressePostale ?? '',
  };
}

/** Un contenu de dossier : son client, son dossier (chemin complet), ses dates, son avancement et ses étiquettes. */
export function elementRow(e: Element, clients: Client[], sousDossiers: SousDossier[]) {
  const client = clients.find((c) => c.id === e.clientId);
  const chemin = cheminDuDossier(e.dossierId, sousDossiers, clients);
  return {
    [C.client]: client ? nomComplet(client) : '',
    [C.dossier]: chemin,
    [C.titre]: e.titre,
    [C.date]: formatDateShortFR(e.date),
    [C.echeance]: e.echeance ? formatDateShortFR(e.echeance) : '',
    [C.avancement]: LABEL_STATUT_ELEMENT[statutEffectif(e)],
    [C.etiquettes]: (e.etiquettes ?? []).join(', '),
    [C.notes]: e.texte ?? '',
  };
}

export function sejourRow(s: Sejour) {
  return {
    [C.chambre]: s.chambres.join(', '),
    [C.nom]: s.nom,
    [C.arrivee]: formatDateShortFR(s.arrivee),
    [C.depart]: formatDateShortFR(s.depart),
    [C.nuits]: nuitsDuSejour(s.arrivee, s.depart).length,
    [C.personnes]: s.personnes ?? '',
    [C.repas]: s.repas ?? '',
    [C.taxeSejour]: s.taxe ?? '',
    [C.totalPaye]: s.prix,
    [C.paye]: s.paye ? C.oui : C.non,
    [C.datePaiement]: s.paye && s.datePaiement ? formatDateShortFR(s.datePaiement) : '',
    [C.notes]: s.notes ?? '',
  };
}

export function tradeRow(t: Trade) {
  return {
    [C.instrument]: t.instrument,
    [C.typeInstrument]: t.typeInstrument ? LABEL_TYPE_INSTRUMENT[t.typeInstrument] : '',
    [C.sens]: LABEL_SENS_TRADE[t.sens],
    [C.dateEntree]: formatDateShortFR(t.dateEntree),
    [C.prixEntree]: t.prixEntree,
    [C.quantite]: t.quantite,
    [C.dateSortie]: t.dateSortie ? formatDateShortFR(t.dateSortie) : '',
    [C.prixSortie]: t.prixSortie ?? '',
    [C.frais]: t.frais ?? '',
    [C.stop]: t.stop ?? '',
    [C.resultatNet]: resultatTrade(t) ?? '',
    [C.multipleR]: multipleR(t) ?? '',
    [C.dureeJours]: dureeJours(t) ?? '',
    [C.strategie]: t.strategie ?? '',
    [C.planRespecte]: t.planRespecte === undefined ? '' : t.planRespecte ? C.oui : C.non,
    [C.etatEsprit]: t.etatEsprit ? LABEL_ETAT_ESPRIT[t.etatEsprit] : '',
    [C.etiquettes]: (t.etiquettes ?? []).join(', '),
    [C.notes]: t.notes ?? '',
  };
}
