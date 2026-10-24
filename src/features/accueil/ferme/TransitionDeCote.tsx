import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, useWindowDimensions } from 'react-native';
import { COTES_DE_LA_FERME, type CoteDeLAccueil } from '@/features/accueil/ferme/dernierCote';

/** Combien de temps (ms) dure le glissement d'un côté de la ferme à l'autre. */
const DUREE_GLISSEMENT = 320;

/**
 * Le passage d'un côté de la ferme à l'autre (l'exploitation, le travail du produit, l'agritourisme) : le nouveau côté glisse en douceur depuis
 * celui vers lequel on va (à droite pour le suivant, à gauche pour le précédent) en apparaissant, au lieu de remplacer l'ancien d'un coup. Rien ne
 * bouge à l'ouverture, ni pour qui a demandé de réduire les animations.
 */
export function TransitionDeCote({ cote, children }: { cote: CoteDeLAccueil; children: ReactNode }) {
  const { width } = useWindowDimensions();
  const precedent = useRef(cote);
  const reduit = useRef(false);
  const [decalage] = useState(() => new Animated.Value(0));
  const [opacite] = useState(() => new Animated.Value(1));

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((valeur) => {
        reduit.current = valeur;
      })
      .catch(() => undefined);
  }, []);

  // Avant l'affichage du nouveau côté : on le place de côté, invisible, pour qu'il n'apparaisse jamais d'un coup en place avant de glisser.
  useLayoutEffect(() => {
    if (precedent.current === cote) return;
    const sens = COTES_DE_LA_FERME.indexOf(cote) > COTES_DE_LA_FERME.indexOf(precedent.current) ? 1 : -1;
    precedent.current = cote;
    if (reduit.current) return;
    decalage.setValue(sens * width * 0.3);
    opacite.setValue(0);
    Animated.parallel([
      Animated.timing(decalage, {
        toValue: 0,
        duration: DUREE_GLISSEMENT,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacite, { toValue: 1, duration: DUREE_GLISSEMENT * 0.8, useNativeDriver: true }),
    ]).start();
  }, [cote, width, decalage, opacite]);

  return <Animated.View style={{ flex: 1, opacity: opacite, transform: [{ translateX: decalage }] }}>{children}</Animated.View>;
}
