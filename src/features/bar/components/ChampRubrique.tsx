import { SelectField } from '@/shared/components/SelectField';
import { RUBRIQUE_MARCHANDISE } from '@/shared/constants/comptabilite';
import { TEXTES } from '@/shared/textes';
import { LABEL_RUBRIQUE_MARCHANDISE } from '@/shared/textes/libelles';

interface Props {
  /** La rubrique choisie, ou « » pour toutes les activités (le cas d'office). */
  value: string;
  onChange: (rubrique: string) => void;
}

const T = TEXTES.bar.stock;

/** Le choix de l'activité d'un article du stock d'un gîte : toutes (d'office), le bar, le restaurant ou une activité annexe. */
export function ChampRubrique({ value, onChange }: Props) {
  return (
    <SelectField<string>
      label={T.activite}
      value={value}
      onChange={onChange}
      options={[
        { value: '', label: T.toutesActivites },
        ...Object.values(RUBRIQUE_MARCHANDISE).map((r) => ({
          value: r as string,
          label: LABEL_RUBRIQUE_MARCHANDISE[r],
        })),
      ]}
    />
  );
}
