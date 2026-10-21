import { SelectField } from '@/shared/components/SelectField';
import { OBJET_ASSURANCE } from '@/shared/constants/comptabilite';
import { LABEL_OBJET_ASSURANCE } from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';

interface Props {
  value: string;
  onChange: (objet: string) => void;
}

/** Ce qu'une facture d'assurance couvre : les bâtiments, les animaux ou un véhicule (dont la plaque se choisit alors). */
export function ChampObjetAssurance({ value, onChange }: Props) {
  const T = TEXTES.flotte.objetAssurance;
  return (
    <SelectField
      label={T.label}
      value={value}
      onChange={onChange}
      options={[
        { value: '', label: T.aucun },
        ...Object.values(OBJET_ASSURANCE).map((o) => ({ value: o, label: LABEL_OBJET_ASSURANCE[o] })),
      ]}
      aide={T.aide}
    />
  );
}
