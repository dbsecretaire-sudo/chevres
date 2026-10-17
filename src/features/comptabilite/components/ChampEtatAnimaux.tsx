import { Text } from 'react-native';
import { SelectField } from '@/shared/components/SelectField';
import type { ReglageEtatAnimaux } from '@/features/comptabilite/utils/ventes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.comptabilite.ficheVente;

interface Props {
  reglage: ReglageEtatAnimaux;
  /** L'état saisi : « vivants », « morts », ou vide (morts par défaut). */
  value: string | undefined;
  onChange: (etat: string) => void;
  /** Le client est un abattoir : les animaux lui partent vivants, il n'y a rien à choisir. */
  clientAbattoir: boolean;
}

/**
 * L'état des animaux d'une vente de viande à la remise : vivants ou morts (morts par défaut). Rien à choisir pour un abattoir (toujours
 * vivants) ni pour des cabris vendus avec facture (toujours morts) : une note le dit.
 */
export function ChampEtatAnimaux({ reglage, value, onChange, clientAbattoir }: Props) {
  if (!reglage.choix) {
    return <Text style={commonStyles.note}>{clientAbattoir ? T.versAbattoir : T.cabrisAvecFacture}</Text>;
  }
  return (
    <SelectField<string>
      label={T.etatAnimaux}
      value={value === 'vivants' ? 'vivants' : 'morts'}
      onChange={onChange}
      options={[
        { value: 'vivants', label: T.etatVivants },
        { value: 'morts', label: T.etatMorts },
      ]}
      aide={T.etatAnimauxAide}
    />
  );
}
