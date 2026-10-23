import { SelectField } from '@/shared/components/SelectField';
import { useListesPerso } from '@/features/settings/hooks/useListesPerso';
import { choixCircuits } from '@/features/settings/services/listesDeChoix';
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
  const { listes } = useListesPerso();
  return (
    <SelectField
      label={label ?? T.champ}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={required ? T.choisir : undefined}
      options={[
        ...(required ? [] : [{ value: '', label: T.aucun }]),
        // Les circuits de l'exploitation (Organisation › Listes de choix) : ceux d'office, renommés ou masqués, et les siens.
        ...choixCircuits(listes.circuitsVente, value).map((c) => ({ value: c.id, label: c.nom })),
      ]}
      aide={aide ?? T.aide}
    />
  );
}
