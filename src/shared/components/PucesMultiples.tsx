import { Pressable, Text, View } from 'react-native';
import { useAccentColor, useAccentSoftColor } from '@/shared/theme/AccentColorContext';
import { colors } from '@/shared/theme/colors';
import { styles } from '@/shared/styles/etablissements/SelecteurEspece.styles';

export interface PuceMultiple<T extends string | number> {
  valeur: T;
  label: string;
}

interface Props<T extends string | number> {
  puces: PuceMultiple<T>[];
  /** Les puces actives : on peut en cocher plusieurs. */
  valeurs: T[];
  onChange: (valeurs: T[]) => void;
}

/**
 * Puces de choix multiple, sur plusieurs lignes : toucher une puce l'ajoute ou la retire de la sélection. Elles suivent
 * la couleur d'accent de l'écran (bleue dans un ajout).
 */
export function PucesMultiples<T extends string | number>({ puces, valeurs, onChange }: Props<T>) {
  const accent = useAccentColor();
  const accentClair = useAccentSoftColor();
  const basculer = (valeur: T) =>
    onChange(valeurs.includes(valeur) ? valeurs.filter((v) => v !== valeur) : [...valeurs, valeur]);

  return (
    <View style={styles.ligne}>
      {puces.map((p) => {
        const active = valeurs.includes(p.valeur);
        return (
          <Pressable
            key={p.valeur}
            style={[
              styles.puce,
              { backgroundColor: accentClair, borderColor: accentClair },
              active && { backgroundColor: accent, borderColor: accent },
            ]}
            onPress={() => basculer(p.valeur)}
          >
            <Text style={[styles.texte, active && { color: colors.blanc }]}>{p.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
