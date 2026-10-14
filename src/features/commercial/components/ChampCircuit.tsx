import { SelectField } from '@/shared/components/SelectField';
import { CIRCUIT_VENTE } from '@/shared/constants/commercial';
import { LABEL_CIRCUIT_VENTE } from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.commercial.circuit;

interface Props {
  /** Le circuit choisi (vide : non précisé). */
  value: string;
  onChange: (circuit: string) => void;
}

/** Le circuit de vente d'une vente ou d'une commande : un choix facultatif parmi les circuits de l'exploitation. */
export function ChampCircuit({ value, onChange }: Props) {
  return (
    <SelectField
      label={T.champ}
      value={value}
      onChange={onChange}
      options={[
        { value: '', label: T.aucun },
        ...Object.values(CIRCUIT_VENTE).map((c) => ({ value: c as string, label: LABEL_CIRCUIT_VENTE[c] })),
      ]}
      aide={T.aide}
    />
  );
}
