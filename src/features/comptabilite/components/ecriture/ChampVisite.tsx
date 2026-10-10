import { FormField } from '@/shared/components/FormField';
import { Checkbox } from '@/shared/components/Checkbox';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.nouvelleEcriture.visite;

interface Props {
  motif: string;
  ajouter: boolean;
  onMotif: (motif: string) => void;
  onAjouter: (ajouter: boolean) => void;
}

/** Une dépense vétérinaire : le motif de la visite, et la case qui l'inscrit (avec sa date) dans les visites vétérinaires. */
export function ChampVisite({ motif, ajouter, onMotif, onAjouter }: Props) {
  return (
    <>
      <FormField label={T.motif} value={motif} onChangeText={onMotif} placeholder={T.exemple} />
      <Checkbox label={T.ajouter} value={ajouter} onChange={onAjouter} />
    </>
  );
}
