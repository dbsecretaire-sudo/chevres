import { SelectField } from '@/shared/components/SelectField';
import { VOLET_COOPERATIVE } from '@/shared/constants/comptabilite';
import { LABEL_VOLET_COOPERATIVE } from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';

interface Props {
  value: string;
  /** Les volets proposés (ceux cochés sur la fiche du contact) ; sans eux, tous. */
  volets?: readonly string[];
  onChange: (volet: string) => void;
}

/** Le volet d'une association ou d'une coopérative agricole qu'une écriture concerne (achat groupé, vente groupée, mutualisation, experts, transports). */
export function ChampVoletCooperative({ value, volets, onChange }: Props) {
  const T = TEXTES.production.lieux.groupement.champVolet;
  return (
    <SelectField
      label={T.label}
      value={value}
      onChange={onChange}
      options={[
        { value: '', label: T.aucun },
        ...Object.values(VOLET_COOPERATIVE)
          .filter((v) => !volets || volets.includes(v) || v === value)
          .map((v) => ({ value: v, label: LABEL_VOLET_COOPERATIVE[v] })),
      ]}
      aide={T.aide}
    />
  );
}
