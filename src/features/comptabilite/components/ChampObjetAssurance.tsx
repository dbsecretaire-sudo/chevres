import { SelectField } from '@/shared/components/SelectField';
import { useListesPerso } from '@/features/settings/hooks/useListesPerso';
import { choixObjetsAssurance } from '@/features/settings/services/listesDeChoix';
import { TEXTES } from '@/shared/textes';

interface Props {
  value: string;
  onChange: (objet: string) => void;
}

/** Ce qu'une facture d'assurance couvre : les bâtiments, les animaux ou un véhicule (dont la plaque se choisit alors). */
export function ChampObjetAssurance({ value, onChange }: Props) {
  const T = TEXTES.flotte.objetAssurance;
  const { listes } = useListesPerso();
  return (
    <SelectField
      label={T.label}
      value={value}
      onChange={onChange}
      options={[
        { value: '', label: T.aucun },
        // Les choix d'office (renommés ou masqués) et ceux de l'utilisateur ; le choix déjà fait reste proposé.
        ...choixObjetsAssurance(listes.objetsAssurance, value).map((o) => ({ value: o.id, label: o.nom })),
      ]}
      aide={T.aide}
    />
  );
}
