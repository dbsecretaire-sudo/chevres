import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  /** Une colonne de montants alignés à droite (le tableau des déclarations URSSAF). */
  /** Le détail d'un mois (ses natures de recette), décalé vers la droite. */
  detailMois: { paddingLeft: 14 },
  colonne: { width: 96, textAlign: 'right' },
});
