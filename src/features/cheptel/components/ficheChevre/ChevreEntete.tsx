import { Text, View } from 'react-native';
import { Badge } from '@/shared/components/Badge';
import { statutColors } from '@/shared/theme/colors';
import { formatDateFR } from '@/shared/utils/dates';
import {
  accordNe,
  libelleChevre,
  statutLabel,
} from '@/features/cheptel/utils/chevreLabel';
import type { Chevre } from '@/features/cheptel/types';
import { styles } from '@/shared/styles/cheptel/FicheChevre.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { LABEL_SEXE } from '@/shared/textes/libelles';

interface Props {
  chevre: Chevre;
}

/** En-tête de la fiche : nom, sexe/naissance, badges (statut, renouvellement). Le menu est dans la barre du haut. */
export function ChevreEntete({ chevre }: Props) {
  return (
    <View style={commonStyles.header}>
      <View>
        <Text style={commonStyles.title}>{libelleChevre(chevre)}</Text>
        <Text style={commonStyles.subtitle}>
          {LABEL_SEXE[chevre.sexe]} · {accordNe(chevre.sexe)} {TEXTES.cheptel.ficheChevre.le}{' '}
          {formatDateFR(chevre.dateNaissance)}
        </Text>
      </View>
      <View style={commonStyles.headerDroite}>
        <View style={styles.badges}>
          <Badge label={statutLabel(chevre.statut, chevre.sexe)} color={statutColors[chevre.statut]} />
        </View>
      </View>
    </View>
  );
}
