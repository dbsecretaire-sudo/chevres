import { useCallback, type ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

/** Les éléments de l'interface que la visite guidée peut mettre en surbrillance : leur identifiant et leur vue. */
const ancres = new Map<string, View>();

/** La vue d'un élément repéré par la visite guidée (rien s'il n'est pas à l'écran). */
export const ancreDe = (id: string): View | undefined => ancres.get(id);

/** Repère un élément de l'interface (un bouton) pour la visite guidée : à poser en `ref` de sa vue. */
export function useAncre(id: string): (vue: View | null) => void {
  return useCallback(
    (vue: View | null) => {
      if (vue) ancres.set(id, vue);
      else ancres.delete(id);
    },
    [id],
  );
}

/** Une vue qui repère ce qu'elle contient pour la visite guidée ; sans visite, elle ne change rien à la mise en page. */
export function AncreVisite({ id, children, style }: { id: string; children: ReactNode; style?: ViewStyle }) {
  const ref = useAncre(id);
  return (
    <View ref={ref} collapsable={false} style={style}>
      {children}
    </View>
  );
}
