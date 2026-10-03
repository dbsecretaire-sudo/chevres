import { Fab } from '@/shared/components/Fab';
import { colors } from '@/shared/theme/colors';
import { statutLabel } from '@/features/cheptel/utils/chevreLabel';
import type { Chevre, StatutChevre } from '@/features/cheptel/types';
import { SEXE, STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { TEXTES } from '@/shared/textes';

interface Props {
  chevre: Chevre;
  onChoisir: (statut: StatutChevre) => void;
}

/** Bouton flottant pour déclarer la sortie du troupeau (morte, abattoir, vendue, auto-consommée, mort-née). */
export function ChevreSortieFab({ chevre, onChoisir }: Props) {
  return (
    <Fab
      color={colors.danger}
      icon="remove"
      options={[
        {
          label: statutLabel(STATUT_CHEVRE.MORTE, chevre.sexe),
          icon: 'skull',
          onPress: () => onChoisir(STATUT_CHEVRE.MORTE),
        },
        {
          label:
            chevre.sexe === SEXE.MALE
              ? TEXTES.cheptel.ficheChevre.envoyeALAbattoir
              : TEXTES.cheptel.ficheChevre.envoyeeALAbattoir,
          icon: 'cut',
          onPress: () => onChoisir(STATUT_CHEVRE.ABATTOIR),
        },
        {
          label: statutLabel(STATUT_CHEVRE.VENDUE, chevre.sexe),
          icon: 'cash',
          onPress: () => onChoisir(STATUT_CHEVRE.VENDUE),
        },
        {
          label: statutLabel(STATUT_CHEVRE.AUTOCONSOMMEE, chevre.sexe),
          icon: 'restaurant',
          onPress: () => onChoisir(STATUT_CHEVRE.AUTOCONSOMMEE),
        },
        {
          label: statutLabel(STATUT_CHEVRE.MORT_NE, chevre.sexe),
          icon: 'sad',
          onPress: () => onChoisir(STATUT_CHEVRE.MORT_NE),
        },
      ]}
    />
  );
}
