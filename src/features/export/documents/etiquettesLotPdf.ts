import { documentHtml, echapper, ecrireEtPartagerPdf, noteHtml } from '@/features/export/services/htmlPdf';
import { getSettings, type InfosExploitation } from '@/features/settings/settings';
import { lireArchiveStock, noterEtiquettesImprimees } from '@/features/stock/repository';
import { etiquetteDuLot, type EtiquetteDeLot } from '@/features/stock/services/etiquetteLot';
import { FORMAT_EXPORT, NOM_FICHIER_EXPORT_ETIQUETTES_LOTS } from '@/shared/constants/export';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';

const P = TEXTES.export.pdf.etiquettesLot;

const STYLE = `<style>
  .etiquettes { display: flex; flex-wrap: wrap; gap: 8px; }
  .etiquette { width: 48%; border: 1px dashed ${colors.textMuted}; border-radius: 6px; padding: 8px 10px; page-break-inside: avoid; font-size: 9.5px; line-height: 1.4; }
  .etiquette .produit { font-size: 14px; font-weight: 800; color: ${colors.primaryDark}; }
  .etiquette .lot { font-size: 12px; font-weight: 800; margin: 2px 0 4px; }
  .etiquette .ligne { margin: 2px 0; }
  .etiquette .responsable { margin-top: 5px; padding-top: 4px; border-top: 1px solid ${colors.border}; color: ${colors.textMuted}; }
</style>`;

function etiquetteHtml(e: EtiquetteDeLot, infos: InfosExploitation | undefined, contenuNet: string | undefined): string {
  const responsable = [infos?.nomExploitant, infos?.adresseExploitant].filter(Boolean).map(echapper).join(', ');
  const lignes = [
    `<div class="ligne">${echapper(P.fabriqueLe(formatDateFR(e.dateFabrication)))}</div>`,
    e.finCure ? `<div class="ligne">${echapper(P.finCure(formatDateFR(e.finCure)))}</div>` : '',
    e.ddm
      ? `<div class="ligne"><strong>${echapper(e.savon ? P.avantSavon : P.avantPlat)} ${echapper(formatDateFR(e.ddm))}</strong></div>`
      : '',
    contenuNet ? `<div class="ligne">${echapper(P.contenuNet(contenuNet))}</div>` : '',
    e.composition
      ? `<div class="ligne"><strong>${echapper(e.savon ? P.inci : P.ingredients)} :</strong> ${echapper(e.composition)}</div>`
      : `<div class="ligne">${echapper(P.sansComposition)}</div>`,
  ];
  const mention = responsable
    ? `<strong>${echapper(P.responsable)} :</strong> ${responsable}`
    : echapper(P.responsableAbsent);
  return `<div class="etiquette">
    <div class="produit">${echapper(e.produit)}</div>
    <div class="lot">${echapper(P.lot)} ${echapper(e.numero)}</div>
    ${lignes.join('')}
    <div class="responsable">${mention}</div>
  </div>`;
}

/** Le corps du document : une étiquette par lot, puis la note sur ce qu'il faut ajouter à la main. */
export function etiquettesHtml(etiquettes: EtiquetteDeLot[], infos: InfosExploitation | undefined, contenuNet?: string): string {
  const net = contenuNet?.trim() || undefined;
  return [
    STYLE,
    `<div class="etiquettes">${etiquettes.map((e) => etiquetteHtml(e, infos, net)).join('')}</div>`,
    noteHtml(etiquettes[0]?.savon ? P.noteSavon : P.notePlat),
  ].join('');
}

/**
 * Les étiquettes d'un lot de plats préparés ou de savons en PDF : une par lot de la fabrication (numéro de lot, fabrication, durabilité, ingrédients ou liste INCI,
 * contenu net si on le donne, nom et adresse du responsable), à découper. Tout vient des données déjà saisies. Avec `nombre`, ce nombre d'étiquettes du lot choisi.
 */
export async function exporterEtiquettesLotPdf(lotId: string, contenuNet?: string, nombre?: number): Promise<void> {
  const [settings, archive] = await Promise.all([getSettings(), lireArchiveStock()]);
  const lot = (archive.lots ?? []).find((l) => l.id === lotId);
  if (!lot) return;
  const lots = lot.mouvementId ? (archive.lots ?? []).filter((l) => l.mouvementId === lot.mouvementId) : [lot];
  // Un nombre souhaité : autant d'étiquettes de ce lot ; sinon, une par lot de la fabrication.
  const etiquettes = nombre
    ? Array.from({ length: nombre }, () => etiquetteDuLot(lot, archive))
    : lots.map((l) => etiquetteDuLot(l, archive));
  const titre = P.titre(etiquettes[0].produit);
  await ecrireEtPartagerPdf(
    documentHtml(titre, settings.exploitation, etiquettesHtml(etiquettes, settings.exploitation, contenuNet), undefined, ''),
    `${NOM_FICHIER_EXPORT_ETIQUETTES_LOTS}.${FORMAT_EXPORT.PDF}`,
    titre,
  );
  // De quoi les réimprimer plus tard.
  await noterEtiquettesImprimees({ lotId: lot.id, nombre: etiquettes.length });
}
