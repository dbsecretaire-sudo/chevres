import { SelectField } from '@/shared/components/SelectField';
import { ATELIER } from '@/shared/constants/ateliers';
import { LABEL_ATELIER } from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';

/** Les ateliers qu'une charge peut concerner : tous sauf « autres recettes », qui n'est pas un atelier de production. */
const ATELIERS_DE_CHARGE = Object.values(ATELIER).filter((a) => a !== ATELIER.AUTRES);

/** L'atelier qu'une facture reçue concerne (vide : une charge commune, répartie entre les ateliers) : facultatif. */
export function ChampAtelier({ value, onChange }: { value: string; onChange: (atelier: string) => void }) {
  const T = TEXTES.comptabilite.nouvelleEcriture.atelier;
  return (
    <SelectField
      label={T.label}
      value={value}
      onChange={onChange}
      options={[
        { value: '', label: T.commun },
        ...ATELIERS_DE_CHARGE.map((a) => ({ value: a, label: LABEL_ATELIER[a] })),
      ]}
      aide={T.aide}
    />
  );
}
