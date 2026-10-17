import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { commonStyles } from '@/shared/styles/commonStyles';
import { formatDateFR } from '@/shared/utils/dates';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.nouvelleEcriture;

interface Props {
  /** La date de la vente : la date d'abattoir d'office. */
  dateVente: string;
  /** La date d'abattoir choisie (vide : celle de la vente). */
  value?: string;
  onChange: (date: string) => void;
  /** Vrai : la date est celle du lot d'abattoir choisi, elle ne se modifie pas. */
  verrouille?: boolean;
}

/**
 * La date d'abattoir des animaux d'une vente de viande : un animal bouclé vendu a forcément été abattu auparavant, sa fiche du
 * cheptel passe donc en « abattoir » à cette date (celle de la vente tant qu'on n'en choisit pas une autre). Pour les animaux d'un lot
 * d'abattoir, c'est le jour d'abattage du lot : elle se lit seulement.
 */
export function ChampDateAbattoir({ dateVente, value, onChange, verrouille }: Props) {
  if (verrouille) {
    return (
      <FormField
        label={T.dateAbattoir}
        value={formatDateFR(value || dateVente)}
        editable={false}
        style={commonStyles.verrouille}
        aide={T.dateAbattoirDuLot}
      />
    );
  }
  return <DateField label={T.dateAbattoir} value={value || dateVente} onChange={onChange} />;
}
