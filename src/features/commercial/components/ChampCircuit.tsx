import { SelectField } from '@/shared/components/SelectField';
import { CIRCUIT_VENTE } from '@/shared/constants/commercial';
import { LABEL_CIRCUIT_VENTE } from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.commercial.circuit;

interface Props {
  /** Le circuit choisi (vide : non précisé). */
  value: string;
  onChange: (circuit: string) => void;
  /** Le circuit est obligatoire (une vente de production) : pas de choix « Non précisé », il se choisit avant de continuer. */
  required?: boolean;
  /** Un autre nom pour le champ (« Circuit de vente privilégié » dans la fiche d'un contact). */
  label?: string;
  /** Une autre aide sous le champ. */
  aide?: string;
}

/** Le circuit de vente d'une vente ou d'une commande : un choix facultatif parmi les circuits de l'exploitation. */
export function ChampCircuit({ value, onChange, required = false, label, aide }: Props) {
  return (
    <SelectField
      label={label ?? T.champ}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={required ? T.choisir : undefined}
      options={[
        ...(required ? [] : [{ value: '', label: T.aucun }]),
        ...Object.values(CIRCUIT_VENTE).map((c) => ({ value: c as string, label: LABEL_CIRCUIT_VENTE[c] })),
      ]}
      aide={aide ?? T.aide}
    />
  );
}
