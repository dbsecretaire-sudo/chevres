import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMouvementReduit } from '@/features/accueil/ferme/animations';
import type { ActionDeLieu } from '@/features/accueil/ferme/actionsLieu';
import { ecartDesBulles, positionsEnArc, rayonDesBulles } from '@/features/accueil/services/bullesFerme';
import { colors } from '@/shared/theme/colors';

const TAILLE = 66;

/** Une bulle qui jaillit du bouton en ressort (un petit rebond à l'arrivée), l'une après l'autre. */
function Bulle({
  action,
  dx,
  dy,
  rang,
  couleur,
  onChoisir,
}: {
  action: ActionDeLieu;
  dx: number;
  dy: number;
  rang: number;
  couleur: string;
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
          // Elle part du bouton (au centre) et gagne sa place.
          transform: [
            { translateX: valeur.interpolate({ inputRange: [0, 1], outputRange: [-dx, 0] }) },
            { translateY: valeur.interpolate({ inputRange: [0, 1], outputRange: [-dy, 0] }) },
            { scale: valeur.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
          ],
        },
      ]}
    >
      <Pressable
        style={[styles.rond, { backgroundColor: couleur }]}
        onPress={() => onChoisir(action)}
        accessibilityRole="button"
        accessibilityLabel={action.titre}
      >
        {action.iconeMci ? (
          <MaterialCommunityIcons name={action.iconeMci} size={32} color={colors.blanc} />
        ) : (
          <Ionicons name={action.icone} size={32} color={colors.blanc} />
        )}
      </Pressable>
      <Text style={styles.libelle} numberOfLines={2}>
        {action.titre}
      </Text>
    </Animated.View>
  );
}

/**
 * Les bulles d'actions d'un bouton, comme dans un jeu de ferme : en arc autour de lui, chacune une icône ronde avec son nom. `centreDeg`
 * dit où elles partent (0 : vers la droite, 180 : vers la gauche) ; elles sont centrées sur le bouton, de centre (`x`, `y`).
 */
export function BullesLieu({
  x,
  y,
  actions,
  centreDeg,
  couleur = colors.primary,
  onChoisir,
}: {
  x: number;
  y: number;
  actions: readonly ActionDeLieu[];
  centreDeg: number;
  /** La couleur des bulles : celle du bouton d'où elles sortent (le vert de la ferme, d'office). */
  couleur?: string;
  onChoisir: (a: ActionDeLieu) => void;
}) {
  const positions = positionsEnArc(
    actions.length,
    rayonDesBulles(actions.length),
    centreDeg,
    ecartDesBulles(actions.length),
  );
  return (
    <View style={[styles.ancre, { left: x, top: y }]} pointerEvents="box-none">
      {actions.map((a, i) => (
        <Bulle
          key={a.cle}
          action={a}
          dx={positions[i].x}
          dy={positions[i].y}
          rang={i}
          couleur={couleur}
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
