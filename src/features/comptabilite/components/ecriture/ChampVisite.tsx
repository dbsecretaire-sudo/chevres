import { Checkbox } from '@/shared/components/Checkbox';
import { ChampMotifsVisite } from '@/features/exploitation/components/ChampMotifsVisite';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.nouvelleEcriture.visite;

export { SEPARATEUR_MOTIFS, motifsDeLaVisite, texteDesMotifs } from '@/features/exploitation/components/ChampMotifsVisite';

interface Props {
  motif: string;
  ajouter: boolean;
  onMotif: (motif: string) => void;
  onAjouter: (ajouter: boolean) => void;
}

/**
 * Une dépense vétérinaire : les motifs de la visite — plusieurs de la liste (que le crayon modifie) et, en plus, un motif libre —, et
 * la case qui l'inscrit (avec sa date) dans les visites vétérinaires.
 */
export function ChampVisite({ motif, ajouter, onMotif, onAjouter }: Props) {
  return (
    <>
      <ChampMotifsVisite motif={motif} onMotif={onMotif} />
      <Checkbox label={T.ajouter} value={ajouter} onChange={onAjouter} />
    </>
  );
}
