import { Checkbox } from '@/shared/components/Checkbox';
import { DateField } from '@/shared/components/DateField';
import { TEXTES } from '@/shared/textes';

interface Props {
  /** Le libellé de la case : « Pas encore encaissée » pour une recette, « Pas encore payée » pour une dépense. */
  libelle: string;
  enAttente: boolean;
  onEnAttente: (enAttente: boolean) => void;
  echeance: string;
  onEcheance: (echeance: string) => void;
}

/** Le paiement d'une écriture : payée à sa date (d'office), ou pas encore, avec la date prévue : la trésorerie la compte à cette date. */
export function ChampPaiement({ libelle, enAttente, onEnAttente, echeance, onEcheance }: Props) {
  const T = TEXTES.comptabilite.tresorerie.paiement;
  return (
    <>
      <Checkbox label={libelle} value={enAttente} onChange={onEnAttente} />
      {enAttente ? <DateField label={T.echeance} value={echeance} onChange={onEcheance} /> : null}
    </>
  );
}
