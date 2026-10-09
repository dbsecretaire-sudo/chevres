import { SelectField } from '@/shared/components/SelectField';
import { NATURE_URSSAF } from '@/shared/constants/entreprise';
import { LABEL_NATURE_URSSAF } from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';

/** La valeur du choix « selon la catégorie » (la nature se déduit alors de la catégorie de la recette). */
const AUTOMATIQUE = '';

const OPTIONS = [
  { value: AUTOMATIQUE, label: TEXTES.comptabilite.nouvelleEcriture.natureUrssafAuto },
  ...Object.values(NATURE_URSSAF).map((nature) => ({
    value: nature as string,
    label: LABEL_NATURE_URSSAF[nature],
  })),
];

interface Props {
  /** La nature choisie, ou vide pour « selon la catégorie ». */
  value: string;
  onChange: (valeur: string) => void;
}

/**
 * La nature d'une recette pour la déclaration URSSAF d'une entreprise (vente de marchandises, prestations commerciales ou
 * artisanales, prestations libérales) : déduite de la catégorie tant qu'on n'en choisit pas une.
 */
export function ChampNatureUrssaf({ value, onChange }: Props) {
  return (
    <SelectField<string>
      label={TEXTES.comptabilite.nouvelleEcriture.natureUrssaf}
      value={value}
      options={OPTIONS}
      onChange={onChange}
    />
  );
}
