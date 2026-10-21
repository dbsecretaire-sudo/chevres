import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';
import { LARGEUR_MAX } from '@/shared/theme/miseEnPage';

/** La largeur de la colonne du menu (la version Windows). */
export const LARGEUR_MENU = 380;

/** La largeur maximale d'un écran dans la zone de droite d'une grande fenêtre Windows : au-delà, il reste centré. */
const LARGEUR_MAX_ECRAN_BUREAU = 760;

export const styles = StyleSheet.create({
  deuxColonnes: { flex: 1, flexDirection: 'row' },
  gauche: {
    width: LARGEUR_MENU,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.background,
  },
  droite: { flex: 1, alignItems: 'center', backgroundColor: colors.background },
  contenuDroite: { flex: 1, width: '100%', maxWidth: LARGEUR_MAX_ECRAN_BUREAU },
  // Hors Windows : une colonne de la largeur d'un téléphone, centrée, sur un fond qui remplit la fenêtre.
  fondUnique: { flex: 1, alignItems: 'center', backgroundColor: colors.background },
  colonneUnique: { flex: 1, width: '100%', maxWidth: LARGEUR_MAX },
});
