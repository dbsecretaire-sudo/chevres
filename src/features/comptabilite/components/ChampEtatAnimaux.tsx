import { Text } from 'react-native';
import { SelectField } from '@/shared/components/SelectField';
import type { ReglageEtatAnimaux } from '@/features/comptabilite/utils/ventes';
import { ROLE_VIANDE } from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';
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
  /** La ligne choisie comme détail : cabris, animal sur pied ou animal vivant. */
  role: ValeurDe<typeof ROLE_VIANDE> | undefined;
}

/**
 * L'état des cabris d'une vente de viande à la remise : sans facture, vivants ou morts (morts par défaut) ; avec facture, toujours morts.
 * C'est le seul choix : un abattoir reçoit toujours des animaux vivants, et pour des adultes l'état est celui de la ligne choisie
 * (« sur pied » : morts ; « vivants » : vivants), sans rien à demander.
 */
export function ChampEtatAnimaux({ reglage, value, onChange, clientAbattoir, role }: Props) {
  if (!reglage.choix) {
    if (!clientAbattoir && role !== ROLE_VIANDE.JEUNE) return null;
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
