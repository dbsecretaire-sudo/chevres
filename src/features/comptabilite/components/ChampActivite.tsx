import { SelectField } from '@/shared/components/SelectField';
import type { ActiviteComptable } from '@/features/comptabilite/types';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { especesActives, plusieursEspeces } from '@/shared/dictionnaire/animaux';
import { LABEL_ACTIVITE_COMPTABLE } from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';

interface Props {
  value: ActiviteComptable;
  onChange: (activite: ActiviteComptable) => void;
  /** Propose aussi « Commun » (dépenses qui ne concernent aucune espèce en particulier). */
  avecCommun?: boolean;
}

/** Choix de l'activité (espèce) d'une écriture ; n'apparaît que pour un établissement qui élève plusieurs espèces. */
export function ChampActivite({ value, onChange, avecCommun = true }: Props) {
  if (!plusieursEspeces()) return null;

  const activites: ActiviteComptable[] = [...especesActives()];
  if (avecCommun) activites.push(ACTIVITE_COMMUNE);
  return (
    <SelectField
      label={TEXTES.comptabilite.activite.activite}
      required
      value={value}
      onChange={onChange}
      options={activites.map((a) => ({ value: a, label: LABEL_ACTIVITE_COMPTABLE[a] }))}
    />
  );
}
