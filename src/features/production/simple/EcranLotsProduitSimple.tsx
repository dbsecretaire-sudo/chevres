import { useLocalSearchParams } from 'expo-router';
import { LotsProduitSimple, type ProduitDesLots } from '@/features/production/simple/LotsProduitSimple';
import { EcranSimple } from '@/shared/components/EcranSimple';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.lots;

const TITRES: Record<string, string> = {
  [PRODUIT_A_LOTS.FROMAGE]: T.fromages,
  [PRODUIT_A_LOTS.CHARCUTERIE]: T.charcuterie,
  [PRODUIT_A_LOTS.PLAT]: T.plats,
  [PRODUIT_A_LOTS.SAVON]: T.savons,
};

/** Les lots d'un produit (fromage, charcuterie, plat, savon) en lecture seule, selon l'adresse : le mode normal. */
export default function EcranLotsProduitSimple() {
  const { produit } = useLocalSearchParams<{ produit?: string }>();
  const choisi = (produit && produit in TITRES ? produit : PRODUIT_A_LOTS.FROMAGE) as ProduitDesLots;
  return (
    <EcranSimple titre={TITRES[choisi]}>
      <LotsProduitSimple produit={choisi} titre={TITRES[choisi]} />
    </EcranSimple>
  );
}
