import { listClients } from '@/features/clients/repository';
import { getVente } from '@/features/comptabilite/repository/ventes';
import type { Vente } from '@/features/comptabilite/types';
import {
  cartesHtml,
  documentHtml,
  ecrireEtPartagerPdf,
  noteHtml,
  sectionHtml,
  tableauHtml,
} from '@/features/export/services/htmlPdf';
import { getSettings } from '@/features/settings/settings';
import { lireArchiveStock } from '@/features/stock/repository';
import { tracabiliteDuLot, type DestinationDeLot, type TracabiliteLot } from '@/features/stock/services/tracabiliteLot';
import { FORMAT_EXPORT, NOM_FICHIER_EXPORT_TRACABILITE_LOT } from '@/shared/constants/export';
import { ETAT_LOT } from '@/shared/constants/stock';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';

const P = TEXTES.export.pdf.tracabiliteLot;
const C = P.colonnes;

/** L'état d'un lot en mots, avec le client d'une réservation et la date d'un rappel. */
const etatEnMots = (d: DestinationDeLot): string =>
  d.etat === ETAT_LOT.RAPPELE && d.dateRappel
    ? P.rappeleLe(formatDateFR(d.dateRappel))
    : d.reserve && d.client
      ? P.reservePour(d.client)
      : TEXTES.stock.lots.etat[d.etat];

const contact = (d: DestinationDeLot): string => [d.telephone, d.email, d.adresse].filter(Boolean).join(' · ');

/** Le corps de la fiche : le lot, ses ingrédients, les lots de sa fabrication et ce qui a été fait avec eux. */
export function tracabiliteHtml(t: TracabiliteLot): string {
  const destinations = (liste: DestinationDeLot[], avecProduit: boolean) =>
    tableauHtml(
      liste.map((d) => ({
        ...(avecProduit ? { [C.produit]: d.libelle } : {}),
        [C.lot]: d.numero,
        [C.etat]: etatEnMots(d),
        [C.vente]: d.dateVente ? formatDateFR(d.dateVente) : '',
        [C.facture]: d.numeroFacture ?? '',
        [C.client]: d.client ?? '',
        [C.contact]: contact(d),
      })),
      '',
    );
  return [
    cartesHtml([
      { libelle: P.cartes.lot, valeur: t.lot.numero, detail: t.libelle },
      { libelle: P.cartes.fabrication, valeur: formatDateFR(t.lot.dateFabrication) },
      ...(t.fabrication?.ddm ? [{ libelle: P.cartes.durabilite, valeur: formatDateFR(t.fabrication.ddm) }] : []),
    ]),
    sectionHtml(
      P.sections.ingredients,
      tableauHtml(
        t.ingredients.map((i) => ({
          [C.ingredient]: i.libelle,
          [C.quantite]: String(i.quantite).replace('.', ','),
          [C.lotsPris]: i.numeros.join(', '),
        })),
        P.aucunIngredient,
      ),
    ),
    sectionHtml(P.sections.lots, destinations(t.lotsDeLaFabrication, false)),
    sectionHtml(
      P.sections.derives,
      t.produitsDerives.length > 0 ? destinations(t.produitsDerives, true) : noteHtml(P.aucunDerive),
    ),
    noteHtml(P.note),
  ].join('');
}

/**
 * La fiche de traçabilité d'un lot en PDF, pour un rappel : ses ingrédients avec les lots pris, les lots de sa fabrication avec la vente, la facture et le client
 * (et ses coordonnées) de chacun, puis les plats préparés faits avec eux.
 */
export async function exporterTracabiliteLotPdf(lotId: string): Promise<void> {
  const [settings, archive, clients] = await Promise.all([getSettings(), lireArchiveStock(), listClients()]);
  const lot = (archive.lots ?? []).find((l) => l.id === lotId);
  if (!lot) return;
  const lus = await Promise.all(
    (archive.lots ?? []).filter((l) => l.venteId).map((l) => getVente(l.venteId as string)),
  );
  const ventes = new Map(lus.filter((v): v is Vente => !!v).map((v) => [v.id, v]));
  const t = tracabiliteDuLot(lot, archive, ventes, clients);

  const titre = P.titre(t.libelle, lot.numero);
  await ecrireEtPartagerPdf(
    documentHtml(titre, settings.exploitation, tracabiliteHtml(t)),
    `${NOM_FICHIER_EXPORT_TRACABILITE_LOT}.${FORMAT_EXPORT.PDF}`,
    titre,
  );
}
