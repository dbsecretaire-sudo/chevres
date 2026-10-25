import { ImprimerLotsSimple } from '@/features/production/simple/ImprimerLotsSimple';
import { ScanLotSimple } from '@/features/production/simple/ScanLotSimple';
import { EcranSimple } from '@/shared/components/EcranSimple';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.accueil.ferme.terrain.tuiles;

/** « Scanner un lot » en page simple, ouvert d'une tuile du mode avancé. */
export function EcranScanLotSimple() {
  return (
    <EcranSimple titre={T.scanLot}>
      <ScanLotSimple />
    </EcranSimple>
  );
}

/** « Imprimer les lots » en page simple, ouvert d'une tuile du mode avancé. */
export function EcranImprimerLotsSimple() {
  return (
    <EcranSimple titre={T.imprimerLots}>
      <ImprimerLotsSimple />
    </EcranSimple>
  );
}
