import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  /** Des champs côte à côte : ils passent à la ligne quand la place manque (téléphone), sans se serrer. */
  ligne: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  champ: { flexGrow: 1, flexBasis: 140, minWidth: 140 },
});
