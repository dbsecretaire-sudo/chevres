import { DateField } from '@/shared/components/DateField';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.nouvelleEcriture;

interface Props {
  /** La date de la vente : la date d'abattoir d'office. */
  dateVente: string;
  /** La date d'abattoir choisie (vide : celle de la vente). */
  value?: string;
  onChange: (date: string) => void;
}

/**
 * La date d'abattoir des animaux d'une vente de viande : un animal bouclé vendu a forcément été abattu auparavant, sa fiche du
 * cheptel passe donc en « abattoir » à cette date (celle de la vente tant qu'on n'en choisit pas une autre).
 */
export function ChampDateAbattoir({ dateVente, value, onChange }: Props) {
  return <DateField label={T.dateAbattoir} value={value || dateVente} onChange={onChange} />;
}
