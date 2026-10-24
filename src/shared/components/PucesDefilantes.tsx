import { useEffect, useRef, useState } from 'react';
import { Pressable, type ScrollView, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BadgeAlerte } from '@/shared/components/BadgeAlerte';
import { DefilementFleches } from '@/shared/components/DefilementFleches';
import { InfoModal } from '@/shared/components/InfoModal';
import { useAccentColor, useAccentSoftColor } from '@/shared/theme/AccentColorContext';
import { colors } from '@/shared/theme/colors';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';
import { styles } from '@/shared/styles/etablissements/SelecteurEspece.styles';

/** Espace laissé à gauche de la puce active quand on fait défiler jusqu'à elle. */
const MARGE_DEFILEMENT = 24;

export interface Puce<T extends string> {
  valeur: T;
  label: string;
  /** Une explication : un « ? » dans la puce l'ouvre dans une fenêtre (le nom de la puce, sans son effectif, en titre). */
  aide?: string;
  /** Un « ! » rouge dans la puce : ce qui est à faire se trouve dans cet onglet. */
  badge?: boolean;
}

interface Props<T extends string> {
  puces: Puce<T>[];
  /** Puce active. */
  valeur: T;
  onChoisir: (valeur: T) => void;
}

/**
 * Puces de choix sur une seule ligne, qui défile s'il y en a trop (avec une flèche tant qu'il reste du contenu de
 * chaque côté) et qui amène la puce active dans la vue. Elles suivent la couleur d'accent de l'écran (bleue dans un ajout).
 */
export function PucesDefilantes<T extends string>({ puces, valeur, onChoisir }: Props<T>) {
  const accent = useAccentColor();
  const comptable = useDispositionComptable();
  const accentClair = useAccentSoftColor();
  const defilement = useRef<ScrollView>(null);
  const positions = useRef<Record<string, number>>({});
  const [aideOuverte, setAideOuverte] = useState<Puce<T> | null>(null);

  const amenerDansLaVue = (x: number | undefined, anime: boolean) => {
    if (x !== undefined)
      defilement.current?.scrollTo({ x: Math.max(0, x - MARGE_DEFILEMENT), animated: anime });
  };

  // La puce active reste visible quand elle change.
  useEffect(() => amenerDansLaVue(positions.current[valeur], true), [valeur]);

  return (
    <>
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
              style={[
                styles.puce,
                { backgroundColor: accentClair, borderColor: accentClair },
                active && { backgroundColor: accent, borderColor: accent },
                comptable && { paddingVertical: 4, paddingHorizontal: 10, minHeight: 0 },
                p.aide || p.badge ? { flexDirection: 'row', alignItems: 'center', gap: 6 } : null,
              ]}
              onPress={() => !active && onChoisir(p.valeur)}
            >
              <Text style={[styles.texte, comptable && { fontSize: 13 }, active && { color: colors.blanc }]}>{p.label}</Text>
              {p.badge ? <BadgeAlerte /> : null}
              {p.aide ? (
                <Pressable onPress={() => setAideOuverte(p)} hitSlop={8} accessibilityLabel={p.label}>
                  <Ionicons
                    name="help-circle-outline"
                    size={18}
                    color={active ? colors.blanc : colors.textMuted}
                  />
                </Pressable>
              ) : null}
            </Pressable>
          );
        })}
      </DefilementFleches>
      <InfoModal
        visible={!!aideOuverte}
        title={(aideOuverte?.label ?? '').replace(/\s*\(\d+\)$/, '')}
        message={aideOuverte?.aide}
        onClose={() => setAideOuverte(null)}
      />
    </>
  );
}
