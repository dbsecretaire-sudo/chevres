import { useEffect, useRef } from 'react';
import { Pressable, type ScrollView, Text } from 'react-native';
import { DefilementFleches } from '@/shared/components/DefilementFleches';
import { styles } from '@/shared/styles/etablissements/SelecteurEspece.styles';

/** Espace laissé à gauche de la puce active quand on fait défiler jusqu'à elle. */
const MARGE_DEFILEMENT = 24;

export interface Puce<T extends string> {
  valeur: T;
  label: string;
}

interface Props<T extends string> {
  puces: Puce<T>[];
  /** Puce active. */
  valeur: T;
  onChoisir: (valeur: T) => void;
}

/**
 * Puces de choix sur une seule ligne, qui défile s'il y en a trop (avec une flèche tant qu'il reste du contenu de
 * chaque côté) et qui amène la puce active dans la vue.
 */
export function PucesDefilantes<T extends string>({ puces, valeur, onChoisir }: Props<T>) {
  const defilement = useRef<ScrollView>(null);
  const positions = useRef<Record<string, number>>({});

  const amenerDansLaVue = (x: number | undefined, anime: boolean) => {
    if (x !== undefined)
      defilement.current?.scrollTo({ x: Math.max(0, x - MARGE_DEFILEMENT), animated: anime });
  };

  // La puce active reste visible quand elle change.
  useEffect(() => amenerDansLaVue(positions.current[valeur], true), [valeur]);

  return (
    <DefilementFleches scrollRef={defilement} contentContainerStyle={styles.ligneDefilante}>
      {puces.map((p) => {
        const active = p.valeur === valeur;
        return (
          <Pressable
            key={p.valeur}
            onLayout={(e) => {
              positions.current[p.valeur] = e.nativeEvent.layout.x;
              if (active) amenerDansLaVue(e.nativeEvent.layout.x, false);
            }}
            style={[styles.puce, active && styles.puceActive]}
            onPress={() => !active && onChoisir(p.valeur)}
          >
            <Text style={[styles.texte, active && styles.texteActif]}>{p.label}</Text>
          </Pressable>
        );
      })}
    </DefilementFleches>
  );
}
