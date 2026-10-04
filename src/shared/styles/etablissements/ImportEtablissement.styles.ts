import { StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';

export const styles = StyleSheet.create({
  /** Icône d'import (ou de retour à la saisie) dans l'en-tête de l'écran : pastille blanche, icône bleue. */
  boutonEntete: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blanc,
    marginRight: 8,
  },
  /** Les éléments d'un établissement déroulé, décalés sous son en-tête. */
  liste: { gap: 10, paddingLeft: 14 },
});
