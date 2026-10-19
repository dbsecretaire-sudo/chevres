import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMouvementReduit } from '@/features/accueil/ferme/animations';
import { colors } from '@/shared/theme/colors';

interface Props {
  /** Le dessin du camion (il regarde vers la gauche) et celui de sa bulle (ce qu'il charge ou apporte). */
  emoji: string;
  bulle: string;
  /** Le sens de la route : le camion roule en largeur (`x`) ou en hauteur (`y`). */
  axe: 'x' | 'y';
  /** D'où il vient, en points depuis l'endroit où il s'arrête (négatif : de la gauche ou du haut ; positif : de la droite ou du bas). */
  depart: number;
  /** Le nom accessible du camion (le récolteur, le livreur) : un appui l'ouvre. */
  libelle: string;
  /** Pour décaler les camions entre eux : le temps qu'il attend avant son premier passage (ms). */
  delai?: number;
  onAppui: () => void;
}

/**
 * Un camion vivant sur sa route : il arrive à son bâtiment, s'arrête (une bulle apparaît : le lait à prendre, le foin livré), puis repart,
 * et revient plus tard. Le récolteur du lait et le livreur de foin en sont deux. Il se place à l'endroit où il s'arrête : la carte le pose.
 */
export function CamionVivant({ emoji, bulle, axe, depart, libelle, delai = 0, onAppui }: Props) {
  const reduit = useMouvementReduit();
  // 0 : au départ de la route ; 1 : arrêté à son bâtiment.
  const [avance] = useState(() => new Animated.Value(reduit ? 1 : 0));
  // Sur une route horizontale, le dessin (tourné vers la gauche) est retourné quand le camion va vers la droite.
  const [sens] = useState(() => new Animated.Value(depart < 0 ? -1 : 1));
  useEffect(() => {
    if (reduit) {
      avance.setValue(1);
      return;
    }
    const aller = (valeur: number, duree: number) =>
      Animated.timing(avance, { toValue: valeur, duration: duree, easing: Easing.inOut(Easing.quad), useNativeDriver: true, isInteraction: false });
    const orientation = (valeur: number) => Animated.timing(sens, { toValue: valeur, duration: 0, useNativeDriver: true, isInteraction: false });
    const versLaDroite = depart < 0;
    const boucle = Animated.loop(
      Animated.sequence([
        orientation(axe === 'x' && versLaDroite ? -1 : 1),
        aller(1, 6000),
        Animated.delay(7000),
        orientation(axe === 'x' && versLaDroite ? 1 : -1),
        aller(0, 6000),
        Animated.delay(9000),
      ]),
    );
    const lancement = Animated.sequence([Animated.delay(delai), boucle]);
    lancement.start();
    return () => lancement.stop();
  }, [avance, axe, delai, depart, reduit, sens]);
  const translation = avance.interpolate({ inputRange: [0, 1], outputRange: [depart, 0] });
  return (
    <Animated.View style={[styles.camion, { transform: [axe === 'x' ? { translateX: translation } : { translateY: translation }] }]}>
      <Pressable onPress={onAppui} accessibilityRole="button" accessibilityLabel={libelle} hitSlop={8}>
        {/* La bulle : elle n'est là que camion arrêté. */}
        <Animated.View style={[styles.bulle, { opacity: avance.interpolate({ inputRange: [0.92, 1], outputRange: [0, 1], extrapolate: 'clamp' }) }]}>
          <Text style={styles.bulleEmoji}>{bulle}</Text>
          <View style={styles.queue} />
        </Animated.View>
        <Animated.View style={{ transform: [{ scaleX: axe === 'x' ? sens : 1 }] }}>
          <Text style={styles.emoji} accessibilityElementsHidden importantForAccessibility="no">
            {emoji}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  camion: { position: 'absolute', alignItems: 'center' },
  emoji: { fontSize: 40 },
  bulle: { alignSelf: 'center', alignItems: 'center', marginBottom: 2 },
  bulleEmoji: { fontSize: 22, backgroundColor: colors.blanc, borderRadius: 12, borderWidth: 2, borderColor: colors.border, paddingHorizontal: 6, paddingVertical: 2, overflow: 'hidden' },
  queue: { width: 10, height: 10, backgroundColor: colors.blanc, borderRightWidth: 2, borderBottomWidth: 2, borderColor: colors.border, transform: [{ rotate: '45deg' }], marginTop: -6 },
});
