import { Image, Text, View } from 'react-native';
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
import { fondDeLAnimal } from '@/features/accueil/services/fondDeLAnimal';
import { categorieAccueil } from '@/features/accueil/services/statsAccueil';
import { styles } from '@/shared/styles/cheptel/FicheChevre.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { LABEL_SEXE } from '@/shared/textes/libelles';

interface Props {
  chevre: Chevre;
  /** Un cabri à tiptag : destiné à l'abattoir (règle d'or). */
  destineAAbattoir?: boolean;
}

const TETE_DE_CHEVRE = require('../../../../../assets/images/tete-chevre.png');

/** En-tête de la fiche : nom, sexe/naissance, badges (statut, renouvellement), et à gauche de son numéro la tête de l'animal. Le menu est dans la barre du haut. */
export function ChevreEntete({ chevre, destineAAbattoir }: Props) {
  return (
    <View style={commonStyles.header}>
      <View style={styles.titreEtTete}>
        {/* La tête de l'animal, à gauche de son numéro, sur le fond de la liste : rose pour une femelle, bleu pour un mâle, vert pour un petit. */}
        <View style={[styles.tete, { backgroundColor: fondDeLAnimal(categorieAccueil(chevre)) }]}>
          <Image source={TETE_DE_CHEVRE} style={styles.teteImage} resizeMode="contain" accessibilityElementsHidden />
        </View>
        <View style={commonStyles.flex1}>
          <Text style={commonStyles.title}>{libelleChevre(chevre)}</Text>
          <Text style={commonStyles.subtitle}>
            {LABEL_SEXE[chevre.sexe]} · {accordNe(chevre.sexe)} {TEXTES.cheptel.ficheChevre.le}{' '}
            {formatDateFR(chevre.dateNaissance)}
          </Text>
        </View>
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
