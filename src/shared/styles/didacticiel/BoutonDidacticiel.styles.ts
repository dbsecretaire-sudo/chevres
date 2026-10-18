import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  /** Un bouton à sa taille, poussé à droite de la ligne où il se trouve. */
  bouton: {
    marginLeft: 'auto',
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  texte: { fontSize: 14, fontWeight: '700' },
});
