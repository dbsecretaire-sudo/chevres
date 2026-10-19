import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMouvementReduit } from '@/features/accueil/ferme/animations';
import type { ActionDeLieu } from '@/features/accueil/ferme/actionsLieu';
import { positionsEnEventail } from '@/features/accueil/services/carteFerme';
import { colors } from '@/shared/theme/colors';

/** La distance entre le centre du lieu et ses bulles. */
const RAYON = 140;
const TAILLE = 66;

/** Une bulle qui jaillit du lieu en ressort (un petit rebond à l'arrivée), l'une après l'autre. */
function Bulle({
  action,
  dx,
  dy,
  rang,
  onChoisir,
}: {
  action: ActionDeLieu;
  dx: number;
  dy: number;
  rang: number;
  onChoisir: (a: ActionDeLieu) => void;
}) {
  const reduit = useMouvementReduit();
  const [valeur] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduit) {
      valeur.setValue(1);
      return;
    }
    const animation = Animated.sequence([
      Animated.delay(rang * 70),
      Animated.spring(valeur, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
        isInteraction: false,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [rang, reduit, valeur]);
  return (
    <Animated.View
      style={[
        styles.bulle,
        {
          left: dx - TAILLE / 2,
          top: dy - TAILLE / 2,
          opacity: valeur.interpolate({
            inputRange: [0, 0.4, 1],
            outputRange: [0, 1, 1],
            extrapolate: 'clamp',
          }),
          // Elle part du lieu (au centre) et monte à sa place.
          transform: [
            { translateX: valeur.interpolate({ inputRange: [0, 1], outputRange: [-dx, 0] }) },
            { translateY: valeur.interpolate({ inputRange: [0, 1], outputRange: [-dy, 0] }) },
            { scale: valeur.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
          ],
        },
      ]}
    >
      <Pressable
        style={styles.rond}
        onPress={() => onChoisir(action)}
        accessibilityRole="button"
        accessibilityLabel={action.titre}
      >
        <Ionicons name={action.icone} size={32} color={colors.blanc} />
      </Pressable>
      <Text style={styles.libelle} numberOfLines={2}>
        {action.titre}
      </Text>
    </Animated.View>
  );
}

/**
 * Les bulles d'actions d'un lieu, comme dans un jeu de ferme : en éventail au-dessus du lieu, chacune une icône ronde avec son nom. Elles
 * sont posées sur la carte (elles suivent son glissement), centrées sur le lieu de centre (`x`, `y`).
 */
export function BullesLieu({
  x,
  y,
  actions,
  onChoisir,
}: {
  x: number;
  y: number;
  actions: readonly ActionDeLieu[];
  onChoisir: (a: ActionDeLieu) => void;
}) {
  const positions = positionsEnEventail(actions.length, RAYON);
  return (
    <View style={[styles.ancre, { left: x, top: y }]} pointerEvents="box-none">
      {actions.map((a, i) => (
        <Bulle
          key={a.cle}
          action={a}
          dx={positions[i].x}
          dy={positions[i].y}
          rang={i}
          onChoisir={onChoisir}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  ancre: { position: 'absolute', width: 0, height: 0 },
  bulle: { position: 'absolute', width: 96, marginLeft: -(96 - TAILLE) / 2, alignItems: 'center', gap: 3 },
  rond: {
    width: TAILLE,
    height: TAILLE,
    borderRadius: TAILLE / 2,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.blanc,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  libelle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    overflow: 'hidden',
  },
});
