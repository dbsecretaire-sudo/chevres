import { Text, View } from 'react-native';
import { Badge } from '@/shared/components/Badge';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
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
  /** Un cabri à tiptag : destiné à l'abattoir (règle d'or). */
  destineAAbattoir?: boolean;
}

/** En-tête de la fiche : nom, sexe/naissance, badges (statut, renouvellement). Le menu est dans la barre du haut. */
export function ChevreEntete({ chevre, destineAAbattoir }: Props) {
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
          {destineAAbattoir ? (
            <Badge label={TEXTES.cheptel.ficheChevre.destineAAbattoir} color={statutColors[STATUT_CHEVRE.ABATTOIR]} />
          ) : null}
        </View>
      </View>
    </View>
  );
}
