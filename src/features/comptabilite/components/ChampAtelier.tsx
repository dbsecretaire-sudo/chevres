import { SelectField } from '@/shared/components/SelectField';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { ateliersDeLEspece } from '@/shared/constants/ateliers';
import { especeCourante } from '@/shared/dictionnaire/animaux';
import { LABEL_ATELIER } from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';

interface Props {
  value: string;
  onChange: (atelier: string) => void;
  /** L'activité (l'espèce) de l'écriture : seuls les ateliers de cette espèce sont proposés (pas d'œufs pour des chèvres). */
  activite?: string;
}

/**
 * L'atelier qu'une charge concerne, pour la marge par atelier : facultatif. Sans atelier, elle est commune, répartie entre les ateliers.
 * L'atelier déjà choisi reste proposé, même s'il n'est plus de l'espèce.
 */
export function ChampAtelier({ value, onChange, activite }: Props) {
  const T = TEXTES.comptabilite.nouvelleEcriture.atelier;
  const espece = activite && activite !== ACTIVITE_COMMUNE ? activite : especeCourante();
  const ateliers = ateliersDeLEspece(espece);
  const proposes = value && !(ateliers as string[]).includes(value) ? [...ateliers, value] : ateliers;
  return (
    <SelectField
      label={T.label}
      value={value}
      onChange={onChange}
      options={[
        { value: '', label: T.commun },
        ...proposes.map((a) => ({ value: a, label: LABEL_ATELIER[a as keyof typeof LABEL_ATELIER] ?? a })),
      ]}
      aide={T.aide}
    />
  );
}
