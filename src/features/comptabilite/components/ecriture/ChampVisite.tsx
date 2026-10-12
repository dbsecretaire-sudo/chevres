import { ChampListeModifiable } from '@/shared/components/ChampListeModifiable';
import { Checkbox } from '@/shared/components/Checkbox';
import { useListePersonnalisee } from '@/features/settings/hooks/useListePersonnalisee';
import { CLE_LISTE_PERSONNALISEE } from '@/shared/constants/controles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.nouvelleEcriture.visite;
const V = TEXTES.exploitation.nouvelleVisite;

interface Props {
  motif: string;
  ajouter: boolean;
  onMotif: (motif: string) => void;
  onAjouter: (ajouter: boolean) => void;
}

/**
 * Une dépense vétérinaire : le motif de la visite (la liste des motifs de la fiche d'une visite, que le crayon modifie), et la case qui l'inscrit (avec sa date) dans les visites vétérinaires. */
export function ChampVisite({ motif, ajouter, onMotif, onAjouter }: Props) {
  const [motifs, enregistrerMotifs] = useListePersonnalisee(
    CLE_LISTE_PERSONNALISEE.MOTIFS_VISITE,
    V.motifsParDefaut,
  );
  return (
    <>
      <ChampListeModifiable
        label={T.motif}
        value={motif}
        onChange={onMotif}
        placeholder={V.choisirMotif}
        valeurs={motifs}
        valeursParDefaut={V.motifsParDefaut}
        onChangerValeurs={enregistrerMotifs}
        titreListe={V.titreMotifs}
      />
      <Checkbox label={T.ajouter} value={ajouter} onChange={onAjouter} />
    </>
  );
}
