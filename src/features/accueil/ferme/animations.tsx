import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';

// Les animations de l'accueil « ferme » : légères (quelques valeurs animées, pas d'image), et coupées quand l'appareil demande de
// réduire les animations. Aucune n'est une « interaction » (`isInteraction: false`) : l'accueil reste monté derrière les autres écrans,
// et une animation qui boucle en interaction bloquerait pour toujours le rendu des listes (FlatList) des écrans ouverts par-dessus.

/** Vrai quand l'appareil demande de réduire les animations : l'accueil reste fixe. */
export function useMouvementReduit(): boolean {
  const [reduit, setReduit] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduit)
      .catch(() => undefined);
  }, []);
  return reduit;
}

/** Une vue qui apparaît en fondu en montant un peu, après `delai` ms (les boutons du menu se posent l'un après l'autre). */
export function Apparition({
  delai = 0,
  children,
  style,
}: {
  delai?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const reduit = useMouvementReduit();
  const [valeur] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduit) {
      valeur.setValue(1);
      return;
    }
    const animation = Animated.timing(valeur, {
      toValue: 1,
      duration: 380,
      delay: delai,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [delai, reduit, valeur]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: valeur,
          transform: [{ translateY: valeur.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Une vue qui pulse doucement tant que `actif` (une échéance en retard attire l'œil). */
export function Pulsation({
  actif,
  children,
  style,
}: {
  actif: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const reduit = useMouvementReduit();
  const [valeur] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!actif || reduit) {
      valeur.setValue(0);
      return;
    }
    const boucle = Animated.loop(
      Animated.sequence([
        Animated.timing(valeur, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(valeur, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    );
    boucle.start();
    return () => boucle.stop();
  }, [actif, reduit, valeur]);
  return (
    <Animated.View
      style={[
        style,
        { transform: [{ scale: valeur.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * Une vue qui se balade : elle va et vient de `amplitude` points, avec un petit saut à chaque pas (une chèvre dans son enclos). `duree`
 * varie d'une chèvre à l'autre pour qu'elles ne marchent pas en rang.
 */
export function Balade({
  amplitude = 10,
  amplitudeY = 0,
  duree = 3200,
  children,
}: {
  amplitude?: number;
  /** De combien l'animal avance et recule aussi (haut-bas), à son propre rythme : il se promène au lieu d'aller et venir sur une ligne. */
  amplitudeY?: number;
  duree?: number;
  children: ReactNode;
}) {
  const reduit = useMouvementReduit();
  const [valeur] = useState(() => new Animated.Value(0));
  const [profondeur] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduit || amplitudeY === 0) return;
    // Un second va-et-vient, plus lent et décalé : avec le premier, la trajectoire dessine une courbe.
    const dureeY = Math.round(duree * 1.37);
    const boucle = Animated.loop(
      Animated.sequence([
        Animated.timing(profondeur, {
          toValue: 1,
          duration: dureeY,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(profondeur, {
          toValue: 0,
          duration: dureeY,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    );
    boucle.start();
    return () => boucle.stop();
  }, [amplitudeY, duree, profondeur, reduit]);
  useEffect(() => {
    if (reduit) return;
    const boucle = Animated.loop(
      Animated.sequence([
        Animated.timing(valeur, {
          toValue: 1,
          duration: duree,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(valeur, {
          toValue: 0,
          duration: duree,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    );
    boucle.start();
    return () => boucle.stop();
  }, [duree, reduit, valeur]);
  return (
    <Animated.View
      style={{
        transform: [
          { translateX: valeur.interpolate({ inputRange: [0, 1], outputRange: [-amplitude, amplitude] }) },
          // Un petit saut à chaque demi-parcours.
          {
            translateY: valeur.interpolate({
              inputRange: [0, 0.25, 0.5, 0.75, 1],
              outputRange: [0, -3, 0, -3, 0],
            }),
          },
          {
            translateY: profondeur.interpolate({
              inputRange: [0, 1],
              outputRange: [-amplitudeY, amplitudeY],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

/** Une barre qui se remplit jusqu'à `ratio` (0 à 1) à l'affichage et à chaque changement. */
export function useRemplissage(ratio: number): Animated.AnimatedInterpolation<string> {
  const reduit = useMouvementReduit();
  const [valeur] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduit) {
      valeur.setValue(ratio);
      return;
    }
    const animation = Animated.timing(valeur, {
      toValue: ratio,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [ratio, reduit, valeur]);
  return valeur.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
}

/** Une vue qui rebondit une fois quand `declencheur` devient vrai (le coffre s'ouvre quand tous les papiers sont à jour). */
export function Rebond({ declencheur, children }: { declencheur: boolean; children: ReactNode }) {
  const reduit = useMouvementReduit();
  const [valeur] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!declencheur || reduit) return;
    const animation = Animated.sequence([
      Animated.timing(valeur, { toValue: 1, duration: 220, useNativeDriver: true, isInteraction: false }),
      Animated.spring(valeur, { toValue: 0, friction: 3, useNativeDriver: true, isInteraction: false }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [declencheur, reduit, valeur]);
  return (
    <Animated.View
      style={{ transform: [{ scale: valeur.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }] }}
    >
      {children}
    </Animated.View>
  );
}
