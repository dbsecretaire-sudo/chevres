import type { EcritureACirculation } from '@/features/comptabilite/services/documentsCirculation';
import { getFacture } from '@/features/comptabilite/repository/factures';
import { idsDesAnimauxAchetes, idsDesAnimauxEnvoyes } from '@/features/comptabilite/utils/ventes';
import { listTousLesAnimauxDeLEspece } from '@/features/cheptel/repository/chevres';
import { animauxDuLot } from '@/features/exploitation/services/lots';
import {
  exporterDocumentCirculationAbattoirPdf,
  exporterDocumentCirculationAchatPdf,
  exporterDocumentCirculationPdf,
} from '@/features/export/documentCirculationPdf';
import { getSettings } from '@/features/settings/settings';

/**
 * Génère le document de circulation (modèle pré-rempli) d'une écriture : d'après la vente ; d'après les animaux achetés (départ chez le
 * vendeur) ; ou, pour la dépense d'un abattoir, d'après les animaux du lot lié (l'abattoir à l'arrivée). Le modèle reste disponible même
 * quand on a déposé son propre document.
 */
export async function genererLeModeleDeCirculation(ecriture: Pick<EcritureACirculation, 'type' | 'id'>): Promise<void> {
  if (ecriture.type === 'vente') {
    await exporterDocumentCirculationPdf(ecriture.id);
    return;
  }
  // Un lot de départ : les animaux partent à la date du lot (le jour du départ), avant toute écriture.
  if (ecriture.type === 'lot') {
    const lot = (await getSettings()).exploitation?.lots?.find((l) => l.id === ecriture.id);
    if (!lot) return;
    const animauxDuDepart = animauxDuLot(lot, await listTousLesAnimauxDeLEspece());
    await exporterDocumentCirculationAbattoirPdf(
      (lot.abattoir ?? lot.dateDepart) as string,
      animauxDuDepart.map((a) => a.id),
      undefined,
      true,
      (lot.inconsommables ?? []).filter((i) => i.motif === 'transport').length,
    );
    return;
  }
  const facture = await getFacture(ecriture.id);
  if (!facture) return;
  if (idsDesAnimauxAchetes(facture).length > 0) {
    await exporterDocumentCirculationAchatPdf(facture.id);
    return;
  }
  const lots = (await getSettings()).exploitation?.lots;
  // La dépense d'un lot de départ : les animaux sont partis à la date du lot, pas à celle de la facture (émise quelques jours plus tard).
  const deDepart = facture.lotId ? lots?.find((l) => l.id === facture.lotId) : undefined;
  if (deDepart) {
    await exporterDocumentCirculationAbattoirPdf(
      (deDepart.abattoir ?? deDepart.dateDepart) as string,
      animauxDuLot(deDepart, await listTousLesAnimauxDeLEspece()).map((a) => a.id),
      facture.tiers,
      true,
      (deDepart.inconsommables ?? []).filter((i) => i.motif === 'transport').length,
    );
    return;
  }
  // Des animaux envoyés avec la dépense : ils partent à la date de la dépense, vers ce contact.
  if (idsDesAnimauxEnvoyes(facture).length > 0) {
    await exporterDocumentCirculationAbattoirPdf(facture.date, idsDesAnimauxEnvoyes(facture), facture.tiers, true);
    return;
  }
  const lot = lots?.find((l) => l.factureId === facture.id && l.abattoir);
  const animaux = lot ? animauxDuLot(lot, await listTousLesAnimauxDeLEspece()) : [];
  await exporterDocumentCirculationAbattoirPdf(
    lot?.abattoir ?? facture.date,
    animaux.map((a) => a.id),
    facture.tiers,
    true,
    (lot?.inconsommables ?? []).filter((i) => i.motif === 'transport').length,
  );
}
