import { ChoixDeroulant } from '@/shared/components/ChoixDeroulant';
import { TEXTES } from '@/shared/textes';

interface Props {
  annees: number[];
  value: number;
  onChange: (annee: number) => void;
}

/** L'année active : une puce, et la liste des années (de la plus récente à la plus ancienne) au clic. */
export function YearPicker({ annees, value, onChange }: Props) {
  const options = [...new Set([...annees, value])]
    .sort((a, b) => b - a)
    .map((annee) => ({ value: String(annee), label: String(annee) }));
  return (
    <ChoixDeroulant
      titre={TEXTES.commun.choix.annee}
      valeur={String(value)}
      options={options}
      onChoisir={(annee) => onChange(Number(annee))}
    />
  );
}
