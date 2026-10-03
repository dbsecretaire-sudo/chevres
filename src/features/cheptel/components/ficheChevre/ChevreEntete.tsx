import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/shared/components/Badge';
import { colors, statutColors } from '@/shared/theme/colors';
import { formatDateFR } from '@/shared/utils/dates';
import {
  accordNe,
  afficherBadgeRenouvellement,
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
  onMenu: () => void;
}

/** En-tête de la fiche : nom, sexe/naissance, badges (statut, renouvellement) et bouton de menu. */
export function ChevreEntete({ chevre, onMenu }: Props) {
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
          {chevre.renouvellement && afficherBadgeRenouvellement(chevre.dateNaissance) && (
            <Badge
              label={
                chevre.renouvellementAnnee
                  ? TEXTES.cheptel.ficheChevre.renouvellementRenouvellementannee(chevre.renouvellementAnnee)
                  : TEXTES.commun.general.renouvellement
              }
              color={colors.primary}
            />
          )}
        </View>
        <Pressable style={commonStyles.boutonMenu} onPress={onMenu}>
          <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}
