import { ChoixDeroulant } from '@/shared/components/ChoixDeroulant';
import type { FiltreStock } from '@/features/stock/services/stock';
import { FILTRE_STOCK_TOUT } from '@/shared/constants/stock';
import { LABEL_ACTIVITE_COMPTABLE } from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';

interface Props {
  especes: readonly string[];
  valeur: FiltreStock;
  onChoisir: (filtre: FiltreStock) => void;
}

/** La liste « Tout » / une espèce de l'inventaire ; rien quand l'exploitation n'élève qu'une espèce. */
export function ChoixEspeceStock({ especes, valeur, onChoisir }: Props) {
  if (especes.length < 2) return null;
  return (
    <ChoixDeroulant<FiltreStock>
      titre={TEXTES.commun.choix.animal}
      valeur={valeur}
      options={[
        { value: FILTRE_STOCK_TOUT, label: TEXTES.comptabilite.parActivite.toutes },
        ...especes.map((e) => ({ value: e as FiltreStock, label: LABEL_ACTIVITE_COMPTABLE[e] })),
      ]}
      onChoisir={onChoisir}
    />
  );
}
