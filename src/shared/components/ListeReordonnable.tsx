import { useEffect, useState, type ReactNode } from 'react';
import { Animated } from 'react-native';





/** La ligne tenue au doigt frémit légèrement : on voit qu'elle est prise. */
export function Frisson({ actif, children }: { actif: boolean; children: ReactNode }) {
  const [valeur] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!actif) {
      valeur.setValue(0);
      return;
    }
    const boucle = Animated.loop(
      Animated.sequence([
        Animated.timing(valeur, { toValue: 1, duration: 90, useNativeDriver: false }),
        Animated.timing(valeur, { toValue: -1, duration: 180, useNativeDriver: false }),
        Animated.timing(valeur, { toValue: 0, duration: 90, useNativeDriver: false }),
      ]),
    );
    boucle.start();
    return () => boucle.stop();
  }, [actif, valeur]);
  const rotation = valeur.interpolate({ inputRange: [-1, 1], outputRange: ['-0.5deg', '0.5deg'] });
  return <Animated.View style={{ transform: [{ rotate: rotation }] }}>{children}</Animated.View>;
}
